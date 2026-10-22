---
version: 1
slug: "frontend-src-app-page-tsx"
primary_target: "frontend/src/app/page.tsx"
related_targets: []
---

# Portafolio «Ruido → Señal»

Scope: una página larga de scroll continuo, 8 secciones. Modo Experience (el artefacto manda); SERVICIOS y SEÑAL actúan como Persuade. Build path: code-led (sin generación de imágenes).

Audiencia y trabajo: reclutadores (30 s), líderes técnicos (código y arquitectura), clientes freelance. Acción: entrevista, cotización o contacto. Prueba: CV real de Daniel en los diccionarios; casos con datos sintéticos rotulados; nada que no esté en el brief.

Sin decidir: PDF del CV, enlaces a repos/demos, proveedor LLM del chat (Fase 3), ejemplos reales de servicios, flujo de n8n. Van como [PLACEHOLDER].

Fases: 1 front con contenido en diccionarios (secciones 1-4, 7, 8 y canvas); 2 backend (visitas, repos, contribuciones, webhook, cotización); 3 PIPELINE en vivo y chat del CV. Primero maqueta estática sin animación; después tipografía/espaciado, animación, backend.

## Direction contract

THESIS: la página es el dato. Empieza como ruido y cada scroll lo limpia; un indicador [ RUIDO XX% ] baja de 100 a 0. Rechaza el portafolio de plantilla (hero + tarjetas de skills + proyectos iguales). El backend del sitio es un proyecto en vivo y el visitante es su dataset.

OWN-WORLD: fondo #0B0B0A, texto #EDE8DF, secundario #CFC9BE, apagado #8F8A80, líneas #2A2925/#3A3833, superficie #141412, único acento #C6FF3D, glitch #FF2E88/#2EE6FF solo en efectos. Anton en mayúsculas muy grande para títulos; JetBrains Mono para todo lo demás. Sin radios, sombras ni gradientes decorativos; grano y líneas de escaneo solo en el hero. Última sección invertida (#EDE8DF / #0B0B0A); ahí el acento no es texto y el apagado se deriva más oscuro por contraste.

STORY: el visitante entiende quién es Daniel y qué hace en el primer viewport, ve el ruido volverse señal en cada empleo y proyecto, comprueba que el sitio mismo es un pipeline real, y termina con un contacto calmado y una cotización.

FIRST VIEWPORT: «DANIEL PÁEZ» en Anton a todo el ancho, <h1> real, con decodificación y glitch; subtítulo «Analista de datos y desarrollador. Saco señal del ruido.»; abajo a la izquierda un log que se escribe con problemas reales resueltos; arriba ALEJO.DATA, toggle ES/EN e indicador [ RUIDO 100% ]. Partículas de caracteres en caos detrás.

FORM: brief fijado por el usuario (la dirección fijada gana al sorteo); posición en la lista: n/a; seed:2923f1c83c0d9981 (dirección fijada por el brief del dueño; la tirada no se usó para elegir).

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
