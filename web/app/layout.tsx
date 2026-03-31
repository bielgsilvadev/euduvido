import type { Metadata } from "next";
import { Manrope, Space_Grotesk } from "next/font/google";
import "./globals.css";

const space = Space_Grotesk({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const manrope = Manrope({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

export const metadata: Metadata = {
  metadataBase: siteUrl ? new URL(siteUrl) : undefined,
  title: "Eu Duvido! — Apostas P2P sociais",
  description:
    "Duelos entre pessoas reais com dinheiro em jogo, árbitro escolhido e comunidade acompanhando. Termos e privacidade do app Eu Duvido!.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${space.variable} ${manrope.variable} antialiased bg-dl-bg text-dl-text`}>
        {children}
      </body>
    </html>
  );
}
