import pytest

from app.services.llm import (
    SYSTEM_PROMPT,
    AnthropicProvider,
    LLMError,
    LLMProvider,
    NullProvider,
    load_cv_context,
)


class EchoProvider(LLMProvider):
    def __init__(self):
        self.calls = []

    async def answer(self, question: str, cv_context: str) -> str:
        self.calls.append((question, cv_context))
        return f"eco: {question}"


class BrokenProvider(LLMProvider):
    async def answer(self, question, cv_context):
        raise LLMError("proveedor caido")


def test_ask_with_null_provider_is_503(client):
    assert isinstance(client.app.state.llm, NullProvider)
    r = client.post("/api/ask", json={"question": "Donde trabaja Daniel?"})
    assert r.status_code == 503
    body = r.json()
    assert body["code"] == "llm_not_configured"
    assert "detail" in body and body["detail"]


def test_null_provider_does_not_consume_rate_limit(make_client):
    client = make_client(ask_rate_limit=1)
    for _ in range(3):
        assert client.post("/api/ask", json={"question": "hola"}).status_code == 503


@pytest.mark.parametrize("question", ["", "   ", "\n\t"])
def test_ask_empty_question_is_422(client, question):
    assert client.post("/api/ask", json={"question": question}).status_code == 422


def test_ask_missing_question_is_422(client):
    assert client.post("/api/ask", json={}).status_code == 422


def test_ask_length_limit(make_client):
    client = make_client(llm_provider=EchoProvider())
    assert client.post("/api/ask", json={"question": "a" * 500}).status_code == 200
    assert client.post("/api/ask", json={"question": "a" * 501}).status_code == 422


def test_ask_passes_question_and_cv_to_provider(make_client):
    provider = EchoProvider()
    client = make_client(llm_provider=provider)
    r = client.post("/api/ask", json={"question": "  Que hizo en VISE?  "})
    assert r.status_code == 200 and r.json() == {"answer": "eco: Que hizo en VISE?"}
    question, cv = provider.calls[0]
    assert question == "Que hizo en VISE?"
    assert "VISE" in cv and "Daniel Alejandro" in cv


def test_ask_rate_limit_per_hashed_ip(make_client):
    client = make_client(llm_provider=EchoProvider(), ask_rate_limit=3)
    mine = {"X-Forwarded-For": "203.0.113.5"}
    for _ in range(3):
        assert client.post("/api/ask", json={"question": "hola"}, headers=mine).status_code == 200
    r = client.post("/api/ask", json={"question": "hola"}, headers=mine)
    assert r.status_code == 429 and r.json()["code"] == "rate_limited"
    assert "retry-after" in r.headers
    other = client.post("/api/ask", json={"question": "hola"}, headers={"X-Forwarded-For": "203.0.113.6"})
    assert other.status_code == 200


def test_ask_provider_failure_is_502_without_leaking(make_client):
    client = make_client(llm_provider=BrokenProvider())
    r = client.post("/api/ask", json={"question": "hola"})
    assert r.status_code == 502 and r.json()["code"] == "llm_error"
    assert "caido" not in r.text


def test_anthropic_provider_activated_by_api_key(make_client, net):
    client = make_client(anthropic_api_key="sk-ant-fake")
    assert isinstance(client.app.state.llm, AnthropicProvider)
    r = client.post("/api/ask", json={"question": "Where does Daniel work?"})
    assert r.status_code == 200 and r.json() == {"answer": "Trabaja en VISE."}

    call = net.anthropic_calls[0]
    body = call["body"]
    assert body["model"] == "claude-haiku-5-5"  # modelo por defecto
    assert body["max_tokens"] == 400
    assert body["messages"] == [{"role": "user", "content": "Where does Daniel work?"}]
    assert call["headers"]["x-api-key"] == "sk-ant-fake"
    # El CV completo va en el system prompt, junto con las reglas estrictas.
    assert load_cv_context() in body["system"]
    assert "ONLY with facts" in body["system"] and "same language" in body["system"]


def test_llm_model_is_configurable(make_client, net):
    client = make_client(anthropic_api_key="k", llm_model="otro-modelo")
    client.post("/api/ask", json={"question": "hola"})
    assert net.anthropic_calls[0]["body"]["model"] == "otro-modelo"


def test_anthropic_http_error_is_502(make_client, net):
    net.anthropic_status = 529
    client = make_client(anthropic_api_key="sk-ant-fake")
    r = client.post("/api/ask", json={"question": "hola"})
    assert r.status_code == 502 and r.json()["code"] == "llm_error"
    assert "sk-ant-fake" not in r.text


def test_cv_context_only_has_provided_facts():
    cv = load_cv_context()
    for fact in ("dapt.torres@gmail.com", "daniel-paez-torres", "nieldro", "56% al 73%", "92%",
                 "Supernumerarios SAS", "SLB Pes Colombia", "Mueblimaquinas", "PL-300", "B1"):
        assert fact in cv
    assert "{" not in SYSTEM_PROMPT.replace("{cv}", "")  # la plantilla solo tiene {cv}
