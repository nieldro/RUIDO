"use client";

import { useMemo, useRef, useState } from "react";
import { useLocale } from "@/lib/locale";
import { MOTION_OK, gsap, useGSAP } from "@/lib/motion";
import { api, apiEnabled, useApiResource, type Repo } from "@/lib/api";
import { timeAgo } from "@/lib/time";

const WEEKS = 53;
const DAYS = 7;

// Niveles del heatmap de GitHub (0–4) con el único acento de la paleta.
const LEVEL_CLASS = ["bg-surface", "bg-acid/25", "bg-acid/50", "bg-acid/75", "bg-acid"];
// Barra de lenguajes: tonos de la paleta, del más al menos usado.
const LANG_CLASS = ["bg-acid", "bg-fg", "bg-fg2", "bg-mute", "bg-line2"];

function RepoCard({ repo }: { repo: Repo }) {
  const { locale, t } = useLocale();
  const a = t.archivo;
  const langs = repo.languages.slice(0, 5);
  const url = `https://github.com/nieldro/${repo.name}`;

  return (
    <article data-repo className="flex min-w-0 flex-col border border-line2 bg-surface">
      <header className="flex items-center justify-between gap-4 border-b border-line2 bg-bg px-4 py-2 text-xs">
        <p className="min-w-0 truncate text-fg2">{repo.name}</p>
        <p className="shrink-0 text-mute">
          {a.lastCommit}: {timeAgo(repo.pushed_at, locale)}
        </p>
      </header>
      <div className="flex flex-1 flex-col gap-5 p-5 sm:p-6">
        <div>
          <h3 className="display text-[clamp(1.75rem,3vw,2.5rem)] break-words">{repo.name}</h3>
          <p className="mt-2 text-sm text-fg2">{repo.description ?? a.noDesc}</p>
        </div>

        {langs.length > 0 && (
          <div>
            <div
              role="img"
              aria-label={langs.map((l) => `${l.name} ${l.percent}%`).join(", ")}
              className="flex h-2 w-full overflow-hidden bg-bg"
            >
              {langs.map((l, i) => (
                <span key={l.name} className={LANG_CLASS[i]} style={{ width: `${l.percent}%` }} />
              ))}
            </div>
            <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-fg2">
              {langs.map((l, i) => (
                <li key={l.name} className="flex items-center gap-1.5">
                  <span aria-hidden="true" className={`size-2 ${LANG_CLASS[i]}`} />
                  {l.name} {l.percent}%
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-auto flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
          <span className="text-mute">
            {repo.stars} {a.stars}
          </span>
          <a href={url} target="_blank" rel="noopener noreferrer" className="text-fg hover:text-acid">
            {a.repo}
          </a>
          {repo.homepage && (
            <a href={repo.homepage} target="_blank" rel="noopener noreferrer" className="text-fg hover:text-acid">
              {a.demo}
            </a>
          )}
        </div>
      </div>
    </article>
  );
}

export function Archivo() {
  const { locale, t } = useLocale();
  const a = t.archivo;
  const root = useRef<HTMLElement>(null);
  const reposRes = useApiResource(api.repos);
  const contribRes = useApiResource(api.contributions);
  const [filter, setFilter] = useState<string | null>(null);

  const repos = reposRes.data?.repos;
  const filters = useMemo(() => {
    const set = new Set<string>();
    for (const r of repos ?? []) {
      r.languages.forEach((l) => set.add(l.name));
      r.topics.filter((x) => x.toLowerCase() !== "portfolio").forEach((x) => set.add(x));
    }
    return Array.from(set).sort((x, y) => x.localeCompare(y));
  }, [repos]);

  const visible = useMemo(
    () =>
      (repos ?? []).filter(
        (r) => !filter || r.languages.some((l) => l.name === filter) || r.topics.includes(filter),
      ),
    [repos, filter],
  );

  const weeks = contribRes.data?.weeks ?? null;
  const loading = apiEnabled && (reposRes.status === "loading" || contribRes.status === "loading");
  const failed = apiEnabled && reposRes.status === "error" && contribRes.status === "error";

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        // Entra por la derecha: la cabecera en espejo se mueve en espejo.
        gsap.from("[data-fx=title]", {
          opacity: 0,
          x: 80,
          duration: 1,
          ease: "expo.out",
          scrollTrigger: { trigger: "[data-fx=title]", start: "top 88%", once: true },
        });
        // El heatmap se dibuja columna por columna con el scroll, como un gráfico de datos.
        gsap.from("[data-cell]", {
          opacity: 0,
          stagger: { each: 0.004, from: "start" },
          ease: "none",
          scrollTrigger: { trigger: "[data-heatmap]", start: "top 88%", end: "bottom 52%", scrub: 0.5 },
        });
      });
    },
    { scope: root, dependencies: [weeks], revertOnUpdate: true },
  );

  return (
    <section
      ref={root}
      id="archivo"
      data-section="archivo"
      aria-labelledby="archivo-title"
      className="border-t border-line py-20 sm:py-32"
    >
      <div className="container-x">
        {/* Cabecera en espejo respecto a las demás secciones: rompe el ritmo y marca el cambio a «datos en vivo». */}
        <div className="grid gap-6 lg:grid-cols-[1fr_1.35fr] lg:gap-20">
          <p className="max-w-[52ch] text-fg2 lg:order-1 lg:self-end">{a.text}</p>
          <h2 id="archivo-title" data-fx="title" className="display h-section lg:order-2 lg:text-right">
            {a.title}
          </h2>
        </div>

        {/* Heatmap de contribuciones: se rellena con los datos de GitHub; sin ellos, todo en el nivel más bajo */}
        <div className="mt-14 sm:mt-20">
          <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2 text-xs text-mute">
            <p>
              {a.heatmapLabel}
              {contribRes.data && (
                <span className="text-fg2">
                  {" "}
                  · {contribRes.data.total} {a.contributionsTotal}
                </span>
              )}
            </p>
            {contribRes.data && (
              <p>
                {a.synced} {timeAgo(contribRes.data.synced_at, locale)}
              </p>
            )}
          </div>
          <div
            role="img"
            data-heatmap
            aria-label={
              contribRes.data
                ? `${a.heatmapLabel}: ${contribRes.data.total} ${a.contributionsTotal}`
                : `${a.heatmapLabel}: ${a.emptyTitle}`
            }
            className="grid grid-flow-col gap-[3px] overflow-hidden"
            style={{
              gridTemplateRows: `repeat(${DAYS}, minmax(0, 1fr))`,
              gridTemplateColumns: `repeat(${WEEKS}, minmax(0, 1fr))`,
            }}
          >
            {weeks
              ? weeks.slice(-WEEKS).flatMap((week, wi) =>
                  // Las semanas parciales (primera y última) se completan para no correr la cuadrícula.
                  Array.from({ length: DAYS }).map((_, di) => {
                    const d = week[di];
                    return (
                      <span
                        key={`${wi}-${di}`}
                        data-cell
                        title={d ? `${d.count} ${a.contribOn} ${d.date}` : undefined}
                        className={`aspect-square outline outline-1 -outline-offset-1 outline-line ${
                          d ? LEVEL_CLASS[d.level] ?? LEVEL_CLASS[0] : "bg-transparent"
                        }`}
                      />
                    );
                  }),
                )
              : Array.from({ length: WEEKS * DAYS }).map((_, i) => (
                  <span
                    key={i}
                    data-cell
                    className="aspect-square bg-surface outline outline-1 -outline-offset-1 outline-line"
                  />
                ))}
          </div>
          {contribRes.data && (
            <p className="mt-3 flex items-center justify-end gap-1.5 text-xs text-mute">
              {a.less}
              {LEVEL_CLASS.map((c) => (
                <span key={c} aria-hidden="true" className={`size-3 outline outline-1 -outline-offset-1 outline-line ${c}`} />
              ))}
              {a.more}
            </p>
          )}
          {contribRes.data?.stale && <p className="mt-2 text-xs text-mute">{a.staleNote}</p>}
        </div>

        {filters.length > 0 && (
          <div className="mt-10 flex flex-wrap items-center gap-2 text-xs" role="group" aria-label={a.filterLabel}>
            {[null, ...filters].map((f) => (
              <button
                key={f ?? "all"}
                type="button"
                aria-pressed={filter === f}
                onClick={() => setFilter(f)}
                className={`min-h-8 px-3 transition-[background-color,color,transform] duration-150 ease-[var(--ease-out)] active:scale-[0.97] ${
                  filter === f ? "bg-acid text-bg" : "border border-line2 text-fg2 hover:text-fg"
                }`}
              >
                {f ?? a.all}
              </button>
            ))}
          </div>
        )}

        {visible.length > 0 ? (
          <div className="mt-6 grid gap-5 md:grid-cols-2 lg:gap-6">
            {visible.map((r) => (
              <RepoCard key={r.name} repo={r} />
            ))}
          </div>
        ) : (
          <div data-fx="status" className="mt-6 border border-line2 bg-surface p-6 sm:p-10">
            <p className="display text-[clamp(1.75rem,3vw,2.5rem)]">{a.emptyTitle}</p>
            <p className="mt-3 max-w-[60ch] text-sm text-fg2">
              {!apiEnabled
                ? a.empty
                : loading
                  ? a.loading
                  : failed
                    ? a.unavailable
                    : repos && repos.length > 0
                      ? a.noDesc
                      : a.emptyConnected}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
