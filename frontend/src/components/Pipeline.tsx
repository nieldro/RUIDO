"use client";

import { useRef, useState } from "react";
import { useLocale } from "@/lib/locale";
import { api, apiEnabled, ApiError, useApiResource, useStream, type StreamLine, type Stats } from "@/lib/api";
import { DESKTOP, MOTION_OK, gsap, useGSAP } from "@/lib/motion";
import { SECTION_IDS } from "@/lib/scrollState";
import { DecodeHeading } from "./DecodeHeading";

function Panel({ stats, offline }: { stats: Stats | null; offline: boolean }) {
  const { t } = useLocale();
  const p = t.pipeline;
  const countries = stats?.countries ?? [];
  const visits = stats ? String(stats.visits_today) : "—";
  const places = stats ? String(countries.length) : "—";

  return (
    <div className="grid gap-8 p-5 sm:grid-cols-2 sm:p-7">
      <div>
        <p className="text-xs text-mute">{p.visits}</p>
        <p
          className={`display mt-2 text-[clamp(3rem,6vw,5rem)] leading-none ${stats ? "" : "text-mute"}`}
          aria-live="polite"
        >
          {visits}
        </p>
        {stats && stats.visits_today === 0 && <p className="mt-2 text-xs text-mute">{p.zeroVisits}</p>}
      </div>
      <div>
        <p className="text-xs text-mute">{p.countries}</p>
        <p className={`display mt-2 text-[clamp(3rem,6vw,5rem)] leading-none ${stats ? "" : "text-mute"}`}>
          {places}
        </p>
        {countries.length > 0 && (
          <p className="mt-2 text-xs text-fg2">
            {p.topCountries}: {countries.slice(0, 4).map((c) => `${c.country} ${c.count}`).join(" · ")}
          </p>
        )}
      </div>
      <div className="sm:col-span-2">
        <p className="mb-3 text-xs text-mute">
          {p.depth} · {p.sectionDepth}
        </p>
        <ul className="space-y-1.5 text-xs">
          {SECTION_IDS.map((id, i) => {
            const v = stats?.scroll_depth?.[id];
            return (
              <li key={id} className="grid grid-cols-[6rem_1fr_3rem] items-center gap-3">
                <span className="text-fg2">{t.nav.sections[i]}</span>
                <span className="h-2 overflow-hidden bg-bg outline outline-1 -outline-offset-1 outline-line">
                  <span
                    className="block h-full origin-left bg-acid transition-transform duration-500 ease-[var(--ease-out)]"
                    style={{ transform: `scaleX(${(v ?? 0) / 100})` }}
                  />
                </span>
                <span className="text-right text-mute">{v == null ? "—" : `${Math.round(v)}%`}</span>
              </li>
            );
          })}
        </ul>
      </div>
      {offline && <p className="text-xs text-mute sm:col-span-2">{p.offline}</p>}
    </div>
  );
}

function logText(line: StreamLine, p: { logVisit: string; logScroll: string; nav: string[] }) {
  if (line.kind === "visit") return `${p.logVisit} · ${line.country ?? "??"} · ${line.device}`;
  const i = SECTION_IDS.indexOf(line.section as (typeof SECTION_IDS)[number]);
  return `${p.logScroll} · ${i >= 0 ? p.nav[i] : line.section} · ${line.depth}%`;
}

