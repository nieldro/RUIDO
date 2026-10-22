import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Exportación estática: el sitio es HTML plano (sirve en nginx, Vercel o GitHub Pages sin Node).
  // El backend FastAPI se consume por NEXT_PUBLIC_API_URL.
  output: "export",
  // Permite compilar a otra carpeta (NEXT_DIST_DIR=out-new) sin pisar la que se está sirviendo.
  ...(process.env.NEXT_DIST_DIR ? { distDir: process.env.NEXT_DIST_DIR } : {}),
  images: { unoptimized: true },
  trailingSlash: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
