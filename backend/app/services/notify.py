"""Aviso de nuevos leads a n8n (Webhook -> Email/WhatsApp)."""
import asyncio
import logging

import httpx

log = logging.getLogger("portfolio.notify")


async def notify_n8n(
    http: httpx.AsyncClient,
    url: str,
    payload: dict,
    timeout: float = 4.0,
    retry_delay: float = 0.5,
) -> bool:
    """POST JSON al webhook de n8n; un reintento. Nunca lanza: devuelve si se notifico."""
    if not url:
        return False
    for attempt in (1, 2):
        try:
            resp = await http.post(url, json=payload, timeout=timeout)
            if resp.status_code < 300:
                return True
            log.warning("n8n respondio HTTP %s (intento %d/2)", resp.status_code, attempt)
        except httpx.HTTPError as exc:
            log.warning("n8n no disponible: %s (intento %d/2)", type(exc).__name__, attempt)
        if attempt == 1:
            await asyncio.sleep(retry_delay)
    return False
