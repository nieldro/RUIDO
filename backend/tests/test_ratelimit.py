from types import SimpleNamespace

from app.services.ratelimit import RateLimiter, client_ip


def req(xff=None, host="10.0.0.1"):
    headers = {"x-forwarded-for": xff} if xff is not None else {}
    return SimpleNamespace(headers=headers, client=SimpleNamespace(host=host))


class Clock:
    def __init__(self, t=1_800_000_000.0):
        self.t = t

    def __call__(self):
        return self.t


def test_client_ip_direct_when_no_header():
    assert client_ip(req(), 1) == "10.0.0.1"


def test_client_ip_takes_value_added_by_trusted_proxy_not_spoofed_one():
    # El cliente falsifica la izquierda; el proxy confiable anadio la real a la derecha.
    assert client_ip(req("1.1.1.1, 203.0.113.9"), 1) == "203.0.113.9"
    # Con un proxy extra delante (p. ej. Vercel) se cuentan dos saltos.
    assert client_ip(req("203.0.113.9, 76.76.21.21"), 2) == "203.0.113.9"
    assert client_ip(req("203.0.113.9"), 3) == "203.0.113.9"  # menos valores que saltos


def test_client_ip_ignores_garbage_header():
    assert client_ip(req("no-es-ip"), 1) == "10.0.0.1"
    assert client_ip(req(" , "), 1) == "10.0.0.1"


def test_limit_and_window_expiry():
    clock = Clock()
    rl = RateLimiter("salt", window_seconds=3600, clock=clock)
    for _ in range(3):
        assert rl.hit("ask", "1.2.3.4", 3) == (True, 0)
    allowed, retry = rl.hit("ask", "1.2.3.4", 3)
    assert allowed is False and 0 < retry <= 3601
    clock.t += 1800
    assert rl.hit("ask", "1.2.3.4", 3)[0] is False
    clock.t += 1801  # la ventana de 1 h ya paso
    assert rl.hit("ask", "1.2.3.4", 3)[0] is True


def test_buckets_and_ips_are_independent():
    rl = RateLimiter("salt", clock=Clock())
    assert rl.hit("ask", "1.2.3.4", 1)[0] is True
    assert rl.hit("ask", "1.2.3.4", 1)[0] is False
    assert rl.hit("quote", "1.2.3.4", 1)[0] is True
    assert rl.hit("ask", "5.6.7.8", 1)[0] is True


def test_keys_are_hmac_hashes_and_rotate_daily():
    clock = Clock()
    rl = RateLimiter("salt", clock=clock)
    rl.hit("ask", "1.2.3.4", 5)
    [key_day1] = rl._hits.keys()
    assert "1.2.3.4" not in key_day1
    clock.t += 86400
    rl.hit("ask", "1.2.3.4", 5)
    assert len(rl._hits) == 2  # otro dia = otro hash para la misma IP (no se puede seguir entre dias)
    assert RateLimiter("otra-sal", clock=Clock())._key("ask", "1.2.3.4") != RateLimiter("salt", clock=Clock())._key("ask", "1.2.3.4")


def test_sweep_removes_expired_entries():
    clock = Clock()
    rl = RateLimiter("salt", window_seconds=10, clock=clock)
    rl.hit("ask", "1.1.1.1", 5)
    clock.t += 100
    rl._sweep(clock.t)
    assert rl._hits == {}
