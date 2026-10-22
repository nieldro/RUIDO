# Backend del portafolio · Daniel Páez

API de **RUIDO**, el portafolio de Daniel Alejandro Páez Torres. Registra visitas y profundidad de scroll **sin guardar nunca una IP**, transmite la actividad en vivo, sirve los repos y el heatmap de contribuciones desde una caché de GitHub, responde preguntas sobre el CV con un LLM acotado al texto del CV y recibe solicitudes de cotización que avisa por n8n.

**FastAPI · SQLModel · PostgreSQL (psycopg 3) · SSE · HMAC · 86 pruebas con pytest**

## Arquitectura

```mermaid
flowchart LR
    B["Navegador<br/>(Next.js)"] -->|"POST /api/visit · /event<br/>/ask · /quote"| API["FastAPI"]
    API -->|"SQLModel"| PG[("PostgreSQL")]
    PG -->|"GET /api/stats<br/>(caché 15 s)"| P["Panel de<br/>métricas"]
    API -.->|"SSE /api/stream<br/>(visit · event)"| B

    GH["GitHub"] -->|"webhook push / repository<br/>(firma HMAC)"| API
    API -->|"GraphQL · token de solo lectura<br/>+ refresco cada hora"| GH
    API -->|"POST JSON<br/>(1 reintento)"| N8N["n8n"]
    N8N --> M["Email / WhatsApp"]
    API -.->|"opcional: ANTHROPIC_API_KEY"| LLM["Proveedor LLM"]

    classDef sat fill:#f4f4f4,stroke:#999,color:#333;
    class GH,N8N,M,LLM sat;
```

Línea continua: flujo principal de datos. Línea punteada: tiempo real y piezas opcionales. Gris: satélites externos; si caen, el backend degrada sin perder datos (el lead se guarda aunque n8n falle; se conserva la caché si GitHub falla).

### Decisiones de diseño

- **Fábrica de app (`create_app`)**: toda la configuración entra por `Settings`, y el transporte HTTP saliente y el proveedor LLM son inyectables. Por eso las pruebas simulan GitHub, n8n y Anthropic con `httpx.MockTransport`, sin red ni tokens.
- **`LLMProvider` desacoplado**: el proveedor aún no está decidido. Hoy hay `NullProvider` (por defecto, responde 503 `llm_not_configured`) y `AnthropicProvider` (se activa con `ANTHROPIC_API_KEY`). Cambiar de proveedor es implementar un método (`answer`).
- **El chat solo ve el CV**: el system prompt incluye únicamente `app/cv_context.md`, ordena responder "no lo sé" si el dato no está, contestar en el idioma de la pregunta y tratar el mensaje del visitante como pregunta, no como instrucciones. Máx. 400 tokens de salida y 500 caracteres de entrada.
- **GitHub con una sola consulta GraphQL**: trae topics, estrellas, homepage, `pushedAt` y bytes por lenguaje (porcentaje real, no por número de archivos). Si GitHub falla no se borra nada.
- **SSE sin dependencias**: un `EventBroker` en memoria con cola acotada por cliente, `heartbeat` y limpieza al desconectarse. Los eventos son anónimos (país, dispositivo, sección, profundidad).
- **Tabla extra `kv_cache`**: guarda el último heatmap bueno para poder servirlo (`stale: true`) aunque GitHub esté caído justo después de un reinicio. No contiene datos de visitantes.

## Correr en local

Requisitos: Python 3.12.

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1          # Linux/macOS: source .venv/bin/activate
pip install -r requirements-dev.txt
copy .env.example .env               # edita lo que necesites (todo es opcional en local)
uvicorn app.main:create_app --factory --reload --no-access-log
```

- Sin `DATABASE_URL` usa SQLite (`portfolio_dev.db`). Para probar con Postgres real: `DATABASE_URL=postgresql://usuario:clave@localhost:5432/portafolio` (una base **nueva y propia**; la app crea las tablas al arrancar, y `schema.sql` documenta el resultado).
- Documentación interactiva en <http://localhost:8000/docs>.
- Siempre `--no-access-log`: el log de accesos de uvicorn imprime la IP del cliente y este proyecto no la registra.

