---
name: Portafolio Ruido → Señal
description: Portafolio de datos en oscuro casi negro con un solo acido; empieza como ruido y se limpia al hacer scroll hasta una sección final de papel.
colors:
  bg: "#0b0b0a"
  surface: "#141412"
  fg: "#ede8df"
  fg-2: "#cfc9be"
  mute: "#8f8a80"
  line: "#2a2925"
  line-2: "#3a3833"
  acid: "#c6ff3d"
  glitch-a: "#ff2e88"
  glitch-b: "#2ee6ff"
  paper: "#ede8df"
  ink: "#0b0b0a"
  mute-ink: "#5c574e"
  line-ink: "#c9c2b4"
typography:
  display:
    fontFamily: "Anton, Impact, sans-serif"
    fontSize: "clamp(3.25rem, 11vw, 10rem)"
    fontWeight: 400
    lineHeight: 0.96
    letterSpacing: "-0.005em"
  display-hero:
    fontFamily: "Anton, Impact, sans-serif"
    fontSize: "clamp(3rem, 20.4vw, 30rem)"
    fontWeight: 400
    lineHeight: 0.82
    letterSpacing: "-0.005em"
  display-card:
    fontFamily: "Anton, Impact, sans-serif"
    fontSize: "clamp(2rem, 3.6vw, 3.25rem)"
    fontWeight: 400
    lineHeight: 0.96
    letterSpacing: "-0.005em"
  body:
    fontFamily: "JetBrains Mono, ui-monospace, monospace"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.7
    letterSpacing: "0.005em"
  body-sm:
    fontFamily: "JetBrains Mono, ui-monospace, monospace"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "JetBrains Mono, ui-monospace, monospace"
    fontSize: "0.8125rem"
    fontWeight: 400
    lineHeight: 1.5
rounded:
  none: "0px"
spacing:
  gutter: "clamp(1rem, 4vw, 3rem)"
  container-max: "96rem"
  section-y-mobile: "5rem"
  section-y-desktop: "8rem"
  control-height: "2.75rem"
components:
  button-acid:
    backgroundColor: "{colors.acid}"
    textColor: "{colors.bg}"
    rounded: "{rounded.none}"
    padding: "0 1.25rem"
    height: "2.75rem"
  button-acid-hover:
    backgroundColor: "{colors.fg}"
    textColor: "{colors.bg}"
  button-acid-disabled:
    backgroundColor: "{colors.line-2}"
    textColor: "{colors.mute}"
  field:
    backgroundColor: "{colors.bg}"
    textColor: "{colors.fg}"
    rounded: "{rounded.none}"
    padding: "0.5rem 0.75rem"
    height: "2.75rem"
  card-dataset:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.fg}"
    rounded: "{rounded.none}"
  card-dataset-header:
    backgroundColor: "{colors.bg}"
    textColor: "{colors.fg-2}"
    padding: "0.5rem 1rem"
  service-row-open:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.fg-2}"
  invert-link:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
  invert-link-hover:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
---

# Design System: Portafolio Ruido → Señal

## Overview

**Creative North Star: "La Terminal que se Limpia"**

La pagina es el dato. Arranca como un campo de ruido (grano, lineas de escaneo, particulas de caracteres, titulo que se decodifica y hace glitch) y cada scroll lo vuelve señal: el indicador de cabecera baja de 100 % a 0 %, las particulas se ordenan en columnas, rejilla y heatmap, y la ultima seccion se invierte a papel, quieta y legible. Todo se compone como un lenguaje de consola: monoespaciada para todo salvo los titulos, rotulos tipo nombre de archivo, consultas con `>`, tablas y diagramas de bordes finos.

La densidad es alta pero respirada: texto claro sobre casi negro con interlineado generoso (1.7), tarjetas planas separadas por lineas de 1px, titulos de Anton en mayuscula a escala de cartel. No hay curvas, sombras ni degradados decorativos; la profundidad es tonal (fondo, superficie) y de borde. El movimiento es parte del mensaje (ruido que se resuelve) y siempre desaparece con `prefers-reduced-motion`.

