import type { Metadata, Viewport } from "next";
import { Anton, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const anton = Anton({
  variable: "--font-anton",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  display: "swap",
});

// URL pública del sitio, para que las vistas previas al compartir apunten a la imagen correcta.
// Se define con NEXT_PUBLIC_SITE_URL al publicar (no se inventa un dominio).
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
const TITLE = "Daniel Páez · Analista de datos y desarrollador";
const DESCRIPTION =
  "Analista de datos y desarrollador en Bogotá. Python, SQL, Power BI y automatización. Saco señal del ruido.";

export const metadata: Metadata = {
  // Con barra final y URLs relativas ("og.png") para que funcione también bajo una subruta (/RUIDO).
  metadataBase: new URL(SITE_URL.replace(/\/?$/, "/")),
  title: TITLE,
  description: DESCRIPTION,
  applicationName: "ALEJO.DATA",
  authors: [{ name: "Daniel Páez" }],
  keywords: ["analista de datos", "BI", "Power BI", "Python", "SQL", "ETL", "automatización", "Bogotá", "freelance"],
  openGraph: {
    type: "website",
    siteName: "ALEJO.DATA",
    title: TITLE,
    description: DESCRIPTION,
    locale: "es_CO",
    alternateLocale: ["en_US"],
    images: [{ url: "og.png", width: 1200, height: 630, alt: TITLE }],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["og.png"],
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#0b0b0a",
  colorScheme: "dark",
  // Ocupa también la zona del notch; el header compensa con env(safe-area-inset-*).
  viewportFit: "cover",
};

// Datos estructurados: quién es, a qué se dedica y dónde encontrarlo. Solo hechos del CV.
const PERSON = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: "Daniel Alejandro Páez Torres",
  alternateName: "Alejo",
  jobTitle: "Analista de datos y desarrollador",
  email: "mailto:dapt.torres@gmail.com",
  address: { "@type": "PostalAddress", addressLocality: "Bogotá", addressCountry: "CO" },
  knowsLanguage: ["es", "en"],
  knowsAbout: ["Python", "SQL", "Power BI", "PostgreSQL", "ETL", "Azure", "GCP", "AWS", "n8n"],
  sameAs: ["https://www.linkedin.com/in/daniel-paez-torres", "https://github.com/nieldro"],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${anton.variable} ${jetbrains.variable}`}>
      <body>
        {children}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(PERSON) }} />
      </body>
    </html>
  );
}
