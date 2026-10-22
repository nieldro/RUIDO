"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { useReducedMotion } from "@/lib/motion";

// Three.js pesa: se carga aparte y solo después del primer pintado, para no tocar el LCP.
const NoiseCanvas = dynamic(() => import("./NoiseCanvas"), { ssr: false });

export function NoiseLayer() {
  const reduced = useReducedMotion();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (reduced) return;
    const id = window.setTimeout(() => setReady(true), 500);
    return () => window.clearTimeout(id);
  }, [reduced]);

  if (reduced || !ready) return null;
  return <NoiseCanvas />;
}
