# Cambios

Formato basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/). El proyecto no usa versiones numeradas: se agrupa por fecha.

## 2026-10-31

### Agregado
- Pruebas unitarias del frontend con Vitest: `timeAgo` y coherencia entre los diccionarios `es`/`en` y `services.json`.
- `robots.txt`, `sitemap.xml` y `manifest.webmanifest` generados al compilar.
- CI del backend (`pytest`) y pasos de tipos y pruebas en el flujo de GitHub Pages.
- Dependabot mensual, `SECURITY.md`, `CONTRIBUTING.md`, `CODEOWNERS` y plantillas de issue y de pull request.
- Documentación en `docs/`: arquitectura del frontend y guía de despliegue.
- `.editorconfig`, `.gitattributes`, `.nvmrc` y `.python-version`.

### Cambiado
- README del frontend: comandos, variables y estructura reales en lugar del texto de `create-next-app`.
- ESLint ignora las compilaciones alternativas `out-*`; `.gitignore` las cubre todas.

### Eliminado
- SVG de ejemplo de `create-next-app` que nada usaba.

## 2026-10-22

- Primera versión pública: sitio estático (Next.js), backend FastAPI, CV descargable sin teléfono y flujo de GitHub Pages.
