# RUIDO → SEÑAL

Portafolio de **Daniel Páez** («Alejo»), analista de datos y desarrollador en Bogotá. El sitio empieza como ruido visual (glitch, partículas, estática) y cada scroll lo limpia hasta llegar a un contacto calmado. Un indicador `[ RUIDO XX% ]` baja de 100 a 0 a lo largo de la página: la metáfora de convertir datos desordenados en decisiones.

El sitio es, a la vez, un proyecto: **el visitante es el dataset**. Su visita viaja del navegador a una API en FastAPI, se guarda en PostgreSQL y aparece en un panel en vivo.

## Qué hay aquí

```
frontend/   Next.js (App Router) + TypeScript + Tailwind v4, exportado como sitio estático
backend/    FastAPI + SQLModel + PostgreSQL (visitas, panel en vivo, GitHub, cotizaciones, chat del CV)
PRODUCT.md  Contexto de producto (usuarios, restricciones, hechos permitidos)
.impeccable/ Brief de la superficie y capturas de revisión
```

### Frontend
- **Movimiento:** GSAP + ScrollTrigger y Lenis. Un solo ticker escribe el estado de scroll que leen el indicador y el canvas.
- **Partículas:** un único `<canvas>` fijo con React Three Fiber. Cada partícula es un carácter; cambia de «formación» (caos → columnas de skills → riel → cuadrícula → heatmap → paquetes del pipeline) según el scroll y reacciona al mouse. Se carga aparte, después del primer pintado.
- **Hero:** el nombre se decodifica letra a letra y dispara ráfagas de glitch RGB con capas recortadas con `clip-path`.
- **Textos:** diccionarios en `src/content/es.ts` y `en.ts` (ES por defecto, toggle EN). Los precios de servicios viven en `src/content/services.json`.
- **Accesibilidad y rendimiento:** con `prefers-reduced-motion` no hay glitch, ni partículas, ni scroll suave; el indicador salta de valor por sección. Contraste AA sobre los tokens del brief.

### Backend
Lee `backend/README.md` (arquitectura, variables de entorno, despliegue, webhook de GitHub y flujo de n8n). Resumen:

| Endpoint | Para qué |
|---|---|
| `POST /api/visit`, `POST /api/event` | Cuenta la visita y hasta dónde llegó (anónimo) |
| `GET /api/stats`, `GET /api/stream` | Panel en vivo y log por SSE |
| `GET /api/repos`, `GET /api/contributions` | Sección «Archivo vivo» (repos con el topic `portfolio` y heatmap) |
| `POST /api/github/webhook` | Refresca la caché en cada push (firma HMAC) |
| `POST /api/quote` | Guarda la cotización y avisa por n8n |
| `POST /api/ask` | «Pregúntale a mi CV» (responde solo con el CV) |

## Correr en local

```bash
# backend (SQLite por defecto)
cd backend
python -m venv .venv && .venv\Scripts\activate
pip install -r requirements-dev.txt
python -m pytest
uvicorn app.main:create_app --factory --no-access-log --port 8000

# frontend
cd frontend
npm install
cp .env.example .env.local      # NEXT_PUBLIC_API_URL=http://localhost:8000
npm run dev
```

Sin `NEXT_PUBLIC_API_URL` el sitio funciona igual: el panel, el log y el chat muestran estados honestos de «sin conexión», y el formulario de cotización abre el correo con el mensaje ya escrito.

## Publicar

`npm run build` genera `frontend/out/` (HTML estático): sirve en nginx, Vercel o GitHub Pages. El backend es un contenedor (`backend/Dockerfile`) para Railway o Fly.io. Despliega **una sola instancia**: el rate limit, la caché de estadísticas y el SSE viven en memoria del proceso.

## Privacidad
No se guarda la IP en claro ni se usan cookies de terceros. El backend guarda un identificador de sesión anónimo, el país, el tipo de dispositivo y la profundidad de scroll por sección. La IP solo se usa, como hash con sal diaria, para limitar el ritmo de peticiones.

## Datos
Todo lo que el sitio afirma sale del CV de Daniel. Los gráficos de los casos de «Modelo» son **datos sintéticos** y están rotulados así; no son datos de ninguna empresa. Lo que falta (PDF del CV, enlaces a repos y demos, flujo de n8n) queda marcado como `[PLACEHOLDER]` hasta que exista.
