"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function DesktopDiscoverRedirect() {
  const router = useRouter();

  useEffect(() => {
    if (window.matchMedia("(min-width: 768px)").matches) {
      router.replace("/#eventos");
    }
  }, [router]);

  return null;
}
