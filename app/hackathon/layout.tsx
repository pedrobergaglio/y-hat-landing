import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import "./hackathon.css";

const jbm = JetBrains_Mono({
  variable: "--font-jbm",
  weight: ["400", "500", "600"],
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Hackathón de Negocios 2026 — Y-Hat",
  description:
    "5, 6 y 7 de junio en 0+Infinito. Tres días para transformar ciencia e innovación en propuestas de negocio. USD 4.500 + USD 90.000 en créditos AWS.",
  openGraph: {
    title: "Hackathón de Negocios 2026 — Y-Hat",
    description: "Primera Edición · 5, 6 y 7 de junio · 0+Infinito",
    type: "website",
  },
};

const initScript = `
document.documentElement.classList.add('anims-ready');
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
`;

export default function HackathonLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: initScript }} />
      <div className={`hackathon-root ${jbm.variable}`}>{children}</div>
    </>
  );
}
