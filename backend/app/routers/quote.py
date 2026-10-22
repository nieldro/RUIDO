"""Formulario de cotizacion: guarda el lead y avisa a n8n."""
import logging

from fastapi import APIRouter, Request
from pydantic import BaseModel, Field, field_validator
from sqlmodel import Session
from starlette.concurrency import run_in_threadpool

from ..deps import enforce_rate_limit
from ..models import Lead
from ..services.notify import notify_n8n

log = logging.getLogger("portfolio.quote")

router = APIRouter(prefix="/api", tags=["quote"])


class QuoteIn(BaseModel):
    service: str = Field(max_length=100)
    budget: str | None = Field(default=None, max_length=100)
    deadline: str | None = Field(default=None, max_length=100)
    contact: str = Field(max_length=200)
    message: str | None = Field(default=None, max_length=2000)

    @field_validator("service", "contact")
    @classmethod
    def _required(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Campo obligatorio.")
        return v

    @field_validator("budget", "deadline", "message")
    @classmethod
    def _optional(cls, v: str | None) -> str | None:
        v = (v or "").strip()
        return v or None


def _save(engine, body: QuoteIn) -> Lead:
    with Session(engine) as session:
        lead = Lead(**body.model_dump())
        session.add(lead)
        session.commit()
        session.refresh(lead)
        return lead


@router.post("/quote")
async def quote(body: QuoteIn, request: Request) -> dict:
    state = request.app.state
    enforce_rate_limit(request, "quote", state.settings.quote_rate_limit)
    lead = await run_in_threadpool(_save, state.engine, body)

    # El lead ya esta guardado: pase lo que pase con n8n, la respuesta es 200.
    notified = await notify_n8n(
        state.http,
        state.settings.n8n_quote_webhook,
        {
            "lead_id": lead.id,
            "service": lead.service,
            "budget": lead.budget,
            "deadline": lead.deadline,
            "contact": lead.contact,
            "message": lead.message,
            "created_at": lead.created_at.isoformat(),
        },
        timeout=state.settings.n8n_timeout_seconds,
        retry_delay=state.settings.n8n_retry_delay_seconds,
    )
    return {"ok": True, "notified": notified}
