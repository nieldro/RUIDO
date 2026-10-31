import type { MetadataRoute } from "next";

export const dynamic = "force-static";

// Colores iguales a los tokens del brief (fondo --ink) y al themeColor del layout.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Daniel Páez · Analista de datos y desarrollador",
    short_name: "ALEJO.DATA",
    description: "Analista de datos y desarrollador en Bogotá. Saco señal del ruido.",
    lang: "es",
    start_url: ".",
    display: "browser",
    background_color: "#0b0b0a",
    theme_color: "#0b0b0a",
    icons: [{ src: "apple-icon.png", sizes: "180x180", type: "image/png" }],
  };
}
