"""Configuracion por variables de entorno (pydantic-settings)."""
from __future__ import annotations

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict

# Secciones validas del portafolio (deben coincidir con el frontend).
SECTIONS: tuple[str, ...] = (
    "ruido",
    "limpieza",
    "historial",
    "modelo",
    "archivo",
    "pipeline",
    "servicios",
    "senal",
)


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8", extra="ignore"
    )

    # Base de datos
    database_url: str = "sqlite:///./portfolio_dev.db"

    # CORS
    allowed_origins: str = "http://localhost:3000,http://localhost:3100"

    # Privacidad / rate limit
    rate_limit_salt: str = ""
    trusted_proxy_hops: int = 1
    ask_rate_limit: int = 10  # preguntas por hora por IP hasheada
    quote_rate_limit: int = 5  # cotizaciones por hora por IP hasheada
    rate_limit_window_seconds: int = 3600

    # GitHub
    github_user: str = "nieldro"
    github_token: str = ""
    github_webhook_secret: str = ""
    github_topic: str = "portfolio"
    enable_scheduler: bool = True
    repos_refresh_seconds: int = 3600
    contributions_ttl_seconds: int = 3600

    # LLM
    anthropic_api_key: str = ""
    llm_model: str = "claude-haiku-5-5"
    llm_max_tokens: int = 400
    llm_timeout_seconds: float = 20.0
    ask_max_chars: int = 500

    # n8n
    n8n_quote_webhook: str = ""
    n8n_timeout_seconds: float = 4.0
    n8n_retry_delay_seconds: float = 0.5

    # Estadisticas / SSE
    stats_cache_seconds: float = 15.0
    stream_heartbeat_seconds: float = 15.0
    stream_max_clients: int = 200

    @property
    def origins(self) -> list[str]:
        return [o.strip().rstrip("/") for o in self.allowed_origins.split(",") if o.strip()]

    @property
    def sqlalchemy_url(self) -> str:
        """Normaliza la URL que dan Railway/Fly (postgres:// o postgresql://)."""
        url = self.database_url.strip()
        for prefix in ("postgres://", "postgresql://"):
            if url.startswith(prefix):
                return "postgresql+psycopg://" + url[len(prefix):]
        return url


@lru_cache
def get_settings() -> Settings:
    return Settings()
