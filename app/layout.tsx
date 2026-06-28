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
  applicationName: "Conciertos GDL",
  title: {
    default: "Conciertos GDL",
    template: "%s | Conciertos GDL",
  },
  description:
    "Descubre conciertos y eventos musicales en Guadalajara y su zona metropolitana.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Conciertos GDL",
  },
  icons: {
    apple: "/icons/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#7c3aed",
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
