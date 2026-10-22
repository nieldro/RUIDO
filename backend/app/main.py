"""Aplicacion FastAPI del portafolio de Daniel Paez.

Arranque:  uvicorn app.main:create_app --factory --no-access-log
(`--no-access-log` porque el log de accesos de uvicorn imprime la IP del cliente).
"""
import asyncio
import logging
import secrets
from contextlib import asynccontextmanager

import httpx
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import Settings, get_settings
from .db import init_db, make_engine
from .errors import register_error_handlers
from .routers import analytics, ask, github, health, quote
from .services.github import GitHubClient, GitHubService, scheduler_loop
from .services.llm import AnthropicProvider, LLMProvider, NullProvider, load_cv_context
from .services.ratelimit import RateLimiter
from .services.stats import StatsService
from .services.stream import EventBroker

log = logging.getLogger("portfolio")


def create_app(
    settings: Settings | None = None,
    *,
    http_transport: httpx.AsyncBaseTransport | None = None,
    llm_provider: LLMProvider | None = None,
) -> FastAPI:
    """Fabrica de la app. `http_transport` y `llm_provider` existen para pruebas
    (simular GitHub, n8n y Anthropic sin red)."""
    settings = settings or get_settings()

    salt = settings.rate_limit_salt
    if not salt:
        salt = secrets.token_hex(32)
        log.warning("RATE_LIMIT_SALT no definida: se genero una sal efimera (se pierde al reiniciar)")

    engine = make_engine(settings.sqlalchemy_url)
    http = httpx.AsyncClient(transport=http_transport, timeout=10.0)

    github_service = GitHubService(
        GitHubClient(settings.github_token, settings.github_user, http), engine, settings
    )
    if llm_provider is None:
        llm_provider = (
            AnthropicProvider(
                settings.anthropic_api_key,
                settings.llm_model,
                http,
                max_tokens=settings.llm_max_tokens,
                timeout=settings.llm_timeout_seconds,
            )
            if settings.anthropic_api_key
            else NullProvider()
        )

    @asynccontextmanager
    async def lifespan(app: FastAPI):
        init_db(engine)
        task = None
        if settings.enable_scheduler:
            task = asyncio.create_task(scheduler_loop(github_service, settings.repos_refresh_seconds))
        try:
            yield
        finally:
            if task:
                task.cancel()
            await http.aclose()
            engine.dispose()

    app = FastAPI(title="Portafolio de Daniel Paez - API", version="1.0.0", lifespan=lifespan)

    app.state.settings = settings
    app.state.engine = engine
    app.state.http = http
    app.state.github = github_service
    app.state.llm = llm_provider
    app.state.cv_context = load_cv_context()
    app.state.limiter = RateLimiter(salt, settings.rate_limit_window_seconds)
    app.state.broker = EventBroker(settings.stream_max_clients)
    app.state.stats = StatsService(engine, settings.stats_cache_seconds)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.origins,
        allow_methods=["GET", "POST", "OPTIONS"],
        allow_headers=["Content-Type"],
        allow_credentials=False,  # sin cookies
    )
    register_error_handlers(app)

    for router in (health.router, analytics.router, ask.router, github.router, quote.router):
        app.include_router(router)
    return app
