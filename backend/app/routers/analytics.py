"""Visitas, eventos de scroll, estadisticas y stream en vivo."""
import re
import uuid
from typing import Literal

from fastapi import APIRouter, Depends, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from sqlmodel import Session

from ..config import SECTIONS
from ..deps import get_session
from ..errors import ApiError
from ..models import Event, VisitSession
from ..services.stream import sse_stream

router = APIRouter(prefix="/api", tags=["analytics"])

SectionName = Literal["ruido", "limpieza", "historial", "modelo", "archivo", "pipeline", "servicios", "senal"]
assert set(SectionName.__args__) == set(SECTIONS)  # type: ignore[attr-defined]

_COUNTRY_RE = re.compile(r"^[A-Za-z]{2}$")
_UNKNOWN_COUNTRIES = {"XX", "T1"}  # codigos de Cloudflare para "desconocido"/Tor


def country_from_headers(headers) -> str | None:
    for name in ("x-vercel-ip-country", "cf-ipcountry"):
        value = (headers.get(name) or "").strip()
        if _COUNTRY_RE.match(value) and value.upper() not in _UNKNOWN_COUNTRIES:
            return value.upper()
    return None


def device_from_user_agent(user_agent: str | None) -> str:
    ua = (user_agent or "").lower()
    if "ipad" in ua or "tablet" in ua or ("android" in ua and "mobile" not in ua):
        return "tablet"
    if any(t in ua for t in ("mobi", "iphone", "ipod", "android")):
        return "mobile"
    return "desktop"


class VisitOut(BaseModel):
    session_id: uuid.UUID


class EventIn(BaseModel):
    session_id: uuid.UUID
    section: SectionName
    depth: int = Field(ge=0, le=100)


@router.post("/visit", response_model=VisitOut)
def visit(request: Request, session: Session = Depends(get_session)) -> VisitOut:
    row = VisitSession(
        country=country_from_headers(request.headers),
        device=device_from_user_agent(request.headers.get("user-agent")),
    )
    session.add(row)
    session.commit()
    request.app.state.broker.publish("visit", {"country": row.country, "device": row.device})
    return VisitOut(session_id=row.id)


@router.post("/event")
def event(body: EventIn, request: Request, session: Session = Depends(get_session)) -> dict:
    if session.get(VisitSession, body.session_id) is None:
        raise ApiError(404, "Sesion no encontrada.", "session_not_found")
    session.add(Event(session_id=body.session_id, section=body.section, depth=body.depth))
    session.commit()
    request.app.state.broker.publish("event", {"section": body.section, "depth": body.depth})
    return {"ok": True}


@router.get("/stats")
def stats(request: Request) -> dict:
    return request.app.state.stats.get()


@router.get("/stream")
async def stream(request: Request) -> StreamingResponse:
    state = request.app.state
    sub = state.broker.subscribe()
    if sub is None:
        raise ApiError(503, "Demasiados clientes conectados al stream.", "stream_full")
    return StreamingResponse(
        sse_stream(sub, state.broker, state.settings.stream_heartbeat_seconds),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache, no-transform",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",  # evita buffering en nginx/proxies
        },
    )
