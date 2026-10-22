"use client";

import { useEffect, useState } from "react";

/** URL del backend FastAPI. Vacía = no hay backend: la página sigue funcionando con estados honestos. */
export const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, "");
export const apiEnabled = API_URL !== "";

export type ApiStatus = "off" | "loading" | "ok" | "error";

export type Stats = {
  visits_today: number;
  visits_total: number;
  countries: { country: string; count: number }[];
  scroll_depth: Record<string, number | null>;
  generated_at: string;
};

export type Repo = {
  name: string;
  description: string | null;
  languages: { name: string; bytes: number; percent: number }[];
  stars: number;
  topics: string[];
  homepage: string | null;
  pushed_at: string | null;
  synced_at: string | null;
};

export type ReposResponse = { repos: Repo[]; synced_at: string | null };

export type Contributions = {
  user: string;
  total: number;
  weeks: { date: string; count: number; level: number }[][];
  synced_at: string;
  stale: boolean;
};

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

export async function request<T>(path: string, init?: RequestInit, timeoutMs = 10000): Promise<T> {
  if (!apiEnabled) throw new ApiError(0, "no_api", "Backend no configurado");
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(`${API_URL}${path}`, {
      ...init,
      signal: ctrl.signal,
      headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    });
    if (!res.ok) {
      let code = "http_error";
      let detail = `HTTP ${res.status}`;
      try {
        const body = await res.json();
        code = body.code ?? code;
        detail = typeof body.detail === "string" ? body.detail : detail;
      } catch {
        /* cuerpo no JSON */
      }
      throw new ApiError(res.status, code, detail);
    }
    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

export const api = {
  visit: () => request<{ session_id: string }>("/api/visit", { method: "POST" }),
  event: (session_id: string, section: string, depth: number) =>
    request<{ ok: boolean }>("/api/event", {
      method: "POST",
      body: JSON.stringify({ session_id, section, depth }),
      keepalive: true,
    }),
  stats: () => request<Stats>("/api/stats"),
  repos: () => request<ReposResponse>("/api/repos"),
  contributions: () => request<Contributions>("/api/contributions"),
  ask: (question: string) =>
    request<{ answer: string }>("/api/ask", { method: "POST", body: JSON.stringify({ question }) }, 30000),
};

/** Carga un recurso al montar y lo refresca cada `everyMs` (0 = una sola vez). */
export function useApiResource<T>(load: () => Promise<T>, everyMs = 0) {
  const [data, setData] = useState<T | null>(null);
  const [status, setStatus] = useState<ApiStatus>(apiEnabled ? "loading" : "off");

  useEffect(() => {
    if (!apiEnabled) return;
    let alive = true;
    const run = () =>
      load()
        .then((d) => {
          if (!alive) return;
          setData(d);
          setStatus("ok");
        })
        .catch(() => {
          if (alive) setStatus("error");
        });
    run();
    const id = everyMs > 0 ? window.setInterval(run, everyMs) : 0;
    return () => {
      alive = false;
      if (id) window.clearInterval(id);
    };
    // `load` es una función estable del módulo `api`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [everyMs]);

  return { data, status };
}

export type StreamLine =
  | { id: number; kind: "visit"; country: string | null; device: string; ts: string }
  | { id: number; kind: "event"; section: string; depth: number; ts: string };

/** Eventos anónimos en vivo (SSE). Mantiene las últimas `max` líneas. */
export function useStream(max = 8) {
  const [lines, setLines] = useState<StreamLine[]>([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!apiEnabled || typeof EventSource === "undefined") return;
    let seq = 0;
    const es = new EventSource(`${API_URL}/api/stream`);
    es.onopen = () => setConnected(true);
    es.onerror = () => setConnected(false);
    const push = (line: StreamLine) => setLines((prev) => [line, ...prev].slice(0, max));
    es.addEventListener("visit", (e) => {
      try {
        const d = JSON.parse((e as MessageEvent).data);
        push({ id: ++seq, kind: "visit", country: d.country ?? null, device: d.device, ts: d.ts });
      } catch {
        /* evento mal formado: se ignora */
      }
    });
    es.addEventListener("event", (e) => {
      try {
        const d = JSON.parse((e as MessageEvent).data);
        push({ id: ++seq, kind: "event", section: d.section, depth: d.depth, ts: d.ts });
      } catch {
        /* evento mal formado: se ignora */
      }
    });
    return () => es.close();
  }, [max]);

  return { lines, connected };
}
