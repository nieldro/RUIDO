"""Cliente de GitHub (GraphQL, solo lectura) + cache de repos y contribuciones.

El token vive solo en GITHUB_TOKEN del servidor. Si GitHub falla se conserva la
cache anterior: nunca se borra nada por un error.
"""
import asyncio
import logging
from datetime import datetime, timezone
from typing import Any

import httpx
from sqlalchemy.engine import Engine
from sqlmodel import Session, select
from starlette.concurrency import run_in_threadpool

from ..config import Settings
from ..models import KVCache, RepoCache, as_utc, utcnow

log = logging.getLogger("portfolio.github")

GRAPHQL_URL = "https://api.github.com/graphql"
MAX_PAGES = 10

REPOS_QUERY = """
query($login: String!, $after: String) {
  user(login: $login) {
    repositories(first: 50, after: $after, privacy: PUBLIC, ownerAffiliations: OWNER,
                 orderBy: {field: PUSHED_AT, direction: DESC}) {
      pageInfo { hasNextPage endCursor }
      nodes {
        name
        description
        stargazerCount
        homepageUrl
        pushedAt
        repositoryTopics(first: 30) { nodes { topic { name } } }
        languages(first: 20, orderBy: {field: SIZE, direction: DESC}) {
          edges { size node { name } }
        }
      }
    }
  }
}
"""

CONTRIBUTIONS_QUERY = """
query($login: String!) {
  user(login: $login) {
    contributionsCollection {
      contributionCalendar {
        totalContributions
        weeks { contributionDays { date contributionCount contributionLevel } }
      }
    }
  }
}
"""

LEVELS = {
    "NONE": 0,
    "FIRST_QUARTILE": 1,
    "SECOND_QUARTILE": 2,
    "THIRD_QUARTILE": 3,
    "FOURTH_QUARTILE": 4,
}

CONTRIBUTIONS_KEY = "contributions"


class GitHubError(Exception):
    """Fallo al hablar con GitHub (el mensaje nunca incluye el token)."""


def _parse_dt(value: str | None) -> datetime | None:
    if not value:
        return None
    return as_utc(datetime.fromisoformat(value.replace("Z", "+00:00")))


def _language_breakdown(edges: list[dict]) -> list[dict]:
    total = sum(e["size"] for e in edges)
    if total <= 0:
        return []
    return [
        {"name": e["node"]["name"], "bytes": e["size"], "percent": round(e["size"] * 100 / total, 1)}
        for e in edges
    ]


class GitHubClient:
    def __init__(self, token: str, user: str, http: httpx.AsyncClient, timeout: float = 20.0):
        self._token = token
        self._user = user
        self._http = http
        self._timeout = timeout

    @property
    def configured(self) -> bool:
        return bool(self._token)

    async def _graphql(self, query: str, variables: dict) -> dict:
        if not self._token:
            raise GitHubError("GITHUB_TOKEN no configurado")
        try:
            resp = await self._http.post(
                GRAPHQL_URL,
                json={"query": query, "variables": variables},
                headers={
                    "Authorization": f"Bearer {self._token}",
                    "Accept": "application/vnd.github+json",
                    "User-Agent": "portfolio-backend",
                },
                timeout=self._timeout,
            )
        except httpx.HTTPError as exc:
            raise GitHubError(f"no se pudo contactar a GitHub ({type(exc).__name__})") from None
        if resp.status_code != 200:
            raise GitHubError(f"GitHub respondio HTTP {resp.status_code}")
        try:
            body = resp.json()
        except ValueError:
            raise GitHubError("respuesta de GitHub no es JSON") from None
        if body.get("errors") or not body.get("data") or not body["data"].get("user"):
            raise GitHubError("GitHub devolvio errores GraphQL")
        return body["data"]["user"]

    async def fetch_portfolio_repos(self, topic: str = "portfolio") -> list[dict]:
        wanted = topic.lower()
        repos: list[dict] = []
        after: str | None = None
        for _ in range(MAX_PAGES):
            user = await self._graphql(REPOS_QUERY, {"login": self._user, "after": after})
            page = user["repositories"]
            for node in page["nodes"] or []:
                topics = [t["topic"]["name"] for t in node["repositoryTopics"]["nodes"]]
                if wanted not in (t.lower() for t in topics):
                    continue
                repos.append(
                    {
                        "name": node["name"],
                        "description": node.get("description"),
                        "languages": _language_breakdown(node["languages"]["edges"]),
                        "stars": node.get("stargazerCount", 0),
                        "topics": topics,
                        "homepage": node.get("homepageUrl") or None,
                        "pushed_at": _parse_dt(node.get("pushedAt")),
                    }
                )
            if not page["pageInfo"]["hasNextPage"]:
                break
            after = page["pageInfo"]["endCursor"]
        return repos

    async def fetch_contributions(self) -> dict:
        user = await self._graphql(CONTRIBUTIONS_QUERY, {"login": self._user})
        cal = user["contributionsCollection"]["contributionCalendar"]
        return {
            "user": self._user,
            "total": cal["totalContributions"],
            "weeks": [
                [
                    {
                        "date": d["date"],
                        "count": d["contributionCount"],
                        "level": LEVELS.get(d["contributionLevel"], 0),
                    }
                    for d in week["contributionDays"]
                ]
                for week in cal["weeks"]
            ],
        }


