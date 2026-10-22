from sqlmodel import Session, select

from app.models import Lead

VALID = {
    "service": "Dashboards en Power BI",
    "budget": "2-5 millones COP",
    "deadline": "30 dias",
    "contact": "cliente@example.com",
    "message": "Necesito un tablero de ventas.",
}


def leads(client) -> list[Lead]:
    with Session(client.app.state.engine) as s:
        return list(s.exec(select(Lead)).all())


def test_quote_saves_lead_and_notifies_n8n(client, net):
    r = client.post("/api/quote", json=VALID)
    assert r.status_code == 200
    assert r.json() == {"ok": True, "notified": True}
    [lead] = leads(client)
    assert lead.service == VALID["service"] and lead.contact == VALID["contact"]
    assert len(net.n8n_calls) == 1
    sent = net.n8n_calls[0]
    assert sent["service"] == VALID["service"] and sent["contact"] == VALID["contact"]
    assert sent["lead_id"] == lead.id


def test_quote_minimum_fields(client):
    r = client.post("/api/quote", json={"service": "ETL", "contact": "+57 300 000 0000"})
    assert r.status_code == 200
    [lead] = leads(client)
    assert lead.budget is None and lead.message is None


def test_quote_n8n_retries_once_and_succeeds(client, net):
    net.n8n_mode = "flaky"
    r = client.post("/api/quote", json=VALID)
    assert r.json() == {"ok": True, "notified": True}
    assert len(net.n8n_calls) == 2


def test_quote_n8n_error_still_saves_lead(client, net):
    net.n8n_mode = "error500"
    r = client.post("/api/quote", json=VALID)
    assert r.status_code == 200
    assert r.json() == {"ok": True, "notified": False}
    assert len(net.n8n_calls) == 2  # un intento + un reintento
    assert len(leads(client)) == 1


def test_quote_n8n_unreachable_still_saves_lead(client, net):
    net.n8n_mode = "down"
    r = client.post("/api/quote", json=VALID)
    assert r.status_code == 200 and r.json() == {"ok": True, "notified": False}
    assert len(leads(client)) == 1


def test_quote_without_n8n_url(make_client, net):
    client = make_client(n8n_quote_webhook="")
    r = client.post("/api/quote", json=VALID)
    assert r.status_code == 200 and r.json() == {"ok": True, "notified": False}
    assert net.n8n_calls == []
    assert len(leads(client)) == 1


def test_quote_validation(client):
    assert client.post("/api/quote", json={"contact": "a@b.co"}).status_code == 422  # sin service
    assert client.post("/api/quote", json={"service": "ETL"}).status_code == 422  # sin contact
    assert client.post("/api/quote", json={"service": "  ", "contact": "a@b.co"}).status_code == 422
    assert client.post("/api/quote", json={"service": "ETL", "contact": ""}).status_code == 422
    assert client.post("/api/quote", json={**VALID, "service": "x" * 101}).status_code == 422
    assert client.post("/api/quote", json={**VALID, "contact": "x" * 201}).status_code == 422
    assert client.post("/api/quote", json={**VALID, "budget": "x" * 101}).status_code == 422
    assert client.post("/api/quote", json={**VALID, "message": "x" * 2001}).status_code == 422
    assert leads(client) == []


def test_quote_rate_limit(make_client):
    client = make_client(quote_rate_limit=2)
    headers = {"X-Forwarded-For": "198.51.100.7"}
    assert client.post("/api/quote", json=VALID, headers=headers).status_code == 200
    assert client.post("/api/quote", json=VALID, headers=headers).status_code == 200
    r = client.post("/api/quote", json=VALID, headers=headers)
    assert r.status_code == 429
    assert r.json()["code"] == "rate_limited"
    assert int(r.headers["retry-after"]) > 0
    # otra IP no se ve afectada
    other = client.post("/api/quote", json=VALID, headers={"X-Forwarded-For": "198.51.100.8"})
    assert other.status_code == 200
    assert len(leads(client)) == 3
