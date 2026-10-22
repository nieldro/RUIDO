# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Frontend: Next.js (App Router) + TypeScript + Tailwind en `frontend/`, desplegado en Vercel. Scroll y animación: GSAP + ScrollTrigger y Lenis. Partículas: un solo canvas fijo con React Three Fiber. Gráficos: D3 u Observable Plot. Backend: FastAPI + PostgreSQL (SQLModel) en `backend/`, desplegable en Railway o Fly.io. i18n: ES por defecto y EN con toggle, textos en diccionarios, nunca hardcodeados. (Daniel cambió de React + Vite a Next.js el 22-oct-2026.)

## Users

Tres audiencias, confirmadas por Daniel:

- **Reclutadores:** escanean en unos 30 segundos. Necesitan ver rol, stack y evidencia sin leer de más.
- **Líderes técnicos:** revisan el código y la arquitectura. Quieren ver criterio de ingeniería real.
- **Clientes freelance:** buscan quién les construya web, chatbots, automatizaciones o tableros.

## Product Purpose

Portafolio personal de Daniel Alejandro Páez Torres («Alejo»), analista de datos y desarrollador en Bogotá, Colombia, con 3 años de experiencia en ETL/ELT con Python, PostgreSQL, Power BI, cloud (GCP, Azure, AWS) y automatización con IA.

Objetivo doble:

1. Conseguir entrevistas para roles de Data Analyst, Analytics Engineer o BI Developer, remotos o híbridos.
2. Vender servicios freelance: desarrollo web, chatbots, automatizaciones con n8n, publicidad digital y BI.

Debe demostrar tres cosas a la vez: criterio de diseño, backend real y análisis de datos.

## Positioning

Una sola persona que cubre la cadena completa: datos desordenados → pipeline → modelo → tablero → decisión, y además diseña y construye la interfaz. Concepto central del sitio, definido por Daniel: «Ruido → Señal», la metáfora de su trabajo de convertir datos desordenados en decisiones.

## Operating Context

Daniel busca empleo remoto o híbrido y a la vez toma trabajo freelance. Su experiencia se ha dado en proyectos con datos de clientes, por lo que la evidencia pública debe anonimizarse o usar datos ficticios.

## Capabilities and Constraints

- Contenido a mostrar: tableros Power BI / Looker, ETL/ELT, bases de datos (PostgreSQL), automatización (n8n, IA), desarrollo web / front, chatbots, publicidad digital.
- Idioma: español primero, con versión en inglés (toggle ES/EN). El nivel de inglés de Daniel no se declara en el sitio sin que él lo confirme.
- Requisitos técnicos: accesible (WCAG AA, prefers-reduced-motion), rápido (Lighthouse 90+) y que funcione bien en móvil.
- Nada de datos, nombres de clientes, credenciales o URLs internas sin autorización explícita.
- Sin decidir: dominio, hosting, datos de contacto públicos, foto.

## Brand Commitments

Nombre: Daniel Alejandro Páez Torres, «Alejo».

Personalidad confirmada: técnica, directa, con humor seco, brutalista y nada corporativa. Caótica al inicio y precisa al final.

Restricciones visuales que Daniel declaró como vinculantes (se registran tal cual; el mundo visual y la superficie se desarrollan en new-work/shape):

- Colores: fondo #0B0B0A, texto #EDE8DF, secundario #CFC9BE, apagado #8F8A80, líneas #2A2925 y #3A3833, superficie #141412, único acento #C6FF3D; glitch #FF2E88 y #2EE6FF solo en efectos. La sección final se invierte (fondo #EDE8DF, texto #0B0B0A).
- Tipografía: Anton para títulos (siempre en mayúsculas, muy grande) y JetBrains Mono para todo lo demás.
- Sin bordes redondeados, sin sombras y sin gradientes decorativos. Grano y líneas de escaneo solo en el hero.
- Mecánica del concepto: el sitio empieza como caos visual (glitch, partículas, estática) y cada scroll lo limpia hasta terminar en un contacto calmado. Un indicador [ RUIDO XX% ] baja de 100% a 0% a lo largo de la página.

## Evidence on Hand

Daniel entregó el 22-oct-2026 su CV en texto (experiencia con métricas, proyectos, skills, educación, idiomas, contacto), que es la única fuente permitida de hechos del sitio; el contenido vive en los diccionarios del frontend. Muestra como «DANIEL PÁEZ»; logo «ALEJO.DATA». Contacto: dapt.torres@gmail.com · linkedin.com/in/daniel-paez-torres · github.com/nieldro. Idiomas: español nativo, inglés B1.

Ausentes y que no se deben fabricar: el PDF del CV, enlaces a repos o demos de los proyectos, datos reales de la empresa (los gráficos de casos son sintéticos y rotulados), ejemplos reales para los servicios sin evidencia (Shopify, Meta/Google Ads, WhatsApp), el flujo de n8n. Todo lo que falte va como [PLACEHOLDER]. Los precios de servicios son de referencia («desde») y viven en `content/services.json`.

## Product Principles

1. Solo lo verificable: ningún proyecto, herramienta o cifra que Daniel no pueda defender en una entrevista.
2. Evidencia sobre adjetivos: cada habilidad se apoya en un caso concreto.
3. Legible en 30 segundos para un reclutador, con profundidad disponible para quien revisa el código.
4. Criterio de diseño, backend real y análisis de datos deben verse a la vez, no en secciones separadas.
5. Protege la confidencialidad de clientes: anonimizar o usar datos ficticios.

## Accessibility & Inclusion

WCAG AA. Respetar prefers-reduced-motion: el efecto de ruido, glitch y partículas debe tener una versión estática equivalente que conserve el indicador de ruido. Contraste a verificar sobre los colores declarados, en especial el apagado #8F8A80 en texto pequeño.
