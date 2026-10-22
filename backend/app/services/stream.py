"""Difusion de eventos en vivo (SSE) a varios clientes.

Los eventos son anonimos: sin IDs de sesion ni IPs. Se publican desde endpoints
sincronos (hilos) y se consumen en el loop de asyncio, por eso `publish` usa
call_soon_threadsafe.
"""
import asyncio
import json
import logging
import threading
from collections.abc import AsyncIterator
from datetime import datetime, timezone

log = logging.getLogger("portfolio.stream")

QUEUE_SIZE = 100


class Subscription:
    def __init__(self, loop: asyncio.AbstractEventLoop):
        self.loop = loop
        self.queue: asyncio.Queue[dict] = asyncio.Queue(maxsize=QUEUE_SIZE)

    def offer(self, item: dict) -> None:
        if self.queue.full():  # cliente lento: descarta lo mas viejo
            try:
                self.queue.get_nowait()
            except asyncio.QueueEmpty:
                pass
        self.queue.put_nowait(item)


class EventBroker:
    def __init__(self, max_clients: int = 200):
        self._subs: set[Subscription] = set()
        self._lock = threading.Lock()
        self.max_clients = max_clients

    @property
    def subscriber_count(self) -> int:
        with self._lock:
            return len(self._subs)

    def subscribe(self) -> Subscription | None:
        """Debe llamarse dentro del loop. None si se alcanzo el maximo de clientes."""
        sub = Subscription(asyncio.get_running_loop())
        with self._lock:
            if len(self._subs) >= self.max_clients:
                return None
            self._subs.add(sub)
        return sub

    def unsubscribe(self, sub: Subscription) -> None:
        with self._lock:
            self._subs.discard(sub)

    def publish(self, kind: str, data: dict) -> None:
        item = {"type": kind, "data": {**data, "ts": datetime.now(timezone.utc).isoformat()}}
        with self._lock:
            subs = list(self._subs)
        for sub in subs:
            try:
                sub.loop.call_soon_threadsafe(sub.offer, item)
            except RuntimeError:  # el loop del cliente ya se cerro
                self.unsubscribe(sub)


def format_sse(item: dict) -> str:
    return f"event: {item['type']}\ndata: {json.dumps(item['data'], ensure_ascii=False)}\n\n"


async def sse_stream(sub: Subscription, broker: EventBroker, heartbeat: float) -> AsyncIterator[str]:
    """Genera el cuerpo SSE. El `finally` limpia al suscriptor cuando el cliente
    se desconecta (Starlette cierra el generador)."""
    try:
        yield "retry: 3000\n\n: connected\n\n"
        while True:
            try:
                item = await asyncio.wait_for(sub.queue.get(), timeout=heartbeat)
                yield format_sse(item)
            except asyncio.TimeoutError:
                yield ": ping\n\n"
    finally:
        broker.unsubscribe(sub)
