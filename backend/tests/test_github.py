import hashlib
import hmac
import json
from datetime import datetime, timedelta, timezone

from conftest import WEBHOOK_SECRET


def sign(body: bytes, secret: str = WEBHOOK_SECRET) -> str:
    return "sha256=" + hmac.new(secret.encode(), body, hashlib.sha256).hexdigest()


def post_webhook(client, event: str, payload: dict | None = None, signature="auto"):
    body = json.dumps(payload or {"ref": "refs/heads/main"}).encode()
    headers = {"X-GitHub-Event": event, "Content-Type": "application/json"}
    if signature == "auto":
        headers["X-Hub-Signature-256"] = sign(body)
    elif signature is not None:
        headers["X-Hub-Signature-256"] = signature
    return client.post("/api/github/webhook", content=body, headers=headers)


# ---- webhook ---------------------------------------------------------------

def test_webhook_rejects_missing_signature(client):
    r = post_webhook(client, "push", signature=None)
    assert r.status_code == 401


def test_webhook_rejects_wrong_signature(client):
    assert post_webhook(client, "push", signature="sha256=" + "0" * 64).status_code == 401
    bad_secret = sign(b'{"ref": "refs/heads/main"}', "otro-secreto")
    assert post_webhook(client, "push", signature=bad_secret).status_code == 401
    assert post_webhook(client, "push", signature="no-prefijo").status_code == 401


def test_webhook_signature_is_over_exact_body(client):
    body = b'{"a": 1}'
    r = client.post(
        "/api/github/webhook",
        content=b'{"a": 2}',
        headers={"X-GitHub-Event": "push", "X-Hub-Signature-256": sign(body)},
    )
    assert r.status_code == 401


def test_webhook_ping_is_200_and_does_not_sync(client, net):
    r = post_webhook(client, "ping", {"zen": "hola"})
    assert r.status_code == 200
    assert net.github_calls == 0


def test_webhook_push_triggers_background_refresh(client, net):
    assert client.get("/api/repos").json() == {"repos": [], "synced_at": None}
    r = post_webhook(client, "push")
    assert r.status_code == 200 and r.json()["refreshing"] is True
    repos = client.get("/api/repos").json()
    assert [x["name"] for x in repos["repos"]] == ["RUIDO", "etl-vise"]


def test_webhook_repository_event_also_refreshes(client):
    assert post_webhook(client, "repository").status_code == 200
    assert len(client.get("/api/repos").json()["repos"]) == 2


def test_webhook_ignores_other_events(client, net):
    r = post_webhook(client, "issues")
    assert r.status_code == 200 and r.json()["ignored"] is True
    assert net.github_calls == 0


def test_webhook_without_configured_secret_is_refused(make_client):
    client = make_client(github_webhook_secret="")
    r = post_webhook(client, "ping", signature="sha256=" + "0" * 64)
    assert r.status_code == 503 and r.json()["code"] == "webhook_not_configured"


# ---- repos -------------------------------------------------------------------

def test_repos_empty_cache(client):
    assert client.get("/api/repos").json() == {"repos": [], "synced_at": None}


def test_repos_only_portfolio_topic_with_real_language_percentages(client):
    post_webhook(client, "push")
    data = client.get("/api/repos").json()
    assert data["synced_at"] is not None
    ruido = data["repos"][0]
    assert ruido["name"] == "RUIDO"
    assert ruido["description"] == "Portafolio"
    assert ruido["stars"] == 3
    assert ruido["topics"] == ["portfolio", "nextjs"]
    assert ruido["homepage"] == "https://ruido.example"
    assert ruido["pushed_at"].startswith("2026-10-01")
    assert ruido["languages"] == [
        {"name": "TypeScript", "bytes": 7500, "percent": 75.0},
        {"name": "CSS", "bytes": 2500, "percent": 25.0},
    ]
    other = data["repos"][1]
    assert other["homepage"] is None  # cadena vacia -> None
    assert "otro-repo" not in [r["name"] for r in data["repos"]]


def test_repos_keep_cache_when_github_fails(client, net):
    post_webhook(client, "push")
    first = client.get("/api/repos").json()
    net.github_down = True
    post_webhook(client, "push")
    assert client.get("/api/repos").json() == first  # cache intacta


def test_repos_refresh_drops_repos_that_lost_the_topic(client, net):
    post_webhook(client, "push")
    net.repo_nodes = net.repo_nodes[:1]
    post_webhook(client, "push")
    assert [r["name"] for r in client.get("/api/repos").json()["repos"]] == ["RUIDO"]


def test_refresh_without_token_is_a_noop(make_client, net):
    client = make_client(github_token="")
    post_webhook(client, "push")
    assert net.github_calls == 0
    assert client.get("/api/repos").json()["repos"] == []


# ---- contribuciones ----------------------------------------------------------

def test_contributions_ok(client, net):
    r = client.get("/api/contributions")
    assert r.status_code == 200
    data = r.json()
    assert data["user"] == "nieldro"
    assert data["total"] == 12
    assert data["stale"] is False
    assert data["synced_at"]
    assert data["weeks"][0][1] == {"date": "2026-10-05", "count": 7, "level": 4}
    assert data["weeks"][1][0]["level"] == 2


def test_contributions_are_cached_between_requests(client, net):
    client.get("/api/contributions")
    client.get("/api/contributions")
    assert net.github_calls == 1


def test_contributions_serve_last_good_value_when_github_fails(make_client, net):
    client = make_client(contributions_ttl_seconds=60)
    good = client.get("/api/contributions").json()
    # Vence la cache y GitHub se cae.
    svc = client.app.state.github
    svc._contrib["synced_at"] = datetime.now(timezone.utc) - timedelta(hours=2)
    net.github_down = True
    r = client.get("/api/contributions")
    assert r.status_code == 200
    stale = r.json()
    assert stale["stale"] is True
    assert stale["total"] == good["total"] and stale["weeks"] == good["weeks"]
    assert stale["synced_at"] != good["synced_at"]  # conserva la fecha del ultimo valor bueno


def test_contributions_last_good_value_survives_restart_via_db(make_client, net):
    client = make_client(contributions_ttl_seconds=0)  # siempre intenta refrescar
    client.get("/api/contributions")
    svc = client.app.state.github
    svc._contrib = None  # simula proceso nuevo: la memoria esta vacia, la tabla no
    net.github_down = True
    data = client.get("/api/contributions").json()
    assert data["stale"] is True and data["total"] == 12


def test_contributions_503_when_no_data_at_all(client, net):
    net.github_down = True
    r = client.get("/api/contributions")
    assert r.status_code == 503 and r.json()["code"] == "github_unavailable"
