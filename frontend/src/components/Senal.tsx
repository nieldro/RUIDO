"use client";

import { useLocale } from "@/lib/locale";

export function Senal() {
  const { t } = useLocale();
  const s = t.senal;
  const link =
    "block border-t border-ink py-4 text-lg no-underline transition-colors duration-150 ease-out hover:bg-ink hover:text-paper sm:text-xl";

  return (
    <section
      id="senal"
      data-section="senal"
      aria-labelledby="senal-title"
      className="invert-section py-20 sm:py-32"
    >
      <div className="container-x">
        <h2 id="senal-title" className="display text-[clamp(3rem,21.5vw,28rem)] leading-[0.82]">
          {s.title}
        </h2>

        <div className="mt-16 grid gap-12 md:grid-cols-[1.2fr_1fr] md:gap-20">
          <ul className="border-b border-ink">
            <li>
              <a className={link} href={`mailto:${s.email}`}>
                {s.email}
              </a>
            </li>
            <li>
              <a className={link} href={`https://${s.linkedin}`} target="_blank" rel="noopener noreferrer">
                {s.linkedin}
              </a>
            </li>
            <li>
              <a className={link} href={`https://${s.github}`} target="_blank" rel="noopener noreferrer">
                {s.github}
              </a>
            </li>
          </ul>

          <div className="space-y-6">
            <p className="text-lg">{s.place}</p>
            {/* El PDF aún no existe: el botón queda inactivo y rotulado, nunca un enlace roto. */}
            <button
              type="button"
              disabled
              aria-describedby="cv-note"
              className="min-h-12 border border-ink bg-ink px-6 font-bold text-paper disabled:border-line-ink disabled:bg-transparent disabled:text-mute-ink"
            >
              {s.cv}
            </button>
            <p id="cv-note" className="text-xs text-mute-ink">
              {s.cvPlaceholder}
            </p>
          </div>
        </div>

        <p className="mt-24 text-xs text-mute-ink">{s.end}</p>
      </div>
    </section>
  );
}
