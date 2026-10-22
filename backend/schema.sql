-- Esquema de referencia (PostgreSQL). La app lo crea sola al arrancar con
-- SQLModel.metadata.create_all; este archivo documenta lo que resulta.
--
-- Privacidad: ninguna tabla guarda IP. Los servicios del portafolio viven en el
-- frontend, no en la base.

CREATE TABLE IF NOT EXISTS sessions (
    id          UUID PRIMARY KEY,
    started_at  TIMESTAMPTZ NOT NULL,
    country     VARCHAR(2),               -- de x-vercel-ip-country / cf-ipcountry
    device      VARCHAR(10) NOT NULL      -- mobile | tablet | desktop
);
CREATE INDEX IF NOT EXISTS ix_sessions_started_at ON sessions (started_at);

CREATE TABLE IF NOT EXISTS events (
    id          SERIAL PRIMARY KEY,
    session_id  UUID NOT NULL REFERENCES sessions (id),
    section     VARCHAR(20) NOT NULL,     -- ruido|limpieza|historial|modelo|archivo|pipeline|servicios|senal
    depth       INTEGER NOT NULL,         -- 0-100 (validado en la API)
    created_at  TIMESTAMPTZ NOT NULL
);
CREATE INDEX IF NOT EXISTS ix_events_session_id ON events (session_id);
CREATE INDEX IF NOT EXISTS ix_events_section    ON events (section);
CREATE INDEX IF NOT EXISTS ix_events_created_at ON events (created_at);

CREATE TABLE IF NOT EXISTS repos_cache (
    name         VARCHAR PRIMARY KEY,
    description  TEXT,
    languages    JSONB NOT NULL,          -- [{"name","bytes","percent"}]
    stars        INTEGER NOT NULL,
    topics       JSONB NOT NULL,
    homepage     TEXT,
    pushed_at    TIMESTAMPTZ,
    synced_at    TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS leads (
    id          SERIAL PRIMARY KEY,
    service     VARCHAR(100) NOT NULL,
    budget      VARCHAR(100),
    deadline    VARCHAR(100),
    contact     VARCHAR(200) NOT NULL,
    message     TEXT,
    created_at  TIMESTAMPTZ NOT NULL
);

-- Auxiliar (no es de visitantes): ultimo valor bueno de datos externos, p. ej.
-- el heatmap de contribuciones, para servirlo si GitHub falla tras un reinicio.
CREATE TABLE IF NOT EXISTS kv_cache (
    key        VARCHAR PRIMARY KEY,
    value      JSONB NOT NULL,
    synced_at  TIMESTAMPTZ NOT NULL
);
