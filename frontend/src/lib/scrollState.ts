// Estado de scroll compartido y mutable. Lo escribe un solo ticker (SmoothScroll) y lo leen el
// indicador de ruido y el canvas de partículas SIN pasar por React (cero renders por frame).

export const SECTION_IDS = [
  "ruido",
  "limpieza",
  "historial",
  "modelo",
  "archivo",
  "pipeline",
  "servicios",
  "senal",
] as const;

// Nivel de ruido en el centro de cada sección. El indicador interpola entre ellos con el scroll.
export const SECTION_NOISE = [100, 62, 45, 30, 20, 8, 4, 0];

export const scrollState = {
  /** índice continuo de sección: 0 = ruido … 7 = señal. */
  s: 0,
  /** ruido interpolado 0..100. */
  noise: 100,
  scrollY: 0,
  vw: 0,
  vh: 0,
  /** top absoluto de cada sección (px). */
  tops: [] as number[],
  /** true cuando el header cae sobre la sección de papel (SEÑAL). */
  onPaper: false,
  mouseX: -9999,
  mouseY: -9999,
  reduced: false,
};

// Instancia de Lenis (la fija SmoothScroll) para que otros componentes hagan scroll suave coherente.
let lenisRef: { scrollTo: (target: HTMLElement | number, opts?: { offset?: number }) => void } | null = null;
export function setLenis(l: typeof lenisRef) {
  lenisRef = l;
}
/** Lleva un elemento al inicio de la ventana; con movimiento reducido salta sin animar. */
export function scrollToEl(el: HTMLElement, offset = -64) {
  if (lenisRef) lenisRef.scrollTo(el, { offset });
  else window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY + offset, behavior: "auto" });
}

const smooth = (x: number) => x * x * (3 - 2 * x);
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

export function refreshBounds() {
  scrollState.vw = window.innerWidth;
  scrollState.vh = window.innerHeight;
  scrollState.tops = SECTION_IDS.map((id) => {
    const el = document.getElementById(id);
    return el ? el.getBoundingClientRect().top + window.scrollY : 0;
  });
}

/** Una sola llamada por frame. */
export function updateScrollState() {
  const st = scrollState;
  const y = window.scrollY;
  st.scrollY = y;
  if (!st.tops.length) refreshBounds();

  // La formación j-1 → j se produce mientras la sección j sube desde el borde inferior
  // de la ventana hasta el 25 % de su altura: el ruido se limpia "con cada scroll".
  const win = st.vh * 0.75;
  let s = 0;
  for (let j = 1; j < st.tops.length; j++) {
    s += clamp01((y - (st.tops[j] - st.vh)) / win);
  }
  st.s = s;

  if (st.reduced) {
    // Sin movimiento: el indicador salta de valor por sección.
    st.noise = SECTION_NOISE[Math.min(7, Math.round(s))];
  } else {
    const k = Math.min(6, Math.floor(s));
    const f = smooth(s - k);
    st.noise = SECTION_NOISE[k] + (SECTION_NOISE[k + 1] - SECTION_NOISE[k]) * f;
  }
  st.onPaper = y + 24 >= st.tops[7];
}
