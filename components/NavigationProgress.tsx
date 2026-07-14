"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export function NavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const routeKey = `${pathname}?${searchParams.toString()}`;
  const [isPending, setIsPending] = useState(false);
  const timeoutRef = useRef<number | null>(null);
  const previousRouteKey = useRef(routeKey);

  useEffect(() => {
    if (previousRouteKey.current === routeKey) {
      return;
    }

    previousRouteKey.current = routeKey;
    window.requestAnimationFrame(() => {
      setIsPending(false);
    });

    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, [routeKey]);

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      const target = event.target;

      if (!(target instanceof Element)) {
        return;
      }

      const link = target.closest("a[href]");

      if (!(link instanceof HTMLAnchorElement)) {
        return;
      }

      if (
        link.target ||
        link.hasAttribute("download") ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      const url = new URL(link.href);

      if (url.origin !== window.location.origin) {
        return;
      }

      const current = `${window.location.pathname}${window.location.search}${window.location.hash}`;
      const next = `${url.pathname}${url.search}${url.hash}`;

      if (current === next) {
        return;
      }

      setIsPending(true);

      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = window.setTimeout(() => {
        setIsPending(false);
      }, 6000);
    }

    document.addEventListener("click", handleClick, true);

    return () => {
      document.removeEventListener("click", handleClick, true);

      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      data-navigation-progress={isPending ? "pending" : "idle"}
      className="pointer-events-none fixed inset-x-0 top-0 z-[120] h-0.5 origin-left scale-x-0 bg-[#00c2d1] shadow-[0_0_18px_rgba(0,194,209,0.8)] transition-transform duration-200 data-[navigation-progress=pending]:scale-x-100"
    />
  );
}
