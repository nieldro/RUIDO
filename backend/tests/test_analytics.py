import asyncio
import uuid

import pytest

from app.routers.analytics import country_from_headers, device_from_user_agent
from app.services.stream import EventBroker, sse_stream

UA_IPHONE = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148"
UA_IPAD = "Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15"
UA_ANDROID_PHONE = "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/120 Mobile Safari/537.36"
UA_ANDROID_TABLET = "Mozilla/5.0 (Linux; Android 14; SM-X900) AppleWebKit/537.36 Chrome/120 Safari/537.36"
UA_DESKTOP = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36"


def test_health(client):
    r = client.get("/api/health")
    assert r.status_code == 200
    assert r.json() == {"ok": True}


@pytest.mark.parametrize(
    "ua,expected",
    [(UA_IPHONE, "mobile"), (UA_IPAD, "tablet"), (UA_ANDROID_PHONE, "mobile"),
     (UA_ANDROID_TABLET, "tablet"), (UA_DESKTOP, "desktop"), ("", "desktop"), (None, "desktop")],
)
def test_device_detection(ua, expected):
    assert device_from_user_agent(ua) == expected


def test_country_headers():
    assert country_from_headers({"x-vercel-ip-country": "co"}) == "CO"
    assert country_from_headers({"cf-ipcountry": "US"}) == "US"
    assert country_from_headers({"x-vercel-ip-country": "CO", "cf-ipcountry": "US"}) == "CO"
    assert country_from_headers({"cf-ipcountry": "XX"}) is None
    assert country_from_headers({"x-vercel-ip-country": "COL"}) is None
    assert country_from_headers({}) is None


def test_visit_returns_session_id_and_stores_country_and_device(client):
    r = client.post("/api/visit", headers={"x-vercel-ip-country": "CO", "user-agent": UA_IPHONE})
    assert r.status_code == 200
    sid = r.json()["session_id"]
    uuid.UUID(sid)  # es un uuid valido

    stats = client.get("/api/stats").json()
    assert stats["visits_today"] == 1
    assert stats["countries"] == [{"country": "CO", "count": 1}]


def test_event_is_stored_and_validated(client):
    sid = client.post("/api/visit").json()["session_id"]
    ok = client.post("/api/event", json={"session_id": sid, "section": "ruido", "depth": 40})
    assert ok.status_code == 200 and ok.json() == {"ok": True}


@pytest.mark.parametrize(
    "payload",
    [
        {"section": "inexistente", "depth": 10},
        {"section": "ruido", "depth": 101},
        {"section": "ruido", "depth": -1},
        {"section": "ruido", "depth": "mucho"},
        {"section": "ruido"},
        {"depth": 10},
    ],
)
def test_event_validation_rejects_bad_payloads(client, payload):
    sid = client.post("/api/visit").json()["session_id"]
    r = client.post("/api/event", json={"session_id": sid, **payload})
    assert r.status_code == 422


def test_event_rejects_bad_or_unknown_session(client):
    r = client.post("/api/event", json={"session_id": "no-es-uuid", "section": "ruido", "depth": 1})
    assert r.status_code == 422
    r = client.post("/api/event", json={"session_id": str(uuid.uuid4()), "section": "ruido", "depth": 1})
    assert r.status_code == 404
    assert r.json()["code"] == "session_not_found"


@pytest.mark.parametrize("section", ["ruido", "limpieza", "historial", "modelo", "archivo", "pipeline", "servicios", "senal"])
def test_event_accepts_every_section(client, section):
    sid = client.post("/api/visit").json()["session_id"]
    assert client.post("/api/event", json={"session_id": sid, "section": section, "depth": 0}).status_code == 200
    assert client.post("/api/event", json={"session_id": sid, "section": section, "depth": 100}).status_code == 200


