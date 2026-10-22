"use client";

import { useRef, useState } from "react";
import { useLocale } from "@/lib/locale";
import { SectionRule } from "./SectionRule";
import { BASE } from "@/lib/site";

export function Senal() {
  const { t } = useLocale();
  const s = t.senal;
  const [copied, setCopied] = useState(false);
  const timer = useRef(0);

  async function copyEmail() {
    try {
      await navigator.clipboard.writeText(s.email);
    } catch {
      return; // sin permiso del portapapeles: el enlace mailto sigue funcionando
    }
    setCopied(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(false), 1800);
  }
  const link =
    "block border-t border-ink py-4 text-lg no-underline transition-colors duration-150 ease-out hover:bg-ink hover:text-paper sm:text-xl";

  return (
    <section
      id="senal"
      data-section="senal"
      aria-labelledby="senal-title"
      className="invert-section py-20 sm:py-32"
    >
      <SectionRule ink />
      <div className="container-x">
        <h2 id="senal-title" className="display text-[clamp(3rem,21.5vw,28rem)] leading-[0.82]">
          {s.title}
        </h2>

        <div className="mt-16 grid gap-12 md:grid-cols-[1.2fr_1fr] md:gap-20">
          <ul className="border-b border-ink">
            <li className="flex items-stretch">
              <a className={`${link} flex-1`} href={`mailto:${s.email}`}>
                {s.email}
              </a>
              <button
                type="button"
                onClick={copyEmail}
                aria-label={s.copyAria}
                className="min-w-28 border-t border-l border-ink px-4 text-sm transition-colors duration-150 ease-out hover:bg-ink hover:text-paper"
              >
                {copied ? s.copied : s.copy}
              </button>
              <span role="status" className="sr-only">
                {copied ? s.copied : ""}
              </span>
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
            {/* CV público (sin teléfono) en el idioma activo. */}
            <a
              href={`${BASE}/${s.cvFile}`}
              download
              aria-describedby="cv-note"
              className="inline-flex min-h-12 items-center border border-ink bg-ink px-6 font-bold text-paper no-underline transition-colors duration-150 ease-out hover:bg-transparent hover:text-ink"
            >
              {s.cv}
            </a>
            <p id="cv-note" className="text-xs text-mute-ink">
              {s.cvNote}
            </p>
          </div>
        </div>

        <p className="mt-24 text-xs text-mute-ink">{s.end}</p>
      </div>
    </section>
  );
}
