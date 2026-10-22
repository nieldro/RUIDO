"""Chat "Preguntale a mi CV"."""
import logging

from fastapi import APIRouter, Request
from pydantic import BaseModel, field_validator

from ..deps import enforce_rate_limit
from ..errors import ApiError
from ..services.llm import LLMError, LLMNotConfigured

log = logging.getLogger("portfolio.ask")

router = APIRouter(prefix="/api", tags=["ask"])

MAX_QUESTION_CHARS = 500


class AskIn(BaseModel):
    question: str

    @field_validator("question")
    @classmethod
    def _check(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("La pregunta no puede estar vacia.")
        if len(v) > MAX_QUESTION_CHARS:
            raise ValueError(f"La pregunta supera {MAX_QUESTION_CHARS} caracteres.")
        return v


@router.post("/ask")
async def ask(body: AskIn, request: Request) -> dict:
    state = request.app.state
    not_connected = ApiError(
        503,
        "El chat sobre el CV aun no esta conectado. Vuelve pronto o escribele a Daniel directamente.",
        "llm_not_configured",
    )
    if not state.llm.configured:
        raise not_connected  # sin proveedor no hay costo que proteger: no gasta cupo
    # El rate limit protege el presupuesto del LLM.
    enforce_rate_limit(request, "ask", state.settings.ask_rate_limit)
    try:
        answer = await state.llm.answer(body.question, state.cv_context)
    except LLMNotConfigured:
        raise not_connected from None
    except LLMError as exc:
        log.warning("Fallo del LLM: %s", exc)
        raise ApiError(502, "El asistente no pudo responder ahora. Intenta de nuevo.", "llm_error") from None
    return {"answer": answer}
