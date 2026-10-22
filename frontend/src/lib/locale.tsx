"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useSyncExternalStore } from "react";
import { es, type Dict } from "@/content/es";
import { en } from "@/content/en";
import { prefersReducedMotion } from "@/lib/motion";

export type Locale = "es" | "en";

const dicts: Record<Locale, Dict> = { es, en };
const STORAGE_KEY = "alejo-lang";
const EVENT = "alejo-lang-change";

type Ctx = { locale: Locale; setLocale: (l: Locale) => void; t: Dict };

const LocaleContext = createContext<Ctx>({ locale: "es", setLocale: () => {}, t: es });

// El idioma vive en localStorage. useSyncExternalStore da ES en el servidor y en la hidratación,
// y cambia al guardado sin desajuste ni setState dentro de un efecto.
function subscribe(cb: () => void) {
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}

// Respaldo en memoria para que el toggle funcione aunque el almacenamiento esté bloqueado.
let memory: Locale | null = null;

function getSnapshot(): Locale {
  if (memory) return memory;
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    return saved === "en" ? "en" : "es";
  } catch {
    return "es";
  }
}

const getServerSnapshot = (): Locale => "es";

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const locale = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  useEffect(() => {
    document.documentElement.lang = locale;
    document.title = dicts[locale].meta.title;
  }, [locale]);

  const setLocale = useCallback((l: Locale) => {
    const apply = () => {
      memory = l;
      try {
        window.localStorage.setItem(STORAGE_KEY, l);
      } catch {
        /* almacenamiento bloqueado: el cambio no persiste */
      }
      window.dispatchEvent(new Event(EVENT));
    };
    if (prefersReducedMotion() || getSnapshot() === l) {
      apply();
      return;
    }
    // Atenúa → cambia el texto en el punto medio → vuelve (ver .lang-swap en globals.css).
    const root = document.documentElement;
    root.classList.add("lang-swap");
    window.setTimeout(() => {
      apply();
      requestAnimationFrame(() => root.classList.remove("lang-swap"));
    }, 120);
  }, []);

  const value = useMemo(() => ({ locale, setLocale, t: dicts[locale] }), [locale, setLocale]);
  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  return useContext(LocaleContext);
}
