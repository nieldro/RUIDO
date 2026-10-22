"""Fixtures: SQLite en memoria y una red simulada (GitHub, n8n, Anthropic)."""
import json
import os

# Nada del entorno de la maquina debe colarse en las pruebas.
for _var in (
    "DATABASE_URL", "ALLOWED_ORIGINS", "RATE_LIMIT_SALT", "GITHUB_TOKEN", "GITHUB_WEBHOOK_SECRET",
    "ANTHROPIC_API_KEY", "LLM_MODEL", "N8N_QUOTE_WEBHOOK", "ENABLE_SCHEDULER", "GITHUB_USER",
):
    os.environ.pop(_var, None)

import httpx  # noqa: E402
import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

from app.config import Settings  # noqa: E402
from app.main import create_app  # noqa: E402

WEBHOOK_SECRET = "whsec-test"
N8N_URL = "https://n8n.test/webhook/quote"
SALT = "salt-de-pruebas"


def _repo_node(name, topics, langs, stars=0, homepage="", pushed="2026-10-01T10:00:00Z", desc=None):
    return {
        "name": name,
        "description": desc,
        "stargazerCount": stars,
        "homepageUrl": homepage,
        "pushedAt": pushed,
        "repositoryTopics": {"nodes": [{"topic": {"name": t}} for t in topics]},
        "languages": {"edges": [{"size": s, "node": {"name": n}} for n, s in langs]},
    }


REPO_NODES = [
    _repo_node("RUIDO", ["portfolio", "nextjs"], [("TypeScript", 7500), ("CSS", 2500)], stars=3,
               homepage="https://ruido.example", desc="Portafolio"),
    _repo_node("etl-vise", ["portfolio", "python"], [("Python", 900)], pushed="2026-09-01T10:00:00Z"),
    _repo_node("otro-repo", ["python"], [("Python", 100)]),
]

CALENDAR = {
    "totalContributions": 12,
    "weeks": [
        {"contributionDays": [
            {"date": "2026-10-04", "contributionCount": 0, "contributionLevel": "NONE"},
            {"date": "2026-10-05", "contributionCount": 7, "contributionLevel": "FOURTH_QUARTILE"},
        ]},
        {"contributionDays": [
            {"date": "2026-10-11", "contributionCount": 5, "contributionLevel": "SECOND_QUARTILE"},
        ]},
    ],
}


class FakeNet:
    """Transporte httpx falso que enruta por host. Registra las peticiones."""

    def __init__(self):
        self.github_down = False
        self.n8n_mode = "ok"  # ok | error500 | down | flaky
        self.n8n_calls: list[dict] = []
        self.github_calls = 0
        self.anthropic_calls: list[dict] = []
        self.anthropic_status = 200
        self.repo_nodes = REPO_NODES

    def handler(self, request: httpx.Request) -> httpx.Response:
        host = request.url.host
        if host == "api.github.com":
            return self._github(request)
        if host == "n8n.test":
            return self._n8n(request)
        if host == "api.anthropic.com":
            return self._anthropic(request)
        raise AssertionError(f"Llamada de red inesperada: {request.url}")

    def _github(self, request):
        self.github_calls += 1
        assert request.headers["authorization"] == "Bearer ghp_fake"
        if self.github_down:
            return httpx.Response(502, json={"message": "bad gateway"})
        query = json.loads(request.content)["query"]
        if "contributionCalendar" in query:
            data = {"user": {"contributionsCollection": {"contributionCalendar": CALENDAR}}}
        else:
            data = {"user": {"repositories": {
                "pageInfo": {"hasNextPage": False, "endCursor": None},
                "nodes": self.repo_nodes,
            }}}
        return httpx.Response(200, json={"data": data})

    def _n8n(self, request):
        self.n8n_calls.append(json.loads(request.content))
        if self.n8n_mode == "down":
            raise httpx.ConnectError("n8n caido")
        if self.n8n_mode == "error500":
            return httpx.Response(500)
        if self.n8n_mode == "flaky" and len(self.n8n_calls) == 1:
            return httpx.Response(503)
        return httpx.Response(200, json={"ok": True})

    def _anthropic(self, request):
        body = json.loads(request.content)
        self.anthropic_calls.append({"body": body, "headers": dict(request.headers)})
        if self.anthropic_status != 200:
            return httpx.Response(self.anthropic_status, json={"error": {"message": "x"}})
        return httpx.Response(200, json={"content": [{"type": "text", "text": "Trabaja en VISE."}]})


@pytest.fixture
def net():
    return FakeNet()


@pytest.fixture
def make_client(net):
    clients: list[TestClient] = []

    def factory(**overrides) -> TestClient:
        provider = overrides.pop("llm_provider", None)
        values = dict(
            _env_file=None,
            database_url="sqlite://",
            enable_scheduler=False,
            rate_limit_salt=SALT,
            github_token="ghp_fake",
            github_webhook_secret=WEBHOOK_SECRET,
            anthropic_api_key="",
            n8n_quote_webhook=N8N_URL,
            n8n_retry_delay_seconds=0,
            stats_cache_seconds=0,
        )
        values.update(overrides)
        app = create_app(
            Settings(**values), http_transport=httpx.MockTransport(net.handler), llm_provider=provider
        )
        client = TestClient(app)
        client.__enter__()
        clients.append(client)
        return client

    yield factory
    for c in clients:
        c.__exit__(None, None, None)


@pytest.fixture
def client(make_client):
    return make_client()
