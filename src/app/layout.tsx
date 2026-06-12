import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sonara — L'oreille que vous n'aviez pas.",
  description: "Sonara transforme chaque appel téléphonique en donnée exploitable, instantanément. Plateforme d'enquêtes par IA vocale conversationnelle en Afrique de l'Ouest.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="h-full antialiased">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://api.fontshare.com/v2/css?f[]=satoshi@300,400,500,700,900&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Roboto+Mono:ital,wght@0,100..700;1,100..700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Instrument+Sans:ital,wght@0,400..700;1,400..700&family=Instrument+Serif:ital@0;1&display=swap" rel="stylesheet" />
        <script src="https://cdn.jsdelivr.net/npm/hls.js@1.6.15/dist/hls.min.js" async></script>
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
