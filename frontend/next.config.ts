import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Exportación estática: el sitio es HTML plano (sirve en nginx, Vercel o GitHub Pages sin Node).
  // El backend FastAPI se consume por NEXT_PUBLIC_API_URL.
  output: "export",
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