function AskCv() {
  const { t } = useLocale();
  const p = t.pipeline;
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [turns, setTurns] = useState<{ q: string; a: string; err?: boolean }[]>([]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const question = q.trim();
    if (!question || busy) return;
    setBusy(true);
    try {
      const r = await api.ask(question);
      setTurns((prev) => [...prev.slice(-3), { q: question, a: r.answer }]);
      setQ("");
    } catch (err) {
      let msg = p.chatError;
      if (err instanceof ApiError) {
        if (err.status === 429) msg = p.chatLimit;
        else if (err.code === "llm_not_configured") msg = err.message;
      }
      setTurns((prev) => [...prev.slice(-3), { q: question, a: msg, err: true }]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="border border-line2 bg-surface p-5 sm:p-7" aria-describedby="chat-note">
      <h3 className="display text-[clamp(1.75rem,3vw,2.5rem)]">{p.chatTitle}</h3>
      <p className="mt-2 text-sm text-fg2">{p.chatText}</p>

      {turns.length > 0 && (
        <ul className="mt-5 space-y-4 text-sm" aria-live="polite">
          {turns.map((turn, i) => (
            <li key={i} className="space-y-1">
              <p className="text-mute">
                {p.chatYou}: <span className="text-fg2">{turn.q}</span>
              </p>
              <p className={turn.err ? "text-fg" : "text-fg"}>
                <span className="text-acid">{p.chatCv}:</span> {turn.a}
              </p>
            </li>
          ))}
        </ul>
      )}

      <label htmlFor="ask" className="sr-only">
        {p.chatLabel}
      </label>
      <div className="mt-5 flex flex-col gap-2 sm:flex-row">
        <input
          id="ask"
          type="text"
          value={q}
          maxLength={500}
          onChange={(e) => setQ(e.target.value)}
          disabled={!apiEnabled}
          placeholder={p.chatPlaceholder}
          className="min-h-11 flex-1 border border-line2 bg-bg px-3 disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={!apiEnabled || busy || !q.trim()}
          className="min-h-11 bg-acid px-5 font-bold text-bg transition-[background-color,transform] duration-150 ease-[var(--ease-out)] active:scale-[0.97] disabled:bg-line2 disabled:text-mute"
        >
          {busy ? p.chatThinking : p.chatSend}
        </button>
      </div>
      {!apiEnabled && (
        <p id="chat-note" className="mt-3 text-xs text-mute">
          {p.chatSoon}
        </p>
      )}
    </form>
  );
}

export function Pipeline() {
  const { t } = useLocale();
  const p = t.pipeline;
  const root = useRef<HTMLElement>(null);
  const { data: stats, status } = useApiResource(api.stats, 15000);
  const { lines, connected } = useStream(8);

  const state = !apiEnabled ? "off" : status === "ok" || connected ? "ok" : status === "loading" ? "loading" : "error";
  const statusLabel = state === "ok" ? p.statusLive : state === "loading" ? p.statusConnecting : p.statusOffline;

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        gsap.from("[data-fx=intro]", {
          opacity: 0,
          y: 16,
          duration: 0.8,
          ease: "expo.out",
          scrollTrigger: { trigger: "[data-fx=intro]", start: "top 88%", once: true },
        });
        gsap.from("[data-node]", {
          opacity: 0,
          y: 24,
          stagger: 0.12,
          duration: 0.7,
          ease: "expo.out",
          scrollTrigger: { trigger: "[data-pipeline-diagram]", start: "top 85%", once: true },
        });
      });
      // Paquetes que viajan por el diagrama; solo en horizontal y solo mientras está a la vista.
      mm.add(`${MOTION_OK} and ${DESKTOP}`, () => {
        const track = root.current?.querySelector<HTMLElement>("[data-pipeline-diagram]");
        if (!track) return;
        gsap.utils.toArray<HTMLElement>("[data-packet]").forEach((el, i) => {
          const tl = gsap.timeline({
            repeat: -1,
            delay: i * 1.1,
            scrollTrigger: { trigger: track, start: "top bottom", end: "bottom top", toggleActions: "play pause resume pause" },
          });
          tl.fromTo(el, { x: 0, opacity: 0 }, { opacity: 1, duration: 0.25, ease: "none" })
            .to(el, { x: () => track.offsetWidth - 10, duration: 3.1, ease: "none" }, 0)
            .to(el, { opacity: 0, duration: 0.25, ease: "none" }, 2.85);
        });
      });
    },
    { scope: root, dependencies: [], revertOnUpdate: true },
  );

  return (
    <section
      ref={root}
      id="pipeline"
      data-section="pipeline"
      aria-labelledby="pipeline-title"
      className="border-t border-line py-20 sm:py-32"
    >
      <div className="container-x">
        <div className="grid gap-6 lg:grid-cols-[1.35fr_1fr] lg:gap-20">
          <DecodeHeading id="pipeline-title" text={p.title} className="display h-section" />
          <p data-fx="intro" className="max-w-[52ch] self-end text-fg2">
            {p.text}
          </p>
        </div>

        {/* Diagrama: se vuelve vertical en móvil */}
        <div className="relative mt-14 sm:mt-20">
          <ol
            data-pipeline-diagram
            className="grid gap-0 md:grid-cols-4"
            aria-label={p.nodes.join(" → ")}
          >
            {p.nodes.map((n, i, arr) => (
              <li key={n} data-node className="relative flex items-center md:flex-col md:items-stretch">
                <div className="flex-1 border border-line2 bg-surface px-4 py-5 text-center md:py-8">
                  <span className="display text-[clamp(1.5rem,2.4vw,2.25rem)]">{n}</span>
                </div>
                {i < arr.length - 1 && (
                  <span
                    aria-hidden="true"
                    className="absolute -bottom-3 left-1/2 z-10 h-6 w-px -translate-x-1/2 bg-acid md:top-1/2 md:-right-3 md:bottom-auto md:left-auto md:h-px md:w-6 md:-translate-y-1/2 md:translate-x-0"
                  />
                )}
              </li>
            ))}
          </ol>
          {/* Paquetes de datos: tres cuadros que cruzan el diagrama de izquierda a derecha */}
          <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-1/2 hidden h-0 md:block">
            {[0, 1, 2].map((i) => (
              <span key={i} data-packet className="absolute -top-[5px] left-0 size-2.5 bg-acid" />
            ))}
          </div>
        </div>

        <div className="mt-14 grid gap-6 lg:grid-cols-[1.2fr_1fr] lg:gap-10">
          {/* Panel en vivo */}
          <div className="border border-line2 bg-surface">
            <div className="flex items-center justify-between gap-4 border-b border-line2 bg-bg px-4 py-2 text-xs">
              <h3 className="text-fg2">{p.panelTitle}</h3>
              <p className="flex items-center gap-2 text-mute">
                <span
                  aria-hidden="true"
                  className={`size-2 ${state === "ok" ? "bg-acid" : "bg-line2"}`}
                />
                {statusLabel}
              </p>
            </div>
            <Panel stats={stats} offline={state === "off" || state === "error"} />
          </div>

          {/* Log + chat */}
          <div className="flex flex-col gap-6">
            <div className="border border-line2 bg-bg">
              <h3 className="border-b border-line2 px-4 py-2 text-xs text-fg2">{p.logTitle}</h3>
              <ul className="min-h-[7.5rem] space-y-1 px-4 py-4 text-sm" aria-live="off">
                {lines.length === 0 && (
                  <li className="text-mute">
                    <span className="text-acid" aria-hidden="true">
                      &gt;{" "}
                    </span>
                    {p.logEmpty}
                  </li>
                )}
                {lines.map((l) => (
                  <li key={l.id} className="text-fg2">
                    <span className="text-acid" aria-hidden="true">
                      &gt;{" "}
                    </span>
                    {logText(l, { logVisit: p.logVisit, logScroll: p.logScroll, nav: t.nav.sections })}
                  </li>
                ))}
              </ul>
            </div>
            <AskCv />
          </div>
        </div>

        <p className="mt-10 max-w-[70ch] text-xs text-mute">{p.privacy}</p>
      </div>
    </section>
  );
}
