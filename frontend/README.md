# Frontend · RUIDO → SEÑAL

Sitio del portafolio: Next.js (App Router) + TypeScript + Tailwind v4, exportado como HTML estático (`output: "export"`).

## Comandos

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo en http://localhost:3000 |
| `npm run build` | Genera el sitio estático en `out/` |
| `npm run lint` | ESLint con las reglas de Next (core-web-vitals + TypeScript) |
| `npm run typecheck` | Revisa los tipos sin generar nada |
| `npm test` | Pruebas unitarias con Vitest |

Requiere Node 22 (ver `.nvmrc`).

## Variables de entorno

Copia `.env.example` a `.env.local`. Todas son opcionales; sin `NEXT_PUBLIC_API_URL` el sitio funciona igual, con estados «sin conexión» y el formulario de cotización abriendo el correo.

| Variable | Para qué |
|---|---|
| `NEXT_PUBLIC_API_URL` | URL del backend FastAPI |
| `NEXT_PUBLIC_N8N_ENABLED` | `true` solo cuando el flujo de n8n está conectado |
| `NEXT_PUBLIC_SITE_URL` | Dominio público, para la vista previa al compartir |
| `NEXT_PUBLIC_BASE_PATH` | Subruta de publicación (GitHub Pages: `/RUIDO`) |

## Estructura

```
src/app/         Layout, página única, 404, íconos
src/components/  Secciones y piezas de movimiento (hero, canvas de partículas, pipeline…)
src/content/     Textos en español e inglés y precios de servicios
src/lib/         Utilidades: idioma, scroll, movimiento, tiempos relativos
public/          Imagen para compartir, ruido estático y CV descargable
```

Más contexto de producto y diseño en `../PRODUCT.md` y `../DESIGN.md`.