class GitHubService:
    """Orquesta cliente + cache (tabla repos_cache, kv_cache y memoria)."""

    def __init__(self, client: GitHubClient, engine: Engine, settings: Settings, clock=None):
        self.client = client
        self._engine = engine
        self._settings = settings
        self._clock = clock or (lambda: datetime.now(timezone.utc))
        self._refresh_lock = asyncio.Lock()
        self._contrib: dict | None = None  # {"data":..., "synced_at": datetime}

    # ---- repos ---------------------------------------------------------
    def _store_repos(self, repos: list[dict]) -> None:
        now = utcnow()
        with Session(self._engine) as session:
            names = {r["name"] for r in repos}
            for existing in session.exec(select(RepoCache)).all():
                if existing.name not in names:
                    session.delete(existing)
            for r in repos:
                session.merge(RepoCache(**r, synced_at=now))
            session.commit()

    async def refresh_repos(self) -> bool:
        """Refresca repos_cache. True si se actualizo; False si fallo (cache intacta)."""
        if not self.client.configured:
            log.warning("GITHUB_TOKEN no configurado: se omite el refresco de repos")
            return False
        async with self._refresh_lock:
            try:
                repos = await self.client.fetch_portfolio_repos(self._settings.github_topic)
            except GitHubError as exc:
                log.warning("Refresco de repos fallido, se conserva la cache: %s", exc)
                return False
            await run_in_threadpool(self._store_repos, repos)
            log.info("Repos sincronizados: %d", len(repos))
            return True

    # ---- contribuciones --------------------------------------------------
    def _load_contrib_db(self) -> dict | None:
        with Session(self._engine) as session:
            row = session.get(KVCache, CONTRIBUTIONS_KEY)
            if row is None:
                return None
            return {"data": row.value, "synced_at": as_utc(row.synced_at)}

    def _save_contrib_db(self, data: dict, synced_at: datetime) -> None:
        with Session(self._engine) as session:
            session.merge(KVCache(key=CONTRIBUTIONS_KEY, value=data, synced_at=synced_at))
            session.commit()

    async def get_contributions(self) -> dict[str, Any] | None:
        """Heatmap del ultimo anio. Devuelve None si no hay ni dato fresco ni respaldo."""
        now = self._clock()
        ttl = self._settings.contributions_ttl_seconds
        if self._contrib is None:
            self._contrib = await run_in_threadpool(self._load_contrib_db)
        cached = self._contrib
        if cached and (now - cached["synced_at"]).total_seconds() < ttl:
            return self._shape(cached, stale=False)
        try:
            data = await self.client.fetch_contributions()
        except GitHubError as exc:
            log.warning("Contribuciones: GitHub fallo, se usa el ultimo valor bueno: %s", exc)
            return self._shape(cached, stale=True) if cached else None
        self._contrib = {"data": data, "synced_at": now}
        await run_in_threadpool(self._save_contrib_db, data, now)
        return self._shape(self._contrib, stale=False)

    @staticmethod
    def _shape(cached: dict, stale: bool) -> dict:
        return {**cached["data"], "synced_at": cached["synced_at"].isoformat(), "stale": stale}


async def scheduler_loop(service: GitHubService, interval: float) -> None:
    """Respaldo del webhook: refresca al arrancar y luego cada `interval` segundos."""
    while True:
        try:
            await service.refresh_repos()
        except Exception:  # noqa: BLE001  (nunca debe morir el scheduler)
            log.exception("Fallo inesperado en el refresco programado")
        await asyncio.sleep(interval)
