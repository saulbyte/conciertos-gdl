import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "D\u00f3nde Toca",
    short_name: "D\u00f3nde Toca",
    description:
      "Agenda de conciertos y eventos musicales en Guadalajara y su zona metropolitana.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#071018",
    theme_color: "#071018",
    lang: "es-MX",
    categories: ["entertainment", "music"],
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
