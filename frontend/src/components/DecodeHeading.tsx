"use client";

import { useEffect, useRef } from "react";
import { MOTION_OK, ScrollTrigger, gsap } from "@/lib/motion";
import { scramble } from "@/lib/scramble";

/**
 * Título de sección que se decodifica una vez cuando entra en pantalla (como el nombre del hero,
 * pero disparado por scroll). El texto real está siempre en el HTML y en aria-label.
 */
export function DecodeHeading({
  id,
  text,
  className = "",
}: {
  id?: string;
  text: string;
  className?: string;
}) {
  const ref = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const mm = gsap.matchMedia();
    let run: ReturnType<typeof scramble> | null = null;
    mm.add(MOTION_OK, () => {
      // Se decodifica una sola vez. El trigger no se autodestruye (kill dentro de onEnter durante el
      // arranque rompía ScrollTrigger.refresh al recargar con el scroll ya avanzado).
      let played = false;
      const st = ScrollTrigger.create({
        trigger: el,
        start: "top 88%",
        onEnter: () => {
          if (played) return;
          played = true;
          run = scramble(el, { delay: 120, stagger: 55 });
        },
      });
      return () => {
        st.kill();
        run?.cancel();
      };
    });
    return () => mm.revert();
  }, [text]);

  return (
    <h2 ref={ref} id={id} aria-label={text} className={className}>
      <span aria-hidden="true">
        {/* Cada palabra es una unidad sin corte: aunque las letras pasen a inline-block, no parte palabras. */}
        {text.split(" ").map((word, w, all) => (
          <span key={w}>
            <span className="whitespace-nowrap">
              {Array.from(word).map((ch, i) => (
                <span key={i} data-ch={ch}>
                  {ch}
                </span>
              ))}
            </span>
            {w < all.length - 1 && " "}
          </span>
        ))}
      </span>
    </h2>
  );
}
