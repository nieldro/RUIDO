# Seguridad

## Cómo reportar un problema

Si encuentras una vulnerabilidad, **no abras un issue público**. Escribe a dapt.torres@gmail.com con:

- qué encontraste y dónde (archivo, endpoint o sección del sitio),
- cómo reproducirlo,
- el impacto que crees que tiene.

Respondo en pocos días. No hay programa de recompensas.

## Qué se protege en este proyecto

- **Sin IP del visitante:** ninguna ruta guarda ni registra la dirección IP. El rate limit solo usa un HMAC-SHA256 de la IP con sal secreta, que cambia cada día UTC y vive en memoria, y uvicorn corre con `--no-access-log`. Ver la sección *Privacidad* del README.
- **Webhook de GitHub:** `POST /api/github/webhook` exige la firma HMAC (`GITHUB_WEBHOOK_SECRET`).
- **Secretos:** `.env` y `.env.local` están en `.gitignore`; solo se versionan los `.env.example`.
- **CORS:** el backend solo acepta los orígenes de `ALLOWED_ORIGINS`.

Si ves un secreto o un dato personal en el historial del repo, avísame para rotarlo.
