"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";

const CURRENT_ROUTE_KEY = "conciertos-gdl-current-route";
const PREVIOUS_ROUTE_KEY = "conciertos-gdl-previous-route";

export function RouteHistoryTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const search = searchParams.toString();
    const route = search ? `${pathname}?${search}` : pathname;
    const currentRoute = window.sessionStorage.getItem(CURRENT_ROUTE_KEY);

    if (currentRoute && currentRoute !== route) {
      window.sessionStorage.setItem(PREVIOUS_ROUTE_KEY, currentRoute);
    }

    window.sessionStorage.setItem(CURRENT_ROUTE_KEY, route);
  }, [pathname, searchParams]);

  return null;
}

export function getPreviousInternalRoute() {
  return window.sessionStorage.getItem(PREVIOUS_ROUTE_KEY);
}
