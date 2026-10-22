"use client";

import { useRef } from "react";
import type { Metric } from "@/content/es";
import { useLocale } from "@/lib/locale";
import { MOTION_OK, gsap, useGSAP } from "@/lib/motion";
import { Arrowed } from "./Arrowed";

function MetricRow({ m }: { m: Metric }) {
  const { t } = useLocale();
  const h = t.historial;
  const max = m.unit === "%" ? 100 : Math.max(m.before, m.after ?? 0);
  const fmt = (n: number) => (m.unit === "%" ? `${n}%` : `${n}`);
  const found = m.kind === "found";
  const beforePct = (m.before / max) * 100;
  const afterPct = m.after === null ? 0 : (m.after / max) * 100;

  return (
    <div
      data-metric
      data-ratio={m.after ? m.before / m.after : 1}
      className="border-t border-line py-5 first:border-t-0 first:pt-0"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
        <p className="max-w-[40ch] text-sm text-fg2">{m.label}</p>
        <p className="display text-[clamp(2.25rem,5vw,3.75rem)] leading-none" aria-label={m.display}>
          <Arrowed text={m.display} numbers />
        </p>
      </div>

      <dl className="mt-4 space-y-2 text-xs">
        <div className="grid grid-cols-[4.5rem_1fr_3.5rem] items-center gap-3">
          <dt className="text-mute">{found ? h.found : h.before}</dt>
          <dd className="h-2.5 overflow-hidden bg-surface">
            <div
              data-bar-before
              className="h-full origin-left bg-line2"
              style={{ width: `${beforePct}%` }}
            />
          </dd>
          <dd className="text-right text-fg2">{fmt(m.before)}</dd>
        </div>
        {m.after !== null && (
          <div className="grid grid-cols-[4.5rem_1fr_3.5rem] items-center gap-3">
            <dt className="text-mute">{h.after}</dt>
            <dd className="h-2.5 overflow-hidden bg-surface">
              <div data-bar-after className="h-full origin-left bg-acid" style={{ width: `${afterPct}%` }} />
            </dd>
            <dd className="text-right text-fg">{fmt(m.after)}</dd>
          </div>
        )}
      </dl>
      {m.note && <p className="mt-3 text-xs text-mute">{m.note}</p>}
    </div>
  );
}

/** Número ruidoso: converge al valor final conforme p → 1. */
function paintNumbers(row: Element, p: number) {
  row.querySelectorAll<HTMLElement>("[data-num]").forEach((el) => {
    const original = el.dataset.text ?? "";
    if (p >= 0.995) {
      el.textContent = original;
      return;
    }
    const comma = original.includes(",");
    const final = parseFloat(original.replace(",", "."));
    const dec = (original.split(/[.,]/)[1] ?? "").length;
    const v = Math.max(0, final + (Math.random() - 0.5) * 2 * final * 0.9 * (1 - p));
    const s = v.toFixed(dec);
    el.textContent = comma ? s.replace(".", ",") : s;
  });
}

export function Historial() {
  const { t } = useLocale();
  const h = t.historial;
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        gsap.from("[data-fx=title]", {
          clipPath: "inset(0 100% 0 0)",
          duration: 1.1,
          ease: "expo.out",
          scrollTrigger: { trigger: "[data-fx=title]", start: "top 88%", once: true },
        });

        gsap.utils.toArray<HTMLElement>("[data-job]").forEach((job) => {
          const tl = gsap.timeline({ scrollTrigger: { trigger: job, start: "top 82%", once: true } });
          tl.from(job.querySelector("[data-job-head]"), { opacity: 0, x: -24, duration: 0.8, ease: "expo.out" })
            .from(job.querySelector("[data-job-body]"), { opacity: 0, y: 28, duration: 0.8, ease: "expo.out" }, 0.08);
        });

        // Cada métrica pasa de su valor ruidoso al limpio, atada al scroll.
        gsap.utils.toArray<HTMLElement>("[data-metric]").forEach((row) => {
          const proxy = { p: 0 };
          const bb = row.querySelector("[data-bar-before]");
          const ab = row.querySelector("[data-bar-after]");
          const ratio = Number(row.dataset.ratio ?? 1);
          const tl = gsap.timeline({
            scrollTrigger: { trigger: row, start: "top 88%", end: "top 48%", scrub: 0.5 },
          });
          tl.to(
            proxy,
            { p: 1, duration: 1, ease: "none", onUpdate: () => paintNumbers(row, proxy.p) },
            0,
          );
          if (bb) tl.fromTo(bb, { scaleX: 0 }, { scaleX: 1, duration: 0.45, ease: "none" }, 0);
          if (ab) tl.fromTo(ab, { scaleX: ratio }, { scaleX: 1, duration: 1, ease: "none" }, 0);
          paintNumbers(row, 0);
        });

        gsap.from("[data-fx=ledger] dt, [data-fx=ledger] dd", {
          opacity: 0,
          y: 12,
          duration: 0.6,
          stagger: 0.06,
          ease: "expo.out",
          scrollTrigger: { trigger: "[data-fx=ledger]", start: "top 88%", once: true },
        });
      });
    },
    { scope: root, dependencies: [], revertOnUpdate: true },
  );

  return (
    <section
      ref={root}
      id="historial"
      data-section="historial"
      aria-labelledby="historial-title"
      className="border-t border-line py-20 sm:py-32"
    >
      <div className="container-x">
        <div className="grid gap-6 lg:grid-cols-[1.35fr_1fr] lg:gap-20">
          <h2 id="historial-title" data-fx="title" className="display h-section" aria-label={h.title}>
            <Arrowed text={h.title} />
          </h2>
          <p className="max-w-[48ch] self-end text-fg2">{h.intro}</p>
        </div>

        <ol className="mt-16 sm:mt-24">
          {h.jobs.map((job) => (
            <li
              key={job.id}
              data-job
              className="grid gap-8 border-t border-line py-10 first:border-t-line2 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-20 lg:py-14"
            >
              <div data-job-head className="lg:sticky lg:top-24 lg:self-start">
                <p className="text-sm text-mute">{job.period}</p>
                <h3 className="display mt-3 text-[clamp(2.25rem,5vw,4.25rem)]">{job.company}</h3>
                <p className="mt-3 text-fg2">{job.role}</p>
              </div>

              <div data-job-body className="grid gap-8 md:grid-cols-2 md:gap-10 lg:grid-cols-1 xl:grid-cols-2">
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
          <dl data-fx="ledger" className="grid gap-x-12 gap-y-3 text-sm sm:grid-cols-[max-content_1fr]">
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
