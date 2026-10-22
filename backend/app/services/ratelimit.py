"""Rate limit por IP hasheada.

Privacidad: la IP nunca se guarda ni se registra. Solo existe como entrada de un
HMAC-SHA256 con sal secreta; la clave del contador es ese hash y rota cada dia
UTC (la fecha entra en el mensaje del HMAC), de modo que no se puede seguir a
una persona entre dias. Todo vive en memoria del proceso.
"""
import hashlib
import hmac
import ipaddress
import threading
import time
from collections import deque
from datetime import datetime, timezone

from fastapi import Request


def client_ip(request: Request, trusted_hops: int = 1) -> str:
    """IP del cliente.

    X-Forwarded-For lo escribe cada proxy a la derecha. El valor de confianza es
    el que anadio NUESTRO proxy mas cercano: se cuenta `trusted_hops` desde la
    derecha (lo que el cliente ponga a la izquierda es falsificable). Si no hay
    cabecera valida se usa el cliente directo.
    """
    xff = request.headers.get("x-forwarded-for", "")
    parts = [p.strip() for p in xff.split(",") if p.strip()]
    if parts:
        candidate = parts[max(len(parts) - max(trusted_hops, 1), 0)]
        try:
            return str(ipaddress.ip_address(candidate))
        except ValueError:
            pass
    return request.client.host if request.client else "unknown"


class RateLimiter:
    def __init__(self, salt: str, window_seconds: int = 3600, clock=time.time):
        self._salt = salt.encode()
        self._window = window_seconds
        self._clock = clock
        self._hits: dict[str, deque[float]] = {}
        self._lock = threading.Lock()
        self._calls = 0

    def _key(self, bucket: str, ip: str) -> str:
        day = datetime.fromtimestamp(self._clock(), timezone.utc).strftime("%Y-%m-%d")
        digest = hmac.new(self._salt, f"{day}|{ip}".encode(), hashlib.sha256).hexdigest()
        return f"{bucket}:{digest}"

    def hit(self, bucket: str, ip: str, limit: int) -> tuple[bool, int]:
        """Registra un intento. Devuelve (permitido, segundos_para_reintentar)."""
        key = self._key(bucket, ip)
        now = self._clock()
        with self._lock:
            self._calls += 1
            if self._calls % 500 == 0:
                self._sweep(now)
            q = self._hits.setdefault(key, deque())
            while q and q[0] <= now - self._window:
                q.popleft()
            if len(q) >= limit:
                return False, max(int(q[0] + self._window - now) + 1, 1)
            q.append(now)
            return True, 0

    def _sweep(self, now: float) -> None:
        for key in [k for k, q in self._hits.items() if not q or q[-1] <= now - self._window]:
            del self._hits[key]
