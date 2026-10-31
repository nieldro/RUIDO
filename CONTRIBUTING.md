# Contribuir

Este es un portafolio personal, pero los arreglos y las sugerencias son bienvenidos.

## Antes de abrir un pull request

1. Abre un issue si el cambio es grande, para ponernos de acuerdo antes de escribirlo.
2. Revisa [`PRODUCT.md`](PRODUCT.md) y [`DESIGN.md`](DESIGN.md): fijan qué hechos puede afirmar el sitio y la dirección visual. Todo lo que el sitio dice sale del CV; no se inventan datos.
3. Prepara el entorno (ver la sección *Correr en local* del [README](README.md)).

## Qué debe pasar

```bash
# frontend/
npm run lint
npm run typecheck
npm test

# backend/
python -m pytest
```

El CI corre lo mismo. Si tocas el movimiento, comprueba también el sitio con `prefers-reduced-motion` activado: ningún efecto debe quedar sin su alternativa estática.

## Criterios del proyecto

- **Privacidad:** no se guarda ni se registra la IP del visitante. Hay pruebas que lo verifican; no las debilites.
- **Textos:** van en `frontend/src/content/es.ts` y `en.ts` con la misma forma. No dejes marcadores `[PLACEHOLDER]`.
- **Commits:** mensajes en español, en presente y que digan qué cambia y por qué, p. ej. «ESLint: ignora las carpetas de compilación alternativas».
- **Secretos:** nunca subas un `.env` real, tokens ni el CV con teléfono.
