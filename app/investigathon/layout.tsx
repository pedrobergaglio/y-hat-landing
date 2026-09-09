import type { Metadata } from "next";
import { IBM_Plex_Sans, Newsreader } from "next/font/google";
import "./investigathon.css";

const display = Newsreader({
  variable: "--font-display",
  weight: ["400", "500"],
  style: ["normal", "italic"],
  subsets: ["latin"],
  display: "swap",
});

const text = IBM_Plex_Sans({
  variable: "--font-text",
  weight: ["400", "500", "600"],
  subsets: ["latin"],
  display: "swap",
});

const SITE = "https://somosyhat.com";
const DESCRIPTION =
  "Del 16 al 30 de octubre en 0+Infinito · Exactas, UBA. Competencia de investigación: equipos de estudiantes abordan problemas científicos reales propuestos por laboratorios de la FCEN, acompañados por sus investigadorxs.";
const OG_IMAGE = {
  url: "/investigathon/og-2026-10.png",
  secureUrl: "https://somosyhat.com/investigathon/og-2026-10.png",
  type: "image/png",
  width: 1200,
  height: 630,
  alt: "Investigathon 2026 · ¿Por qué esperar para hacer ciencia? · 16 al 30 de octubre · 0+Infinito, Exactas, UBA",
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: "Investigathon 2026 · Y-Hat",
  description: DESCRIPTION,
  openGraph: {
    title: "Investigathon 2026 · Y-Hat",
    description:
      "Segunda edición · 16 al 30 de octubre · 0+Infinito · Exactas, UBA",
    type: "website",
    url: "/investigathon",
    siteName: "Y-Hat",
    locale: "es_AR",
    images: [OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: "Investigathon 2026 · Y-Hat",
    description:
      "Segunda edición · 16 al 30 de octubre · 0+Infinito · Exactas, UBA",
    images: [OG_IMAGE.url],
  },
};

const initScript = `
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
`;

export default function InvestigathonLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: initScript }} />
      <div className={`investigathon-root ${display.variable} ${text.variable}`}>
        {children}
      </div>
    </>
  );
}
