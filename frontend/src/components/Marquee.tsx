"use client";

import { useLocale } from "@/lib/locale";

/**
 * Cinta de herramientas entre el hero y Limpieza: texto Anton solo con contorno. Es decorativa
 * (aria-hidden: el contenido real vive en Limpieza). ScrollFx la mueve y la acelera con el scroll.
 */
export function Marquee() {
  const { t } = useLocale();
  const items = t.limpieza.groups.flatMap((g) => [g.name, ...g.tools.slice(0, 1)]);
  const row = (suffix: string) =>
    items.map((it, i) => (
      <span key={`${suffix}-${i}`} className="flex items-center gap-8">
        <span>{it}</span>
        <span className="text-acid" aria-hidden="true">
          /
        </span>
      </span>
    ));

  return (
    <div
      aria-hidden="true"
      className="h-[calc(clamp(1.75rem,5vw,4rem)+2rem)] overflow-hidden border-y border-line py-4 select-none motion-reduce:hidden sm:h-[calc(clamp(1.75rem,5vw,4rem)+3rem)] sm:py-6"
    >
      <div
        data-marquee-track
        className="display marquee-text flex w-max gap-8 text-[clamp(1.75rem,5vw,4rem)] leading-none whitespace-nowrap"
      >
        {row("a")}
        {row("b")}
      </div>
    </div>
  );
}
