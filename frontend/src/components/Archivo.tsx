"use client";

import { useMemo, useRef, useState } from "react";
import { useLocale } from "@/lib/locale";
import { MOTION_OK, gsap, useGSAP, whenIdle } from "@/lib/motion";
import { api, apiEnabled, useApiResource, useNearViewport, type Repo } from "@/lib/api";
import { timeAgo } from "@/lib/time";
import { Heatmap } from "./Heatmap";

// Niveles del heatmap de GitHub (0–4) con el único acento de la paleta.
const LEVEL_CLASS = ["bg-surface", "bg-acid/25", "bg-acid/50", "bg-acid/75", "bg-acid"];
// Barra de lenguajes: tonos de la paleta, del más al menos usado.
const LANG_CLASS = ["bg-acid", "bg-fg", "bg-fg2", "bg-mute", "bg-line2"];

function RepoCard({ repo, nf, index }: { repo: Repo; nf: Intl.NumberFormat; index: number }) {
  const { locale, t } = useLocale();
  const a = t.archivo;
  const langs = repo.languages.slice(0, 5);
  const url = `https://github.com/nieldro/${repo.name}`;

  return (
    <article
      data-repo
      style={{ ["--i" as string]: Math.min(index, 5) }}
      className="fade-in flex min-w-0 flex-col border border-line2 bg-surface"
    >
      <header className="flex items-center justify-between gap-4 border-b border-line2 bg-bg px-4 py-2 text-xs">
        <p className="min-w-0 truncate text-fg2">{repo.name}</p>
        <p className="shrink-0 text-mute">
          {a.lastCommit}: {timeAgo(repo.pushed_at, locale)}
        </p>
      </header>
      <div className="flex flex-1 flex-col gap-5 p-5 sm:p-6">
        <div>
          <h3 className="display text-[clamp(1.75rem,3vw,2.5rem)] [overflow-wrap:anywhere]">{repo.name}</h3>
          <p className="mt-2 text-sm text-fg2 [overflow-wrap:anywhere]">{repo.description ?? a.noDesc}</p>
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
            {nf.format(repo.stars)} {a.stars}
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
  const near = useNearViewport(root);
  const reposRes = useApiResource(api.repos, 0, near);
  const contribRes = useApiResource(api.contributions, 0, near);
  const [filter, setFilter] = useState<string | null>(null);

  const repos = reposRes.data?.repos;
  // Filtros: lenguajes y topics, solo los 10 más usados (con muchos repos serían un muro de chips).
  const filters = useMemo(() => {
    const count = new Map<string, number>();
    const bump = (k: string) => count.set(k, (count.get(k) ?? 0) + 1);
    for (const r of repos ?? []) {
      r.languages.forEach((l) => bump(l.name));
      r.topics.filter((x) => x.toLowerCase() !== "portfolio").forEach(bump);
    }
    return Array.from(count.entries())
      .sort((x, y) => y[1] - x[1] || x[0].localeCompare(y[0]))
      .slice(0, 10)
      .map(([k]) => k);
  }, [repos]);
  const nf = useMemo(() => new Intl.NumberFormat(locale), [locale]);

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
    (_ctx, contextSafe) => {
      const setup = contextSafe!(() => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        // Entra por la derecha: la cabecera en espejo se mueve en espejo.
        gsap.from("[data-fx=title]", {
          opacity: 0,
          x: 80,
          duration: 1,
          ease: "expo.out",
          scrollTrigger: { trigger: "[data-fx=title]", start: "top 88%", toggleActions: "play none none none" },
        });
        // El heatmap se dibuja de izquierda a derecha con el scroll, como un gráfico de datos.
        // Un solo tween sobre el contenedor (clip-path) en vez de uno por celda: 371 tweens eran caros.
        gsap.fromTo(
          "[data-heatmap]",
          { clipPath: "inset(0 100% 0 0)" },
          {
            clipPath: "inset(0 0% 0 0)",
            ease: "none",
            scrollTrigger: { trigger: "[data-heatmap]", start: "top 88%", end: "bottom 52%", scrub: 0.5 },
          },
        );
      });
      });
      return whenIdle(setup);
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
                  · {nf.format(contribRes.data.total)} {a.contributionsTotal}
                </span>
              )}
            </p>
            {contribRes.data && (
              <p>
                {a.synced} {timeAgo(contribRes.data.synced_at, locale)}
              </p>
            )}
          </div>
          <Heatmap
            weeks={weeks}
            tipLabel={a.contribOn}
            label={
              contribRes.data
                ? `${a.heatmapLabel}: ${nf.format(contribRes.data.total)} ${a.contributionsTotal}`
                : `${a.heatmapLabel}: ${a.emptyTitle}`
            }
          />          {contribRes.data && (
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
                className={`min-h-8 max-w-full truncate px-3 transition-[background-color,color,transform] duration-150 ease-[var(--ease-out)] active:scale-[0.97] ${
                  filter === f ? "bg-acid text-bg" : "border border-line2 text-fg2 hover:text-fg"
                }`}
              >
                {f ?? a.all}
              </button>
            ))}
          </div>
        )}

        {visible.length > 0 ? (
          <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2 lg:gap-6">
            {visible.map((r, i) => (
              <RepoCard key={r.name} repo={r} nf={nf} index={i} />
            ))}
          </div>
        ) : (
          <div data-fx="status" className="mt-6 border border-line2 bg-surface p-6 sm:p-10">
            <p className="display text-[clamp(1.75rem,3vw,2.5rem)]">{apiEnabled && !loading && !failed ? a.emptyConnectedTitle : a.emptyTitle}</p>
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
