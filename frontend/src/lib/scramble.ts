// Glifos que Anton sí trae (letras, dígitos y símbolos básicos).
const POOL = "ABCDEFGHIJKLMNÑOPQRSTUVWXYZ0123456789#%&?/<>";
const rnd = () => POOL[Math.floor(Math.random() * POOL.length)];

type Opts = {
  /** ms antes de empezar */
  delay?: number;
  /** ms entre letra y letra */
  stagger?: number;
  /** color del glifo mientras no está resuelto */
  color?: string;
};

/**
 * Decodifica el texto de `root`: cada elemento `[data-ch]` arranca como un glifo al azar y se resuelve
 * de izquierda a derecha. Fija el ancho de cada letra para no mover el layout. Devuelve `cancel()` y una
 * promesa que se cumple al terminar (el texto queda siempre en su valor final).
 */
export function scramble(root: HTMLElement, opts: Opts = {}) {
  const { delay = 380, stagger = 90, color = "var(--acid)" } = opts;
  const els = Array.from(root.querySelectorAll<HTMLElement>("[data-ch]"));
  const finals = els.map((el) => el.dataset.ch ?? "");
  const settled = finals.map(() => false);
  const reveal = finals.map((_, i) => delay + i * stagger + Math.random() * 140);

  els.forEach((el, i) => {
    if (finals[i] === " ") return;
    el.style.display = "inline-block";
    el.style.width = `${el.getBoundingClientRect().width}px`;
    el.style.textAlign = "center";
    // Recorte solo en horizontal: un glifo ancho no pisa a su vecino mientras se decodifica.
    el.style.clipPath = "inset(-0.4em 0)";
    el.textContent = rnd();
    el.style.color = color;
  });

  const start = performance.now();
  let raf = 0;
  let cancelled = false;
  let finish: () => void = () => {};
  const done = new Promise<void>((res) => (finish = res));

  const restore = () => {
    els.forEach((el, i) => {
      el.textContent = finals[i];
      el.style.width = "";
      el.style.display = "";
      el.style.textAlign = "";
      el.style.color = "";
      el.style.clipPath = "";
    });
  };

  const frame = () => {
    if (cancelled) return;
    const t = performance.now() - start;
    let pending = false;
    els.forEach((el, i) => {
      if (finals[i] === " " || settled[i]) return;
      if (t >= reveal[i]) {
        // Se marca resuelta aunque el glifo al azar coincida con la letra final.
        settled[i] = true;
        el.textContent = finals[i];
        el.style.color = "";
        el.style.clipPath = "";
      } else {
        pending = true;
        if (Math.floor(t / 55 + i) % 2 === 0) el.textContent = rnd();
      }
    });
    if (pending) raf = requestAnimationFrame(frame);
    else {
      restore();
      finish();
    }
  };
  raf = requestAnimationFrame(frame);

  return {
    done,
    cancel() {
      cancelled = true;
      cancelAnimationFrame(raf);
      restore();
      finish();
    },
  };
}
