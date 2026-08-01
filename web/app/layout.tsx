import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ??
      "https://aarnal80.github.io/guia-reconstruccion-psicologica-venezuela/",
  ),
  title: {
    default: "Guía de reconstrucción psicológica de una catástrofe",
    template: "%s · Guía de reconstrucción psicológica de una catástrofe",
  },
  description:
    "Una guía cercana y práctica para comprender el impacto psicológico de una catástrofe, atravesar el duelo y acompañar a otras personas.",
  applicationName: "Guía de reconstrucción psicológica de una catástrofe",
  authors: [
    { name: "Indira Lucía Parra" },
    { name: "Antonio José Arnal Meinhardt" },
  ],
  keywords: [
    "duelo",
    "Venezuela",
    "primeros auxilios psicológicos",
    "catástrofes",
    "salud mental",
  ],
  openGraph: {
    type: "website",
    locale: "es_VE",
    title: "Guía de reconstrucción psicológica de una catástrofe",
    description: "Venezuela.",
    images: [
      {
        url: "./og.png",
        width: 1536,
        height: 804,
        alt: "Guía de reconstrucción psicológica de una catástrofe — Venezuela",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Guía de reconstrucción psicológica de una catástrofe",
    description: "Venezuela.",
    images: ["./og.png"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f1e8" },
    { media: "(prefers-color-scheme: dark)", color: "#0d2230" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <head>
        <link rel="manifest" href="./manifest.webmanifest" />
        <link rel="icon" href="./icon-192.png" />
        <link rel="apple-touch-icon" href="./icon-192.png" />
      </head>
      <body>{children}</body>
    </html>
  );
}
