import dynamic from "next/dynamic";
import { LocaleProvider } from "@/lib/locale";
import { Header } from "@/components/Header";
import { SmoothScroll } from "@/components/SmoothScroll";
import { Analytics } from "@/components/Analytics";
import { NoiseLayer } from "@/components/NoiseLayer";
import { Hero } from "@/components/Hero";
import { Marquee } from "@/components/Marquee";
import { ScrollFx } from "@/components/ScrollFx";
import { Cursor } from "@/components/Cursor";

/**
 * Cada sección bajo el hero es su propio límite de Suspense. El HTML ya viene renderizado (SEO, sin JS,
 * primer pintado), pero React NO la hidrata hasta que el visitante se acerca a ella (o pasan 15 s):
 * mientras tanto el hilo principal queda libre para el hero. Al hidratarse arranca su movimiento.
 */
function whenNear<T>(id: string, load: () => Promise<T>): () => Promise<T> {
  return () =>
    new Promise<T>((resolve) => {
      const go = () => resolve(load());
      if (typeof window === "undefined") return go(); // al compilar el sitio estático: carga directa
      const el = document.getElementById(id);
      if (!el || typeof IntersectionObserver === "undefined") return go();
      let done = false;
      const fire = () => {
        if (done) return;
        done = true;
        io.disconnect();
        window.clearTimeout(timer);
        go();
      };
      const io = new IntersectionObserver((es) => es.some((e) => e.isIntersecting) && fire(), {
        rootMargin: "1400px 0px",
      });
      io.observe(el);
      const timer = window.setTimeout(fire, 15000);
    });
}

const Limpieza = dynamic(whenNear("limpieza", () => import("@/components/Limpieza").then((m) => m.Limpieza)));
const Historial = dynamic(whenNear("historial", () => import("@/components/Historial").then((m) => m.Historial)));
const Modelo = dynamic(whenNear("modelo", () => import("@/components/Modelo").then((m) => m.Modelo)));
const Archivo = dynamic(whenNear("archivo", () => import("@/components/Archivo").then((m) => m.Archivo)));
const Pipeline = dynamic(whenNear("pipeline", () => import("@/components/Pipeline").then((m) => m.Pipeline)));
const Servicios = dynamic(whenNear("servicios", () => import("@/components/Servicios").then((m) => m.Servicios)));
const Senal = dynamic(whenNear("senal", () => import("@/components/Senal").then((m) => m.Senal)));

export default function Home() {
  return (
    <LocaleProvider>
      <SmoothScroll />
      <Analytics />
      <NoiseLayer />
      <Header />
      <ScrollFx />
      <Cursor />
      <main id="contenido" className="relative z-10">
        <Hero />
        <Marquee />
        <Limpieza />
        <Historial />
        <Modelo />
        <Archivo />
        <Pipeline />
        <Servicios />
        <Senal />
      </main>
    </LocaleProvider>
  );
}
