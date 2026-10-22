"use client";

import { useEffect } from "react";
import { api, apiEnabled } from "@/lib/api";
import { SECTION_IDS, scrollState } from "@/lib/scrollState";

/**
 * Cuenta la visita y hasta dónde llegó el visitante en cada sección. Sin cookies de terceros: el
 * backend recibe un id de sesión anónimo, la sección y un porcentaje. Si no hay backend, no hace nada.
 */
export function Analytics() {
  useEffect(() => {
    if (!apiEnabled) return;
    let sid: string | null = null;
    const sent = SECTION_IDS.map(() => -1);

    api
      .visit()
      .then((r) => {
        sid = r.session_id;
      })
      .catch(() => {
        /* backend caído: la página sigue igual */
      });

    const id = window.setInterval(() => {
      if (!sid || document.hidden) return;
      const { scrollY, vh, tops } = scrollState;
      if (!tops.length) return;
      const docH = document.documentElement.scrollHeight;
      const bottom = scrollY + vh;
      tops.forEach((top, i) => {
        if (bottom <= top) return; // todavía no llega a esta sección
        const end = i < tops.length - 1 ? tops[i + 1] : docH;
        const depth = Math.round(Math.min(1, Math.max(0, (bottom - top) / (end - top))) * 100);
        if (depth - sent[i] >= 20 || (depth === 100 && sent[i] < 100)) {
          sent[i] = depth;
          api.event(sid!, SECTION_IDS[i], depth).catch(() => {});
        }
      });
    }, 2000);

    return () => window.clearInterval(id);
  }, []);

  return null;
}