### Pruebas

```powershell
python -m pytest
```

Usan SQLite en memoria y una red simulada. Cubren visita/evento/estadísticas, validación, firma HMAC válida e inválida, repos y contribuciones con GitHub simulado y caído, cotización con n8n bien, caído y sin URL, chat con `NullProvider` (503) y con proveedor simulado, rate limit, SSE con varios clientes, CORS y que **ninguna ruta, tabla, respuesta ni log contenga la IP en claro**.

## Variables de entorno

Ver `.env.example`. Nunca subas un `.env` real.

| Variable | Por defecto | Descripción |
|---|---|---|
| `DATABASE_URL` | `sqlite:///./portfolio_dev.db` | Postgres en producción. `postgres://` y `postgresql://` se normalizan a `postgresql+psycopg://`. |
| `ALLOWED_ORIGINS` | `http://localhost:3000,http://localhost:3100` | Orígenes CORS permitidos, separados por coma. Sin credenciales ni cookies. |
| `RATE_LIMIT_SALT` | _(aleatoria al arrancar)_ | Sal secreta del HMAC de la IP. **Defínela en producción** (`python -c "import secrets; print(secrets.token_hex(32))"`). |
| `TRUSTED_PROXY_HOPS` | `1` | Proxies de confianza delante de la API (Railway/Fly = 1; con un rewrite de Vercel por delante = 2). |
| `ASK_RATE_LIMIT` | `10` | Preguntas por hora por IP hasheada. |
| `QUOTE_RATE_LIMIT` | `5` | Cotizaciones por hora por IP hasheada. |
| `GITHUB_USER` | `nieldro` | Usuario cuyos repos se listan. |
| `GITHUB_TOKEN` | _(vacío)_ | Token **de solo lectura**. Sin él, repos y contribuciones quedan vacíos / 503. |
| `GITHUB_WEBHOOK_SECRET` | _(vacío)_ | Secreto compartido del webhook. Sin él, el endpoint responde 503. |
| `ENABLE_SCHEDULER` | `true` | Refresco de respaldo cada hora (`REPOS_REFRESH_SECONDS`, 3600). Se apaga en pruebas. |
| `ANTHROPIC_API_KEY` | _(vacío)_ | Activa `AnthropicProvider`. Vacío = chat desconectado (503). |
| `LLM_MODEL` | `claude-haiku-5-5` | Modelo del chat. |
| `N8N_QUOTE_WEBHOOK` | _(vacío)_ | URL del Webhook de n8n. Vacío = el lead se guarda igual, `notified: false`. |

Otros ajustes (con valores razonables): `CONTRIBUTIONS_TTL_SECONDS`, `STATS_CACHE_SECONDS`, `STREAM_HEARTBEAT_SECONDS`, `STREAM_MAX_CLIENTS`, `N8N_TIMEOUT_SECONDS`; todos en `app/config.py`.

## Endpoints

