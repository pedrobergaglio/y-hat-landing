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

export const metadata: Metadata = {
  title: "Investigathon 2026 · Y-Hat",
  description:
    "Del 16 al 30 de octubre en 0+Infinito · Exactas, UBA. Competencia de investigación: equipos de estudiantes abordan problemas científicos reales propuestos por laboratorios de la FCEN, acompañados por sus investigadorxs.",
  openGraph: {
    title: "Investigathon 2026 · Y-Hat",
    description:
      "Segunda edición · 16 al 30 de octubre · 0+Infinito · Exactas, UBA",
    type: "website",
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
