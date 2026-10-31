# Despliegue

## Frontend en GitHub Pages

El flujo `.github/workflows/pages.yml` compila `frontend/` y lo publica en https://nieldro.github.io/RUIDO/ en cada push a `main` que toque `frontend/**`.

Una sola vez, en el repo: **Settings → Pages → Build and deployment → Source: GitHub Actions**.

El flujo corre `npm ci`, `npm run lint`, `npm run typecheck`, `npm test` y `npm run build` con:

| Variable | Valor |
|---|---|
| `NEXT_PUBLIC_BASE_PATH` | `/RUIDO` (el sitio vive bajo una subruta) |
| `NEXT_PUBLIC_SITE_URL` | `https://nieldro.github.io/RUIDO` |
| `NEXT_PUBLIC_API_URL` | variable de repositorio `API_URL` (opcional) |
| `NEXT_PUBLIC_N8N_ENABLED` | variable de repositorio `N8N_ENABLED` (opcional) |

Las variables de repositorio se crean en *Settings → Secrets and variables → Actions → Variables*. Sin `API_URL` el sitio se publica igual, con las secciones del backend en «sin conexión».

## Frontend con dominio propio

Compila sin subruta y con el dominio real:

```bash
cd frontend
NEXT_PUBLIC_SITE_URL=https://tu-dominio.com NEXT_PUBLIC_API_URL=https://tu-api.example npm run build
```

Sube el contenido de `frontend/out/` a cualquier servidor de archivos estáticos. Activa la compresión (gzip o brotli): el sitio carga mucho más rápido con ella.

## Backend

Es un contenedor (`backend/Dockerfile`) para Railway o Fly.io. Los pasos, las variables de entorno, el webhook de GitHub y el flujo de n8n están en [`backend/README.md`](../backend/README.md).

Dos cosas que conectan ambos lados:

1. **CORS:** `ALLOWED_ORIGINS` del backend debe incluir el *origen* del sitio, sin ruta: `https://nieldro.github.io` (no `https://nieldro.github.io/RUIDO`).
2. **Una sola instancia:** el rate limit, la caché de estadísticas y el stream SSE viven en memoria del proceso.

Cuando el backend esté en línea, guarda su URL en la variable de repositorio `API_URL` y vuelve a lanzar el flujo de Pages (*Actions → Publicar en GitHub Pages → Run workflow*).
