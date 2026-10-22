"""Ninguna ruta, tabla ni log debe contener la IP del visitante en claro."""
import logging

from sqlalchemy import text

from conftest import SALT

IP = "203.0.113.77"
IP_V6 = "2001:db8::77"
HEADERS = {
    "X-Forwarded-For": IP,
    "x-vercel-ip-country": "CO",
    "user-agent": "Mozilla/5.0 (Windows NT 10.0) Chrome/120",
    "x-real-ip": IP,
    "cf-connecting-ip": IP,
}


def dump_database(engine) -> str:
    """Todo el contenido de todas las tablas, como texto."""
    chunks = []
    with engine.connect() as conn:
        tables = [r[0] for r in conn.execute(text("SELECT name FROM sqlite_master WHERE type='table'"))]
        assert {"sessions", "events", "repos_cache", "leads"} <= set(tables)
        for t in tables:
            chunks.append(t)
            for row in conn.execute(text(f'SELECT * FROM "{t}"')):
                chunks.append(repr(tuple(row)))
    return "\n".join(chunks)


def exercise_everything(client):
    """Llama a todas las rutas que reciben trafico de visitantes."""
    r = client.post("/api/visit", headers=HEADERS)
    sid = r.json()["session_id"]
    responses = [
        r,
        client.post("/api/event", json={"session_id": sid, "section": "ruido", "depth": 5}, headers=HEADERS),
        client.get("/api/stats", headers=HEADERS),
        client.get("/api/health", headers=HEADERS),
        client.get("/api/repos", headers=HEADERS),
        client.get("/api/contributions", headers=HEADERS),
        client.post("/api/ask", json={"question": "hola"}, headers=HEADERS),
        client.post("/api/quote", json={"service": "ETL", "contact": "a@b.co"}, headers=HEADERS),
        client.post("/api/quote", json={"service": ""}, headers=HEADERS),  # 422
        client.post("/api/event", json={"session_id": sid, "section": "x", "depth": 5}, headers=HEADERS),  # 422
        client.post("/api/github/webhook", content=b"{}", headers={**HEADERS, "X-GitHub-Event": "push"}),  # 401
    ]
    return responses


def test_ip_never_in_database_responses_or_logs(make_client, caplog):
    caplog.set_level(logging.DEBUG)
    client = make_client(llm_provider=None)
    responses = exercise_everything(client)

    # Las respuestas (incluidos errores) no la devuelven.
    for resp in responses:
        assert IP not in resp.text, resp.request.url
        assert IP not in str(dict(resp.headers))

    # Ninguna tabla la guarda.
    assert IP not in dump_database(client.app.state.engine)

    # Ningun log la contiene.
    assert IP not in caplog.text
    assert IP not in "".join(rec.getMessage() for rec in caplog.records)


def test_ip_only_lives_as_hash_inside_rate_limiter(make_client):
    client = make_client()
    exercise_everything(client)
    limiter = client.app.state.limiter
    assert limiter._hits, "el rate limit debio registrar al menos un intento"
    for key in limiter._hits:
        assert IP not in key and SALT not in key
        bucket, digest = key.split(":")
        assert len(digest) == 64 and int(digest, 16) >= 0  # hex de SHA-256


def test_ipv6_and_direct_client_also_stay_private(make_client, caplog):
    caplog.set_level(logging.DEBUG)
    client = make_client()
    client.post("/api/quote", json={"service": "ETL", "contact": "a@b.co"}, headers={"X-Forwarded-For": IP_V6})
    assert IP_V6 not in caplog.text
    assert IP_V6 not in dump_database(client.app.state.engine)
    assert all(IP_V6 not in k for k in client.app.state.limiter._hits)
    # Sin X-Forwarded-For se usa el cliente directo; tampoco aparece en claro.
    client.post("/api/quote", json={"service": "ETL", "contact": "a@b.co"})
    assert all("testclient" not in k for k in client.app.state.limiter._hits)


def test_n8n_payload_does_not_carry_the_ip(make_client, net):
    client = make_client()
    client.post("/api/quote", json={"service": "ETL", "contact": "a@b.co"}, headers=HEADERS)
    assert IP not in str(net.n8n_calls)


def test_visit_table_has_no_ip_column(client):
    from app.models import Event, Lead, RepoCache, VisitSession

    for model in (VisitSession, Event, RepoCache, Lead):
        cols = {c.name for c in model.__table__.columns}
        assert not any("ip" == c or c.startswith("ip_") or c.endswith("_ip") for c in cols), model


def test_no_cookies_are_set(client):
    r = client.post("/api/visit", headers=HEADERS)
    assert "set-cookie" not in r.headers
