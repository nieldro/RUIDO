import dynamic from "next/dynamic";
import { LocaleProvider } from "@/lib/locale";
import { Header } from "@/components/Header";
import { SmoothScroll } from "@/components/SmoothScroll";
import { Analytics } from "@/components/Analytics";
import { NoiseLayer } from "@/components/NoiseLayer";
import { Hero } from "@/components/Hero";

// Cada sección bajo el hero es su propio límite de Suspense: el HTML ya viene renderizado (SEO y sin JS),
// pero React las hidrata una por una, cediendo el hilo entre ellas, en vez de en una sola tarea larga.
const Limpieza = dynamic(() => import("@/components/Limpieza").then((m) => m.Limpieza));
const Historial = dynamic(() => import("@/components/Historial").then((m) => m.Historial));
const Modelo = dynamic(() => import("@/components/Modelo").then((m) => m.Modelo));
const Archivo = dynamic(() => import("@/components/Archivo").then((m) => m.Archivo));
const Pipeline = dynamic(() => import("@/components/Pipeline").then((m) => m.Pipeline));
const Servicios = dynamic(() => import("@/components/Servicios").then((m) => m.Servicios));
const Senal = dynamic(() => import("@/components/Senal").then((m) => m.Senal));

export default function Home() {
  return (
    <LocaleProvider>
      <SmoothScroll />
      <Analytics />
      <NoiseLayer />
      <Header />
      <main id="contenido" className="relative z-10">
        <Hero />
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
