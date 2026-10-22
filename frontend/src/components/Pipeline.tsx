"use client";

import { useLocale } from "@/lib/locale";

export function Pipeline() {
  const { t } = useLocale();
  const p = t.pipeline;
  const sections = t.nav.sections;

  return (
    <section
      id="pipeline"
      data-section="pipeline"
      aria-labelledby="pipeline-title"
      className="border-t border-line py-20 sm:py-32"
    >
      <div className="container-x">
        <div className="grid gap-6 lg:grid-cols-[1.35fr_1fr] lg:gap-20">
          <h2 id="pipeline-title" className="display h-section">
            {p.title}
          </h2>
          <p className="max-w-[52ch] self-end text-fg2">{p.text}</p>
        </div>

        {/* Diagrama: se vuelve vertical en móvil */}
        <ol
          className="mt-14 grid gap-0 sm:mt-20 md:grid-cols-4"
          aria-label={p.nodes.join(" → ")}
        >
          {p.nodes.map((n, i, arr) => (
            <li key={n} className="relative flex items-center md:flex-col md:items-stretch">
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

        <div className="mt-14 grid gap-6 lg:grid-cols-[1.2fr_1fr] lg:gap-10">
          {/* Panel en vivo (sin backend todavía) */}
          <div className="border border-line2 bg-surface">
            <div className="flex items-center justify-between gap-4 border-b border-line2 bg-bg px-4 py-2 text-xs">
              <h3 className="text-fg2">{p.panelTitle}</h3>
              <p className="text-mute">{p.noData}</p>
            </div>
            <div className="grid gap-8 p-5 sm:grid-cols-2 sm:p-7">
              <div>
                <p className="text-xs text-mute">{p.visits}</p>
                <p className="display mt-2 text-[clamp(3rem,6vw,5rem)] leading-none text-mute">—</p>
              </div>
              <div>
                <p className="text-xs text-mute">{p.countries}</p>
                <p className="display mt-2 text-[clamp(3rem,6vw,5rem)] leading-none text-mute">—</p>
              </div>
              <div className="sm:col-span-2">
                <p className="mb-3 text-xs text-mute">{p.depth}</p>
                <ul className="space-y-1.5 text-xs">
                  {sections.map((s) => (
                    <li key={s} className="grid grid-cols-[6rem_1fr] items-center gap-3">
                      <span className="text-fg2">{s}</span>
                      <span className="h-2 bg-bg outline outline-1 -outline-offset-1 outline-line" />
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <p className="border-t border-line2 px-5 py-3 text-xs text-mute sm:px-7">{p.offline}</p>
          </div>

          {/* Log + chat */}
          <div className="flex flex-col gap-6">
            <div className="border border-line2 bg-bg">
              <h3 className="border-b border-line2 px-4 py-2 text-xs text-fg2">{p.logTitle}</h3>
              <p className="px-4 py-5 text-sm text-mute">
                <span className="text-acid" aria-hidden="true">
                  &gt;{" "}
                </span>
                {p.logEmpty}
              </p>
            </div>

            <form
              className="border border-line2 bg-surface p-5 sm:p-7"
              onSubmit={(e) => e.preventDefault()}
              aria-describedby="chat-note"
            >
              <h3 className="display text-[clamp(1.75rem,3vw,2.5rem)]">{p.chatTitle}</h3>
              <p className="mt-2 text-sm text-fg2">{p.chatText}</p>
              <label htmlFor="ask" className="sr-only">
                {p.chatLabel}
              </label>
              <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                <input
                  id="ask"
                  type="text"
                  disabled
                  placeholder={p.chatPlaceholder}
                  className="min-h-11 flex-1 border border-line2 bg-bg px-3 disabled:opacity-60"
                />
                <button
                  type="submit"
                  disabled
                  className="min-h-11 bg-acid px-5 font-bold text-bg disabled:bg-line2 disabled:text-mute"
                >
                  {p.chatSend}
                </button>
              </div>
              <p id="chat-note" className="mt-3 text-xs text-mute">
                {p.chatSoon}
              </p>
            </form>
          </div>
        </div>

        <p className="mt-10 max-w-[70ch] text-xs text-mute">{p.privacy}</p>
      </div>
    </section>
  );
}
