"use client";

import { useEffect, useRef } from "react";

export type DayCell = { date: string; count: number; level: number };

const WEEKS = 53;
const DAYS = 7;
const GAP = 3;

// Niveles 0–4 con el único acento de la paleta (RGB de #C6FF3D con distinta opacidad sobre #141412).
const FILL = [
  "rgb(20,20,18)",
  "rgba(198,255,61,0.25)",
  "rgba(198,255,61,0.5)",
  "rgba(198,255,61,0.75)",
  "rgb(198,255,61)",
];
const LINE = "rgb(42,41,37)";

/**
 * Heatmap de contribuciones dibujado en un solo <canvas>: 371 celdas serían 371 elementos del DOM y
 * su layout cuesta caro en móvil. `weeks` vacío/null = cuadrícula en el nivel más bajo (sin datos).
 */
export function Heatmap({
  weeks,
  label,
  tipLabel,
}: {
  weeks: DayCell[][] | null;
  label: string;
  tipLabel: string;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const wrap = useRef<HTMLDivElement>(null);
  const cols = weeks ? weeks.slice(-WEEKS) : [];

  useEffect(() => {
    const canvas = ref.current;
    const box = wrap.current;
    if (!canvas || !box) return;

    const draw = () => {
      const w = box.clientWidth;
      if (!w) return;
      const cell = (w - GAP * (WEEKS - 1)) / WEEKS;
      const h = cell * DAYS + GAP * (DAYS - 1);
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      for (let c = 0; c < WEEKS; c++) {
        for (let r = 0; r < DAYS; r++) {
          const d = cols[c]?.[r];
          const x = c * (cell + GAP);
          const y = r * (cell + GAP);
          if (weeks && !d) continue; // semana parcial: sin celda
          ctx.fillStyle = FILL[d ? Math.min(4, Math.max(0, d.level)) : 0];
          ctx.fillRect(x, y, cell, cell);
          ctx.strokeStyle = LINE;
          ctx.lineWidth = 1;
          ctx.strokeRect(x + 0.5, y + 0.5, cell - 1, cell - 1);
        }
      }
    };

    draw();
    const ro = new ResizeObserver(draw);
    ro.observe(box);

    // Tooltip nativo con la fecha y el conteo de la celda bajo el puntero.
    const onMove = (e: PointerEvent) => {
      if (!weeks) return;
      const rect = canvas.getBoundingClientRect();
      const cell = (rect.width - GAP * (WEEKS - 1)) / WEEKS;
      const c = Math.floor((e.clientX - rect.left) / (cell + GAP));
      const r = Math.floor((e.clientY - rect.top) / (cell + GAP));
      const d = cols[c]?.[r];
      canvas.title = d ? `${d.count} ${tipLabel} ${d.date}` : "";
    };
    canvas.addEventListener("pointermove", onMove);
    return () => {
      ro.disconnect();
      canvas.removeEventListener("pointermove", onMove);
    };
    // `cols` se deriva de `weeks`; basta con depender de ese.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weeks, tipLabel]);

  return (
    <div ref={wrap} data-heatmap role="img" aria-label={label} className="w-full overflow-hidden">
      <canvas ref={ref} aria-hidden="true" className="block" />
    </div>
  );
}