| Método y ruta | Descripción |
|---|---|
| `GET /api/health` | `{"ok": true}` |
| `POST /api/visit` | Crea una sesión. País desde `x-vercel-ip-country` o `cf-ipcountry`; dispositivo (`mobile`/`tablet`/`desktop`) desde el user-agent. Devuelve `{"session_id"}`. |
| `POST /api/event` | `{session_id, section, depth}`. `section` ∈ `ruido, limpieza, historial, modelo, archivo, pipeline, servicios, senal`; `depth` 0-100. 422 si no valida, 404 si la sesión no existe. |
| `GET /api/stats` | `visits_today` (día UTC), `visits_total`, `countries`, `scroll_depth` (promedio de la profundidad **máxima** por sesión en cada sección). Caché de 15 s. |
| `GET /api/stream` | SSE con eventos `visit` y `event` anónimos, `retry` y heartbeat (`: ping`) cada 15 s. |
| `POST /api/ask` | `{question}` (1-500 caracteres). 200 `{answer}`; 422 si está vacía o es larga; 429 con `Retry-After`; 503 `{detail, code: "llm_not_configured"}` si no hay proveedor; 502 si el proveedor falla. |
| `GET /api/repos` | Repos con topic `portfolio` desde la caché: `{repos: [...], synced_at}`. Caché vacía = `{repos: [], synced_at: null}`. |
| `GET /api/contributions` | Heatmap del último año (`weeks[][] {date, count, level 0-4}`), `synced_at` y `stale`. |
| `POST /api/github/webhook` | Valida `X-Hub-Signature-256`. 401 si falta o es inválida; `ping` = 200; `push`/`repository` refrescan la caché en segundo plano. |
| `POST /api/quote` | `{service, budget?, deadline?, contact, message?}`. Guarda el lead y avisa a n8n. Siempre 200 `{ok: true, notified: bool}` si valida. 422 / 429 en otro caso. |

Los errores propios llevan la forma `{"detail": "...", "code": "..."}`.

## Desplegar

El `Dockerfile` sirve para ambas plataformas (escucha en `$PORT`, usuario sin privilegios, `--no-access-log`).

### Railway

1. Nuevo proyecto → **Deploy from GitHub repo** (`nieldro/RUIDO`) y en el servicio, **Root Directory = `backend`**. Railway detecta el `Dockerfile`.
2. **Add → Database → PostgreSQL**. En las variables del servicio: `DATABASE_URL = ${{Postgres.DATABASE_URL}}`.
3. Añade el resto de variables (`ALLOWED_ORIGINS` con el dominio real del frontend, `RATE_LIMIT_SALT`, `GITHUB_TOKEN`, `GITHUB_WEBHOOK_SECRET`, `N8N_QUOTE_WEBHOOK`…).
4. **Settings → Networking → Generate Domain**. Comprueba `https://<dominio>/api/health`.

### Fly.io

```bash
cd backend
fly launch --no-deploy            # genera fly.toml; internal_port = 8000
fly postgres create               # o usa un Postgres existente
fly postgres attach <app-postgres>   # define DATABASE_URL como secreto
fly secrets set RATE_LIMIT_SALT=$(python -c "import secrets; print(secrets.token_hex(32))") \
    GITHUB_TOKEN=... GITHUB_WEBHOOK_SECRET=... N8N_QUOTE_WEBHOOK=... \
    ALLOWED_ORIGINS=https://tu-dominio.com
fly deploy
```

Mantén **una sola instancia**: el rate limit, la caché de estadísticas y el stream SSE viven en memoria del proceso (ver limitaciones).

## GitHub: topic y webhook

**Topic.** La API lista únicamente los repos públicos de `GITHUB_USER` con el topic `portfolio`. En cada repo: *About → ⚙ → Topics → `portfolio`*. Quitar el topic lo retira del portafolio en el siguiente refresco.

**Token (solo lectura).** *Settings → Developer settings → Fine-grained tokens* → acceso a repos públicos, sin permisos de escritura. Va únicamente en `GITHUB_TOKEN` del servidor, nunca en el frontend ni en el repo.

**Webhook** (en cada repo, o a nivel de cuenta/organización si se prefiere):

1. *Settings → Webhooks → Add webhook*.
2. **Payload URL**: `https://<tu-api>/api/github/webhook`
3. **Content type**: `application/json`
4. **Secret**: el mismo valor que `GITHUB_WEBHOOK_SECRET`.
5. **Events**: *Let me select individual events* → **Pushes** y **Repositories**.
6. Guardar. GitHub envía un `ping`; en *Recent Deliveries* debe verse `200`.

Si falla la firma la API responde 401; si no hay secreto configurado, 503. Además hay un refresco de respaldo cada hora por si se pierde un webhook.

