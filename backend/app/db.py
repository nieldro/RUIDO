"""Motor y sesiones de base de datos."""
import logging
import time
from collections.abc import Iterator

from sqlalchemy import text
from sqlalchemy.engine import Engine
from sqlalchemy.pool import StaticPool
from sqlmodel import Session, SQLModel, create_engine

from . import models  # noqa: F401  (registra las tablas en el metadata)

log = logging.getLogger("portfolio.db")


def make_engine(url: str) -> Engine:
    if url.startswith("sqlite"):
        kwargs: dict = {"connect_args": {"check_same_thread": False}}
        if url in ("sqlite://", "sqlite:///:memory:"):
            # Una sola conexion compartida: la base en memoria vive mientras viva el engine.
            kwargs["poolclass"] = StaticPool
        return create_engine(url, **kwargs)
    return create_engine(url, pool_pre_ping=True, pool_size=5, max_overflow=5)


def init_db(engine: Engine, attempts: int = 5, delay: float = 2.0) -> None:
    """Crea las tablas si no existen. Reintenta: en Railway/Fly la base puede
    tardar unos segundos en aceptar conexiones."""
    for i in range(1, attempts + 1):
        try:
            with engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            SQLModel.metadata.create_all(engine)
            return
        except Exception as exc:  # noqa: BLE001
            if i == attempts:
                raise
            log.warning("Base de datos no disponible (%s), reintento %d/%d", type(exc).__name__, i, attempts)
            time.sleep(delay)


def session_scope(engine: Engine) -> Iterator[Session]:
    with Session(engine) as session:
        yield session
