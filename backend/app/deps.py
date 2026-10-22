"""Dependencias de FastAPI: acceso al estado de la app."""
from collections.abc import Iterator

from fastapi import Request
from sqlmodel import Session

from .errors import ApiError
from .services.ratelimit import client_ip


def get_session(request: Request) -> Iterator[Session]:
    with Session(request.app.state.engine) as session:
        yield session


def enforce_rate_limit(request: Request, bucket: str, limit: int) -> None:
    """Lanza 429 si la IP hasheada excedio el limite. La IP no sale de aqui."""
    state = request.app.state
    ip = client_ip(request, state.settings.trusted_proxy_hops)
    allowed, retry_after = state.limiter.hit(bucket, ip, limit)
    if not allowed:
        raise ApiError(
            429,
            "Demasiadas solicitudes. Intenta de nuevo mas tarde.",
            "rate_limited",
            headers={"Retry-After": str(retry_after)},
        )