## Flujo de n8n para las cotizaciones

1. En n8n, crea un workflow nuevo con un nodo **Webhook**: método `POST`, path `quote`, *Respond* = *Immediately*. Copia la **Production URL**.
2. Conéctalo a un nodo **Send Email** (SMTP/Gmail) y/o a un nodo de **WhatsApp** (WhatsApp Business Cloud o Twilio). El cuerpo llega en `{{ $json.body }}`:
   ```json
   { "lead_id": 12, "service": "...", "budget": "...", "deadline": "...",
     "contact": "...", "message": "...", "created_at": "2026-10-22T15:35:06+00:00" }
   ```
   Ejemplo de asunto: `Nueva cotización: {{ $json.body.service }}`; cuerpo: contacto, presupuesto, plazo y mensaje.
3. **Activa** el workflow (la Production URL solo responde con el workflow activo).
4. Pega la URL en `N8N_QUOTE_WEBHOOK` y reinicia el servicio.

La API llama con timeout corto (4 s) y reintenta una vez. Si n8n falla o no hay URL, el lead **ya está guardado** en la tabla `leads` y la respuesta es `{"ok": true, "notified": false}`.

## Privacidad

- **La IP no se guarda.** Ninguna tabla tiene columna de IP, ni el payload a n8n, ni las respuestas, ni los logs de la app.
- **Uso único de la IP: rate limit.** Se convierte en `HMAC-SHA256(RATE_LIMIT_SALT, fecha_UTC | IP)` y solo ese hash vive en memoria del proceso (nada en disco). Como la fecha entra en el HMAC, el hash **rota cada día** y no permite seguir a una persona entre días; al reiniciar, todo se olvida.
- **IP real**: se toma de `X-Forwarded-For` contando `TRUSTED_PROXY_HOPS` desde la derecha (lo que escribe el cliente a la izquierda es falsificable) o, sin cabecera, del cliente directo.
- **Sin cookies**, propias ni de terceros; CORS solo para `ALLOWED_ORIGINS` y sin credenciales.
- De cada visita solo se guarda: país (2 letras, de la cabecera de la plataforma), tipo de dispositivo y secciones/profundidad de scroll, todo ligado a un UUID aleatorio sin relación con la persona.
- El stream en vivo es anónimo: no incluye IDs de sesión ni IPs.
- La única información personal que se almacena es la que el visitante escribe voluntariamente en el cotizador (`contact`, `message`), con el fin de responderle.
- Matiz honesto: el proveedor de hosting (Railway/Fly) y su proxy pueden registrar IPs en su propia capa; esta API no lo hace ni lo controla.

## Estructura

```
backend/
├── app/
│   ├── main.py            # create_app: CORS, estado, lifespan (tablas + scheduler)
│   ├── config.py          # Settings (pydantic-settings)
│   ├── db.py · models.py  # engine y tablas SQLModel
│   ├── deps.py · errors.py
│   ├── cv_context.md      # única fuente del chat
│   ├── routers/           # analytics, ask, github, quote, health
│   └── services/          # github, llm, ratelimit, stats, stream, notify
├── tests/                 # pytest, SQLite en memoria, red simulada
├── schema.sql             # referencia del esquema Postgres
├── Dockerfile · .env.example · requirements*.txt
```

## Limitaciones conocidas

- Rate limit, caché de estadísticas y SSE son **en memoria por proceso**: con varias réplicas cada una cuenta aparte. Para escalar horizontalmente habría que pasarlos a Redis/Postgres LISTEN-NOTIFY.
- `/api/visit` y `/api/event` no tienen rate limit propio (se espera que el proveedor de hosting lo cubra); `ask` y `quote` sí.
- "Visitas de hoy" usa el día UTC.
- No hay migraciones (Alembic): el esquema se crea con `create_all`. Un cambio de columnas en producción requiere SQL manual.