**Key Characteristics:**
- Un solo acido (#c6ff3d) sobre fondo oscuro; rosa/cian solo como efecto, nunca como color de interfaz.
- Anton en mayuscula muy grande para titulos; JetBrains Mono para todo lo demas.
- Ceros radios, cero sombras; paneles de borde de 1px sobre superficie ligeramente mas clara.
- Grano y lineas de escaneo solo en el hero; seccion final invertida y quieta.
- Datos sinteticos siempre rotulados; lo que falta se marca [PLACEHOLDER].

## Colors

Casi negro calido con papel calido como texto, un acido unico y un par glitch confinado a efectos.

### Primary
- **Acido** (#c6ff3d): el unico acento. Fondo de botones de accion, estado activo de conmutadores (ES/EN, COP/USD), indicador `[ RUIDO XX% ]`, signo `>` de consola, marcador +/- de filas, barras de profundidad, paquetes del pipeline, outline de foco y seleccion de texto. Sobre papel no se usa como texto.

### Secondary
- **Glitch rosa** (#ff2e88) y **Glitch cian** (#2ee6ff): solo en efectos (capas del glitch del titulo del hero y particulas del campo de ruido). Nunca en texto, bordes, botones ni graficos de datos.

### Neutral
- **Fondo** (#0b0b0a): lienzo de pagina, cabecera de tarjetas, campos de formulario.
- **Superficie** (#141412): paneles, tarjetas-dataset, formulario, fila de servicio expandida, hover de fila.
- **Papel calido** (#ede8df): texto principal (`fg`) sobre oscuro y fondo de la seccion invertida.
- **Gris calido** (#cfc9be): texto secundario y cuerpo de parrafos.
- **Apagado** (#8f8a80): etiquetas, metadatos, placeholders, cifras aun «ruidosas».
- **Linea** (#2a2925) y **Linea 2** (#3a3833): divisores de seccion y bordes de componentes/campos.
- **Tinta** (#0b0b0a), **Apagado sobre papel** (#5c574e), **Linea sobre papel** (#c9c2b4): equivalentes dentro de la seccion invertida (el apagado se oscurece para pasar contraste AA).

### Named Rules
**The One Acid Rule.** El acido es el unico acento y marca estado, accion o señal; si todo es acido, nada lo es.
**The Effects-Only Glitch Rule.** Rosa y cian pertenecen a efectos (glitch del titulo, particulas); jamas a elementos de interfaz.
**The Paper Has No Acid Rule.** En la seccion invertida el acento no se usa como texto; el estado activo se invierte a tinta sobre papel.

## Typography

**Display Font:** Anton (con Impact, sans-serif)
**Body/Label/Mono Font:** JetBrains Mono (con ui-monospace, monospace)

**Character:** Un cartel condensado y gritado (Anton, siempre mayuscula) sobre una consola monoespaciada tranquila. El contraste de escala es el sistema: titulos enormes, cuerpo de 16px, etiquetas de 13px.

### Hierarchy
- **Display hero** (Anton 400, clamp(3rem, 20.4vw, 30rem), 0.82): nombre en el hero; la seccion final usa el mismo tratamiento a clamp(3rem, 21.5vw, 28rem).
- **Display section** (Anton 400, clamp(3.25rem, 11vw, 10rem), 0.96): titulo de cada seccion (`.display.h-section`).
- **Display card** (Anton 400, clamp(2rem, 3.6vw, 3.25rem), 0.96): titulo de tarjeta-dataset, formulario y paneles; variantes menores en 1.75-2.5rem y en 1.5-2.25rem (nodos del pipeline); cifras del panel en vivo a clamp(3rem, 6vw, 5rem).
- **Body** (JetBrains Mono 400, 1rem/1.7, +0.005em, cifras tabulares): parrafos, maximo 48-70ch.
- **Body small** (0.9375rem/1.6): texto de tarjetas, listas, filas.
- **Label** (0.8125rem/1.5, apagado): rotulos, cabeceras de columna, metadatos; el piso es 13px.

### Named Rules
**The Anton-Is-Display-Only Rule.** Anton solo en mayuscula y solo para titulos y cifras grandes; nunca en cuerpo ni en etiquetas.
**The Thirteen-Pixel Floor Rule.** Ningun texto por debajo de 0.8125rem.

## Layout

Una pagina larga de scroll continuo, ocho secciones separadas por un filete de 1px (`border-t` linea) y relleno vertical de 5rem (movil) / 8rem (escritorio). Contenedor `container-x`: ancho 100 %, maximo 96rem, margenes laterales clamp(1rem, 4vw, 3rem) respetando safe-area. Rejillas de 12 columnas en Modelo (7/5, 5/7, 12), 1.35fr/1fr para titulo + intro, y columnas de tabla de servicios `minmax(0,1fr) 13rem 9rem 7rem`. En movil todo apila; los diagramas se vuelven verticales; el nav de cabecera se oculta bajo `sm`. Controles tactiles de alto minimo 2.75rem (cabecera 3rem). Hueco habitual 1.25-1.5rem entre tarjetas, 2rem entre columnas internas.

## Elevation & Depth

Plano. No hay sombras en ninguna parte. La profundidad es tonal: fondo (#0b0b0a), superficie (#141412) y cabecera de tarjeta de vuelta a fondo, mas bordes de 1px (`line-2`). La cabecera fija se distingue por un filete inferior y su fondo solido. El campo de particulas es un lienzo fijo detras del contenido (z-0; el contenido va en z-10).

### Named Rules
**The Flat-Always Rule.** Ni sombras, ni degradados decorativos, ni blur de fondo; separar con borde o con salto de tono.

## Shapes

Esquinas rectas en todo (`--radius-*: initial` en el tema y `border-radius: 0` en controles). Siluetas cuadradas: marcadores y paquetes son cuadrados de 8-16px, nunca circulos. Bordes de 1px; el borde acido marca el nodo final o destacado de una cadena. Las flechas de conector se dibujan con bordes (triangulo de border) y filetes de 1px.

## Components

### Cabecera con indicador de ruido
Barra fija de 3rem, fondo `bg` y filete inferior; en la seccion invertida cambia a papel/tinta (transicion de color 200ms). Logo en negrita, dos enlaces de atajo (ocultos en movil), indicador `[ RUIDO NNN% ]` con el valor en acido (en tinta sobre papel) escrito directo al DOM desde el ticker de GSAP, y grupo ES/EN: activo = acido sobre fondo, inactivo = apagado. Enlace «saltar al contenido» visible solo con foco.

### Boton acento
Fondo acido, texto `bg`, negrita, alto minimo 2.75rem, relleno horizontal 1.25-1.5rem, sin radio. Hover: fondo `fg`. Presionado: escala 0.97 (160ms, ease-out). Deshabilitado: fondo `line-2`, texto apagado. En la seccion invertida el boton es de tinta, y deshabilitado queda con borde `line-ink` y texto `mute-ink`, rotulado con nota [PLACEHOLDER].

### Fila expandible de servicios
Lista con filete superior; cada fila es un boton ancho (`aria-expanded`, sin efecto de presionado) con nombre llano + termino tecnico apagado debajo, precio en Anton (o texto «cotizar»), entrega y un `+`/`–` acido. Hover: fondo superficie. El panel se abre con `grid-template-rows` 0fr→1fr en 220ms (cierra en 160ms, ease-out), se monta la primera vez que se abre y queda `inert` cerrado. El interior es una superficie en tres columnas: incluye / no incluye / ejemplo + boton acento. Los grupos llevan titulo Anton con filete inferior.

### Tarjeta-dataset (Modelo)
Articulo con borde `line-2` sobre superficie; encabezado en `bg` con nombre de archivo en gris y forma en apagado, y una etiqueta con borde para «sintetico» cuando los datos no son reales. Cuerpo con titulo Anton, texto de maximo 56ch y una pieza de datos: grafico SVG de lineas (real = acido solido, reportado = gris discontinuo), tabla CSV, nodos de pipeline (`border-line-2`, el destacado con borde acido), demo PDF → tabla con celdas resaltadas en acido/`bg`, o cadena de bloques. Los graficos se dibujan con el scroll.

### Panel en vivo (Pipeline)
Diagrama de cuatro nodos (superficie, titulo Anton) unidos por filetes acido con tres paquetes cuadrados acido que lo cruzan en escritorio. Debajo, panel de estado con cabecera (titulo + punto cuadrado acido si esta en vivo), cifras Anton con conteo ascendente, barras de profundidad de scroll (`scaleX`, 500ms) y un log de consola con `>` acido y lineas que entran con `fade-in`. Sin datos muestra «—» en apagado, nunca un cero inventado.

### Formulario
Contenedor con borde `line-2` sobre superficie, relleno 1.25-2rem. Campos: fondo `bg`, borde `line-2`, alto minimo 2.75rem, etiqueta 0.9375rem en gris, sugerencia apagada. Foco: borde acido y outline acido de 2px con desplazamiento. Error: texto en negrita en `fg` (sin color de alerta) y foco al primer campo faltante. Estado ok/correo en acido con `fade-in`. Funciona sin backend (abre correo precargado).

### Seccion invertida (SEÑAL)
Papel (#ede8df) con tinta (#0b0b0a); redefine `--mute`, `--line` y `--line-2` a sus equivalentes sobre papel, seleccion y foco en tinta. Titulo Anton gigante, lista de enlaces con filete de tinta cuyo hover invierte (tinta con texto papel), boton de CV deshabilitado y rotulado. Sin movimiento propio.

### Hero (grano, escaneo y glitch)
`.hero-scan`: grano fractal al 7 % de opacidad con animacion `steps(6)` y lineas de escaneo de 1px cada 3px al 20 %; ambos exclusivos del hero. Titulo `<h1>` real que se decodifica letra a letra y dispara ráfagas de glitch de 400ms con dos capas rosa/cian recortadas por `clip-path` y `mix-blend-mode: screen`, cada 2.8-5.5s o al pasar el puntero. Debajo, un log que se escribe con un cursor parpadeante.

### Movimiento
Tokens: `--ease-out` cubic-bezier(0.23, 1, 0.32, 1) y `--ease-in-out` cubic-bezier(0.77, 0, 0.175, 1) (GSAP usa `expo.out` como equivalente). Duraciones: color/fondo 150ms; presionado 160ms; entrada `fade-in` 200ms con 6px de desplazamiento y retraso 45ms por indice; apertura de fila 220ms / cierre 160ms; cambio de idioma 110ms con blur de 2px; campo estatico de ruido 700ms; glitch 400ms.
- Todo efecto de scroll vive dentro de `gsap.matchMedia()` con `(prefers-reduced-motion: no-preference)`; los paquetes del pipeline ademas exigen `(min-width: 768px)`. Las animaciones se crean con `whenIdle`.
- El bloque `prefers-reduced-motion: reduce` apaga capas de glitch, grano y cursor, y reduce animaciones/transiciones a 0.001ms.
- El canvas de particulas (Three.js, 1500 particulas; 500 bajo 768px) se difiere hasta la primera interaccion o 8s tras la carga, no se monta con movimiento reducido y cae a nada si falla WebGL; el campo estatico del hero se desvanece cuando el vivo toma el relevo.
- Scrub de ScrollTrigger (0.5) para tarjetas que se enderezan, trazos que se dibujan y barras de KPI; aparicion unica (`toggleActions: play none none none`) para titulos y filas.

## Do's and Don'ts

### Do:
- **Do** usar el acido (#c6ff3d) solo para accion, estado activo o señal, y siempre sobre fondo oscuro.
- **Do** poner Anton en mayuscula para titulos y cifras grandes y JetBrains Mono para todo lo demas, con un minimo de 0.8125rem.
- **Do** separar con filetes de 1px (`line` / `line-2`) y saltos de tono entre `bg` y `surface`.
- **Do** rotular los datos sinteticos y marcar lo que falta como [PLACEHOLDER] (CV en PDF, enlaces a repos/demos, ejemplos reales, LLM del chat).
- **Do** mostrar «—» cuando un dato no existe en lugar de inventarlo.
- **Do** envolver todo efecto de scroll en `matchMedia` con `prefers-reduced-motion: no-preference` y mantener foco visible (outline acido de 2px; tinta sobre papel).

### Don't:
- **Don't** usar radios, sombras ni degradados decorativos.
- **Don't** usar el acido como texto sobre papel ni en la seccion invertida.
- **Don't** usar rosa/cian fuera de efectos: el glitch de capas vive solo en el hero y los dos colores nunca van en interfaz.
- **Don't** poner grano ni lineas de escaneo fuera del hero ni animar la seccion final.
- **Don't** inventar datos, metricas, enlaces ni logos; no hay placeholders con aspecto de real.
- **Don't** usar Anton en minuscula o en cuerpo, ni tipos de sistema como cara de titulo.
