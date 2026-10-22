"use client";

import { useLocale } from "@/lib/locale";

const WEEKS = 53;
const DAYS = 7;

export function Archivo() {
  const { t } = useLocale();
  const a = t.archivo;

  return (
    <section
      id="archivo"
      data-section="archivo"
      aria-labelledby="archivo-title"
      className="border-t border-line py-20 sm:py-32"
    >
      <div className="container-x">
        <div className="grid gap-6 lg:grid-cols-[1.35fr_1fr] lg:gap-20">
          <h2 id="archivo-title" className="display h-section">
            {a.title}
          </h2>
          <p className="max-w-[52ch] self-end text-fg2">{a.text}</p>
        </div>

        {/* Heatmap: sin sincronizar todavía, todas las celdas en el nivel más bajo */}
        <div className="mt-14 sm:mt-20">
          <p className="mb-3 text-xs text-mute">{a.heatmapLabel}</p>
          <div
            role="img"
            aria-label={`${a.heatmapLabel}: ${a.emptyTitle}`}
            className="grid grid-flow-col gap-[3px] overflow-hidden"
            style={{
              gridTemplateRows: `repeat(${DAYS}, minmax(0, 1fr))`,
              gridTemplateColumns: `repeat(${WEEKS}, minmax(0, 1fr))`,
            }}
          >
            {Array.from({ length: WEEKS * DAYS }).map((_, i) => (
              <span key={i} className="aspect-square bg-surface outline outline-1 -outline-offset-1 outline-line" />
            ))}
          </div>
        </div>

        <div className="mt-10 flex flex-wrap items-center gap-2 text-xs" role="group" aria-label={a.filters}>
          <button type="button" aria-pressed="true" className="min-h-8 bg-acid px-3 text-bg">
            {a.all}
          </button>
        </div>

        <div className="mt-6 border border-line2 bg-surface p-6 sm:p-10">
          <p className="display text-[clamp(1.75rem,3vw,2.5rem)]">{a.emptyTitle}</p>
          <p className="mt-3 max-w-[60ch] text-sm text-fg2">{a.empty}</p>
        </div>
      </div>
    </section>
  );
}
