"use client";

import dynamic from "next/dynamic";
import { Component, useEffect, useState, type ReactNode } from "react";
import { useReducedMotion } from "@/lib/motion";

// Three.js pesa: se carga aparte y solo después del primer pintado, para no tocar el LCP.
const NoiseCanvas = dynamic(() => import("./NoiseCanvas"), { ssr: false });

/** Si WebGL no está disponible o el contexto falla, el fondo de partículas se omite y el sitio sigue igual. */
class WebGLBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

export function NoiseLayer() {
  const reduced = useReducedMotion();
  const [ready, setReady] = useState(false);

  // El canvas entra con la primera interacción (mouse, toque, scroll, tecla) o, si el visitante no
  // hace nada, a los 8 s de terminar la carga. Así Three.js (~900 KB) no compite con el primer pintado
  // ni con la hidratación, y casi siempre ya está listo cuando la persona empieza a moverse.
  useEffect(() => {
    if (reduced) return;
    let timer = 0;
    const events = ["pointermove", "pointerdown", "touchstart", "wheel", "keydown", "scroll"] as const;
    const go = () => {
      events.forEach((e) => window.removeEventListener(e, go));
      window.clearTimeout(timer);
      setReady(true);
    };
    events.forEach((e) => window.addEventListener(e, go, { passive: true, once: true }));
    const arm = () => {
      timer = window.setTimeout(go, 8000);
    };
    if (document.readyState === "complete") arm();
    else window.addEventListener("load", arm, { once: true });
    return () => {
      events.forEach((e) => window.removeEventListener(e, go));
      window.removeEventListener("load", arm);
      window.clearTimeout(timer);
    };
  }, [reduced]);

  if (reduced || !ready) return null;
  return (
    <WebGLBoundary>
      <NoiseCanvas />
    </WebGLBoundary>
  );
}
