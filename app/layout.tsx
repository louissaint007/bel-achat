import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bel Achat — Téléphones, parfums & soins",
  description: "La boutique Bel Achat : téléphones portables, parfums et soins de beauté.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className="antialiased">{children}</body>
    </html>
  );
}
