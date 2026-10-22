import { LocaleProvider } from "@/lib/locale";
import { Header } from "@/components/Header";
import { SmoothScroll } from "@/components/SmoothScroll";
import { Analytics } from "@/components/Analytics";
import { NoiseLayer } from "@/components/NoiseLayer";
import { Hero } from "@/components/Hero";
import { Limpieza } from "@/components/Limpieza";
import { Historial } from "@/components/Historial";
import { Modelo } from "@/components/Modelo";
import { Archivo } from "@/components/Archivo";
import { Pipeline } from "@/components/Pipeline";
import { Servicios } from "@/components/Servicios";
import { Senal } from "@/components/Senal";

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
