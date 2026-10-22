"use client";

import { useLayoutEffect, useRef } from "react";
import { gsap } from "gsap";
import { prefersReducedMotion } from "@/lib/motion";

/**
 * Falso log que "escribe" los problemas reales que resolvió Daniel. El texto está completo en el HTML;
 * al montar se oculta carácter a carácter y se revela línea por línea. Sin movimiento: todo visible.
 */
export function TypeLog({ lines, label }: { lines: string[]; label: string }) {
  const ref = useRef<HTMLUListElement>(null);
  const first = useRef(true);

  useLayoutEffect(() => {
    const root = ref.current;
    if (!root || prefersReducedMotion()) return;
    const items = Array.from(root.querySelectorAll<HTMLElement>("[data-line]"));
    const all = Array.from(root.querySelectorAll<HTMLElement>("[data-c], [data-prompt], [data-cursor]"));
    gsap.set(all, { opacity: 0 });

    const tl = gsap.timeline({ delay: first.current ? 1.6 : 0.1 });
    first.current = false;
    items.forEach((li) => {
      const prompt = li.querySelector("[data-prompt]");
      const chars = li.querySelectorAll("[data-c]");
      const cursor = li.querySelector("[data-cursor]");
      tl.set(prompt, { opacity: 1 }, ">0.28");
      tl.to(chars, { opacity: 1, duration: 0.001, stagger: 0.022 }, "<");
      if (cursor) tl.set(cursor, { opacity: 1 }, ">");
    });
    return () => {
      tl.kill();
    };
  }, [lines]);

  return (
    <ul ref={ref} className="space-y-1 text-sm text-fg2" aria-label={label}>
      {lines.map((line, i) => (
        <li key={line} data-line className="flex gap-2">
          <span data-prompt className="text-acid" aria-hidden="true">
            &gt;
          </span>
          <span>
            {Array.from(line).map((ch, j) => (
              <span key={j} data-c className="whitespace-pre">
                {ch}
              </span>
            ))}
            {i === lines.length - 1 && (
              <span data-cursor aria-hidden="true" className="ml-1 text-acid">
                <span className="cursor-blink">_</span>
              </span>
            )}
          </span>
        </li>
      ))}
    </ul>
  );
}
