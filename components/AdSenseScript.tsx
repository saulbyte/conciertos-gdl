"use client";

import Script from "next/script";
import { usePathname, useSearchParams } from "next/navigation";

const ADSENSE_CLIENT_ID = "ca-pub-8074659663946335";

export function AdSenseScript() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  if (!shouldLoadAds(pathname, searchParams)) {
    return null;
  }

  return (
    <Script
      id="adsense-auto-ads"
      async
      strategy="afterInteractive"
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT_ID}`}
      crossOrigin="anonymous"
    />
  );
}

function shouldLoadAds(pathname: string, searchParams: URLSearchParams) {
  if (pathname === "/") {
    return searchParams.toString().length === 0;
  }

  return (
    pathname === "/descubrir" ||
    pathname === "/artistas" ||
    pathname.startsWith("/event/") ||
    pathname.startsWith("/artistas/")
  );
}
