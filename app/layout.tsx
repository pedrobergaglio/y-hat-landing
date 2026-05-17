import type { Metadata } from "next";
import { Inter, Playfair_Display, Radley } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
});

const radley = Radley({
  variable: "--font-radley",
  weight: ["400"],
  style: ["normal", "italic"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Y-Hat | El punto de encuentro estudiantil",
  description: "El punto de encuentro entre la comunidad estudiantil y el ecosistema de innovación. Súmate a modelar el futuro con nosotros.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        className={`${inter.variable} ${playfair.variable} ${radley.variable} font-sans antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
