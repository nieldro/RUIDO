"""Estadisticas agregadas con cache en memoria."""
import threading
import time
from datetime import datetime, time as dtime, timezone

from sqlalchemy.engine import Engine
from sqlmodel import Session, col, func, select

from ..config import SECTIONS
from ..models import Event, VisitSession


def compute_stats(session: Session) -> dict:
    today_start = datetime.combine(datetime.now(timezone.utc).date(), dtime.min, tzinfo=timezone.utc)

    visits_today = session.exec(
        select(func.count()).select_from(VisitSession).where(VisitSession.started_at >= today_start)
    ).one()
    visits_total = session.exec(select(func.count()).select_from(VisitSession)).one()

    country_rows = session.exec(
        select(VisitSession.country, func.count().label("n"))
        .where(col(VisitSession.country).is_not(None))
        .group_by(VisitSession.country)
        .order_by(func.count().desc(), VisitSession.country)
    ).all()

    # Profundidad maxima por (sesion, seccion), luego promedio por seccion.
    per_session = (
        select(Event.session_id, Event.section, func.max(Event.depth).label("max_depth"))
        .group_by(Event.session_id, Event.section)
        .subquery()
    )
    depth_rows = session.exec(
        select(per_session.c.section, func.avg(per_session.c.max_depth)).group_by(per_session.c.section)
    ).all()
    averages = {section: round(float(avg), 1) for section, avg in depth_rows}

    return {
        "visits_today": visits_today,
        "visits_total": visits_total,
        "countries": [{"country": c, "count": n} for c, n in country_rows],
        "scroll_depth": {s: averages.get(s) for s in SECTIONS},
        "generated_at": datetime.now(timezone.utc).isoformat(),
    }


class StatsService:
    def __init__(self, engine: Engine, ttl_seconds: float = 15.0, clock=time.monotonic):
        self._engine = engine
        self._ttl = ttl_seconds
        self._clock = clock
        self._cached: dict | None = None
        self._expires = 0.0
        self._lock = threading.Lock()

    def get(self) -> dict:
        with self._lock:
            now = self._clock()
            if self._cached is None or now >= self._expires:
                with Session(self._engine) as session:
                    self._cached = compute_stats(session)
                self._expires = now + self._ttl
            return self._cached
