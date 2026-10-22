"""Repos, contribuciones y webhook de GitHub."""
import hashlib
import hmac

from fastapi import APIRouter, BackgroundTasks, Depends, Request
from sqlmodel import Session, col, select

from ..deps import get_session
from ..errors import ApiError
from ..models import RepoCache, as_utc

router = APIRouter(prefix="/api", tags=["github"])


def _iso(dt) -> str | None:
    dt = as_utc(dt)
    return dt.isoformat() if dt else None


@router.get("/repos")
def repos(session: Session = Depends(get_session)) -> dict:
    rows = session.exec(
        select(RepoCache).order_by(col(RepoCache.pushed_at).desc(), RepoCache.name)
    ).all()
    synced = max((as_utc(r.synced_at) for r in rows), default=None)
    return {
        "repos": [
            {
                "name": r.name,
                "description": r.description,
                "languages": r.languages,
                "stars": r.stars,
                "topics": r.topics,
                "homepage": r.homepage,
                "pushed_at": _iso(r.pushed_at),
                "synced_at": _iso(r.synced_at),
            }
            for r in rows
        ],
        "synced_at": _iso(synced),
    }


@router.get("/contributions")
async def contributions(request: Request) -> dict:
    data = await request.app.state.github.get_contributions()
    if data is None:
        raise ApiError(
            503, "No hay datos de contribuciones disponibles todavia.", "github_unavailable"
        )
    return data


def signature_is_valid(secret: str, body: bytes, header: str | None) -> bool:
    if not secret or not header or not header.startswith("sha256="):
        return False
    expected = "sha256=" + hmac.new(secret.encode(), body, hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected, header)  # tiempo constante


@router.post("/github/webhook")
async def github_webhook(request: Request, background: BackgroundTasks) -> dict:
    state = request.app.state
    secret = state.settings.github_webhook_secret
    if not secret:
        raise ApiError(503, "Webhook sin secreto configurado.", "webhook_not_configured")
    body = await request.body()
    if not signature_is_valid(secret, body, request.headers.get("x-hub-signature-256")):
        raise ApiError(401, "Firma invalida.", "invalid_signature")

    event = request.headers.get("x-github-event", "")
    if event == "ping":
        return {"ok": True, "event": "ping"}
    if event in ("push", "repository"):
        background.add_task(state.github.refresh_repos)
        return {"ok": True, "event": event, "refreshing": True}
    return {"ok": True, "event": event, "ignored": True}
