# Arquitectura

RUIDO → SEÑAL son dos piezas que se pueden publicar por separado:

- **Frontend** (`frontend/`): HTML estático. Funciona solo, sin servidor.
- **Backend** (`backend/`): API opcional. Sin ella, las secciones que la necesitan muestran «sin conexión».

La arquitectura del backend (diagrama, decisiones, privacidad y límites) está en [`backend/README.md`](../backend/README.md). Aquí va lo del frontend.

## Un solo documento, sin servidor

`next.config.ts` usa `output: "export"`: `npm run build` produce `frontend/out/` con HTML plano. Se sirve igual en nginx, Vercel o GitHub Pages. Lo que depende del entorno entra por variables `NEXT_PUBLIC_*` en tiempo de compilación (`NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_BASE_PATH`, `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_N8N_ENABLED`).

## Hidratación diferida por sección

`src/app/page.tsx` renderiza todas las secciones en el HTML (SEO, primer pintado, sin JavaScript), pero solo el hero se hidrata de inmediato. Cada sección de abajo es un `dynamic()` envuelto en `whenNear`: React no la hidrata hasta que el visitante se acerca (1400 px de margen con `IntersectionObserver`) o pasan 15 s. Así el hilo principal queda libre para el hero y el movimiento de cada sección arranca cuando ya se necesita.

## Movimiento

- **GSAP + ScrollTrigger y Lenis**, registrados en `src/lib/motion.ts`. Un solo ticker escribe el estado de scroll (`src/lib/scrollState.ts`) que leen el indicador `[ RUIDO XX% ]` y el canvas.
- **Un único `<canvas>` fijo** con React Three Fiber para las partículas; se carga aparte, después del primer pintado.
- **Movimiento reducido:** todo efecto de scroll se declara bajo la condición `MOTION_OK` de `gsap.matchMedia`. Con `prefers-reduced-motion` no hay glitch, partículas ni scroll suave.
- **Animaciones de arranque** con `whenIdle`: una por tarea, no todas juntas durante la hidratación.

## Idioma

`src/lib/locale.tsx` guarda el idioma en `localStorage` y lo lee con `useSyncExternalStore`: el servidor y la hidratación siempre dan español, y el cambio posterior no produce desajuste. Los textos viven en `src/content/es.ts` y `en.ts`; ambos deben tener la misma forma (lo verifica el tipo `Dict` y una prueba).

## Datos del backend

`src/lib/api.ts` concentra las llamadas a la API (visitas, estadísticas, repos, chat y el stream SSE); el cotizador de `Servicios.tsx` llama a `/api/quote` por su cuenta. Con `NEXT_PUBLIC_API_URL` vacía las secciones muestran su estado honesto de «sin conexión» y el cotizador abre el correo. El panel en vivo abre el stream SSE solo cuando su sección está cerca del viewport, para que la red quede inactiva al cargar.
