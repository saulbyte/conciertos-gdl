import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { BackToTopButton } from "@/components/BackToTopButton";
import { AdSenseScript } from "@/components/AdSenseScript";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { RouteHistoryTracker } from "@/components/RouteHistoryTracker";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  applicationName: "La Cartelera",
  title: {
    default: "La Cartelera",
    template: "%s | La Cartelera",
  },
  description:
    "Descubre conciertos y eventos musicales en Guadalajara y su zona metropolitana.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "La Cartelera",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: "/icons/apple-touch-icon.png",
  },
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  themeColor: "#071018",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head />
      <body className="flex min-h-full flex-col">
        <SiteHeader />
        <div className="flex-1">{children}</div>
        <SiteFooter />
        <BackToTopButton />
        <MobileBottomNav />
        <Suspense fallback={null}>
          <RouteHistoryTracker />
        </Suspense>
        <Suspense fallback={null}>
          <AdSenseScript />
        </Suspense>
        <Analytics />
      </body>
    </html>
  );
}
