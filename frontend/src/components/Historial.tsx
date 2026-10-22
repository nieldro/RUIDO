"use client";

import type { Metric } from "@/content/es";
import { useLocale } from "@/lib/locale";
import { Arrowed } from "./Arrowed";

function MetricRow({ m }: { m: Metric }) {
  const { t } = useLocale();
  const h = t.historial;
  const max = m.unit === "%" ? 100 : Math.max(m.before, m.after ?? 0);
  const fmt = (n: number) => (m.unit === "%" ? `${n}%` : `${n}`);
  const found = m.kind === "found";

  return (
    <div className="border-t border-line py-5 first:border-t-0 first:pt-0">
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
        <p className="max-w-[40ch] text-sm text-fg2">{m.label}</p>
        <p className="display text-[clamp(2.25rem,5vw,3.75rem)] leading-none" aria-label={m.display}>
          <Arrowed text={m.display} />
        </p>
      </div>

      <dl className="mt-4 space-y-2 text-xs">
        <div className="grid grid-cols-[4.5rem_1fr_3.5rem] items-center gap-3">
          <dt className="text-mute">{found ? h.found : h.before}</dt>
          <dd className="h-2.5 bg-surface">
            <div className="h-full bg-line2" style={{ width: `${(m.before / max) * 100}%` }} />
          </dd>
          <dd className="text-right text-fg2">{fmt(m.before)}</dd>
        </div>
        {m.after !== null && (
          <div className="grid grid-cols-[4.5rem_1fr_3.5rem] items-center gap-3">
            <dt className="text-mute">{h.after}</dt>
            <dd className="h-2.5 bg-surface">
              <div className="h-full bg-acid" style={{ width: `${(m.after / max) * 100}%` }} />
            </dd>
            <dd className="text-right text-fg">{fmt(m.after)}</dd>
          </div>
        )}
      </dl>
      {m.note && <p className="mt-3 text-xs text-mute">{m.note}</p>}
    </div>
  );
}

export function Historial() {
  const { t } = useLocale();
  const h = t.historial;

  return (
    <section
      id="historial"
      data-section="historial"
      aria-labelledby="historial-title"
      className="border-t border-line py-20 sm:py-32"
    >
      <div className="container-x">
        <div className="grid gap-6 lg:grid-cols-[1.35fr_1fr] lg:gap-20">
          <h2 id="historial-title" className="display h-section" aria-label={h.title}>
            <Arrowed text={h.title} />
          </h2>
          <p className="max-w-[48ch] self-end text-fg2">{h.intro}</p>
        </div>

        <ol className="mt-16 sm:mt-24">
          {h.jobs.map((job) => (
            <li
              key={job.id}
              className="grid gap-8 border-t border-line py-10 first:border-t-line2 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-20 lg:py-14"
            >
              <div>
                <p className="text-sm text-mute">{job.period}</p>
                <h3 className="display mt-3 text-[clamp(2.25rem,5vw,4.25rem)]">{job.company}</h3>
                <p className="mt-3 text-fg2">{job.role}</p>
              </div>

              <div className="grid gap-8 md:grid-cols-2 md:gap-10 lg:grid-cols-1 xl:grid-cols-2">
                <ul className="space-y-2 text-[0.9375rem] text-fg2">
                  {job.points.map((p) => (
                    <li key={p} className="flex gap-3">
                      <span aria-hidden="true" className="text-mute">
                        –
                      </span>
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
                {job.metrics.length > 0 && (
                  <div>
                    {job.metrics.map((m) => (
                      <MetricRow key={m.label} m={m} />
                    ))}
                  </div>
                )}
              </div>
            </li>
          ))}
        </ol>

        <div className="mt-8 border-t border-line2 pt-8 sm:mt-12">
          <h3 className="mb-5 text-xs text-mute">{h.ledgerTitle}</h3>
          <dl className="grid gap-x-12 gap-y-3 text-sm sm:grid-cols-[max-content_1fr]">
            {h.ledger.map((row) => (
              <div key={row.k} className="contents">
                <dt className="text-mute">{row.k}</dt>
                <dd className="text-fg2">{row.v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}
