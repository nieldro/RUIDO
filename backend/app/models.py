"""Tablas (SQLModel). Los servicios del portafolio NO viven en la base."""
import uuid
from datetime import datetime, timezone
from typing import Any, Optional

from sqlalchemy import JSON, Column, DateTime, String, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlmodel import Field, SQLModel


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


def as_utc(dt: Optional[datetime]) -> Optional[datetime]:
    """SQLite devuelve datetimes sin zona; todo se guarda en UTC."""
    if dt is None:
        return None
    return dt.replace(tzinfo=timezone.utc) if dt.tzinfo is None else dt.astimezone(timezone.utc)


def _json() -> Any:
    # JSONB en Postgres, JSON generico en SQLite (pruebas).
    return JSON().with_variant(JSONB(), "postgresql")


class VisitSession(SQLModel, table=True):
    __tablename__ = "sessions"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    started_at: datetime = Field(
        default_factory=utcnow,
        sa_column=Column(DateTime(timezone=True), nullable=False, index=True),
    )
    country: Optional[str] = Field(default=None, sa_column=Column(String(2)))
    device: str = Field(sa_column=Column(String(10), nullable=False))


class Event(SQLModel, table=True):
    __tablename__ = "events"

    id: Optional[int] = Field(default=None, primary_key=True)
    session_id: uuid.UUID = Field(foreign_key="sessions.id", index=True)
    section: str = Field(sa_column=Column(String(20), nullable=False, index=True))
    depth: int
    created_at: datetime = Field(
        default_factory=utcnow,
        sa_column=Column(DateTime(timezone=True), nullable=False, index=True),
    )


class RepoCache(SQLModel, table=True):
    __tablename__ = "repos_cache"

    name: str = Field(primary_key=True)
    description: Optional[str] = Field(default=None, sa_column=Column(Text))
    languages: list = Field(default_factory=list, sa_column=Column(_json(), nullable=False))
    stars: int = 0
    topics: list = Field(default_factory=list, sa_column=Column(_json(), nullable=False))
    homepage: Optional[str] = Field(default=None, sa_column=Column(Text))
    pushed_at: Optional[datetime] = Field(
        default=None, sa_column=Column(DateTime(timezone=True))
    )
    synced_at: datetime = Field(
        default_factory=utcnow, sa_column=Column(DateTime(timezone=True), nullable=False)
    )


class Lead(SQLModel, table=True):
    __tablename__ = "leads"

    id: Optional[int] = Field(default=None, primary_key=True)
    service: str = Field(sa_column=Column(String(100), nullable=False))
    budget: Optional[str] = Field(default=None, sa_column=Column(String(100)))
    deadline: Optional[str] = Field(default=None, sa_column=Column(String(100)))
    contact: str = Field(sa_column=Column(String(200), nullable=False))
    message: Optional[str] = Field(default=None, sa_column=Column(Text))
    created_at: datetime = Field(
        default_factory=utcnow, sa_column=Column(DateTime(timezone=True), nullable=False)
    )


class KVCache(SQLModel, table=True):
    """Ultimo valor bueno de datos externos (p. ej. contribuciones de GitHub)
    para sobrevivir a reinicios si GitHub esta caido. No guarda datos de visitantes."""

    __tablename__ = "kv_cache"

    key: str = Field(primary_key=True)
    value: dict = Field(default_factory=dict, sa_column=Column(_json(), nullable=False))
    synced_at: datetime = Field(
        default_factory=utcnow, sa_column=Column(DateTime(timezone=True), nullable=False)
    )
