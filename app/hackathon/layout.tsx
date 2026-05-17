import type { Metadata } from "next";
import "./hackathon.css";

export const metadata: Metadata = {
  title: "Hackathón de Negocios 2026 — Y-Hat × FCEN",
  description:
    "5, 6 y 7 de junio en 0+Infinito · Exactas UBA. Tres días para transformar ciencia e innovación en propuestas de negocio. USD 4.500 + USD 90.000 en créditos AWS.",
  openGraph: {
    title: "Hackathón de Negocios 2026 — Y-Hat × FCEN",
    description:
      "Primera Edición · 5, 6 y 7 de junio · 0+Infinito · Exactas UBA",
    type: "website",
  },
};

export default function HackathonLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="hackathon-root">{children}</div>;
}