def test_stats_average_uses_max_depth_per_session_and_section(client):
    a = client.post("/api/visit", headers={"x-vercel-ip-country": "CO"}).json()["session_id"]
    b = client.post("/api/visit", headers={"x-vercel-ip-country": "CO"}).json()["session_id"]
    c = client.post("/api/visit", headers={"x-vercel-ip-country": "MX"}).json()["session_id"]
    for sid, section, depth in [
        (a, "ruido", 10), (a, "ruido", 60), (a, "ruido", 30),  # max a = 60
        (b, "ruido", 20),  # max b = 20  -> promedio ruido = 40
        (c, "modelo", 100),
    ]:
        client.post("/api/event", json={"session_id": sid, "section": section, "depth": depth})

    stats = client.get("/api/stats").json()
    assert stats["visits_today"] == 3
    assert stats["countries"] == [{"country": "CO", "count": 2}, {"country": "MX", "count": 1}]
    assert stats["scroll_depth"]["ruido"] == 40.0
    assert stats["scroll_depth"]["modelo"] == 100.0
    assert stats["scroll_depth"]["senal"] is None
    assert set(stats["scroll_depth"]) == {
        "ruido", "limpieza", "historial", "modelo", "archivo", "pipeline", "servicios", "senal"
    }


def test_stats_are_cached_in_memory(make_client):
    client = make_client(stats_cache_seconds=15)
    client.post("/api/visit")
    assert client.get("/api/stats").json()["visits_today"] == 1
    client.post("/api/visit")
    assert client.get("/api/stats").json()["visits_today"] == 1  # sigue en cache
    client.app.state.stats._expires = 0  # vence la cache
    assert client.get("/api/stats").json()["visits_today"] == 2


def test_stream_refuses_when_full(make_client):
    client = make_client(stream_max_clients=0)
    r = client.get("/api/stream")
    assert r.status_code == 503 and r.json()["code"] == "stream_full"


def test_visit_and_event_are_published_to_stream_anonymously(client):
    broker: EventBroker = client.app.state.broker
    received: list[dict] = []

    async def scenario():
        sub = broker.subscribe()
        assert sub is not None
        # El publish real ocurre en un hilo (endpoint sincrono): lo simulamos asi.
        await asyncio.to_thread(broker.publish, "visit", {"country": "CO", "device": "mobile"})
        await asyncio.to_thread(broker.publish, "event", {"section": "ruido", "depth": 50})
        gen = sse_stream(sub, broker, heartbeat=0.05)
        received.append(await anext(gen))  # retry + connected
        received.append(await anext(gen))
        received.append(await anext(gen))
        received.append(await anext(gen))  # sin eventos: heartbeat
        await gen.aclose()

    asyncio.run(scenario())
    assert received[0].startswith("retry:")
    assert "event: visit" in received[1] and '"country": "CO"' in received[1]
    assert "event: event" in received[2] and '"section": "ruido"' in received[2]
    assert received[3] == ": ping\n\n"
    assert broker.subscriber_count == 0  # limpio al cerrar


def test_stream_supports_many_clients_and_cleans_up_disconnected():
    broker = EventBroker(max_clients=10)

    async def scenario():
        subs = [broker.subscribe() for _ in range(3)]
        gens = [sse_stream(s, broker, heartbeat=5) for s in subs]
        for g in gens:
            await anext(g)  # abre el stream
        assert broker.subscriber_count == 3
        broker.publish("visit", {"country": None, "device": "desktop"})
        frames = [await asyncio.wait_for(anext(g), 1) for g in gens]
        assert all("event: visit" in f for f in frames)
        await gens[0].aclose()  # un cliente se desconecta
        assert broker.subscriber_count == 2
        broker.publish("visit", {"country": "CO", "device": "mobile"})  # no falla
        for g in gens[1:]:
            assert "event: visit" in await asyncio.wait_for(anext(g), 1)
            await g.aclose()
        assert broker.subscriber_count == 0

    asyncio.run(scenario())


def test_broker_respects_max_clients():
    async def scenario():
        broker = EventBroker(max_clients=1)
        assert broker.subscribe() is not None
        assert broker.subscribe() is None

    asyncio.run(scenario())


def test_cors_only_allowed_origins(client):
    ok = client.get("/api/health", headers={"Origin": "http://localhost:3000"})
    assert ok.headers.get("access-control-allow-origin") == "http://localhost:3000"
    bad = client.get("/api/health", headers={"Origin": "https://evil.example"})
    assert "access-control-allow-origin" not in bad.headers
    assert "access-control-allow-credentials" not in ok.headers
