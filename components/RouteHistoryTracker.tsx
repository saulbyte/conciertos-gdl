"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";

const ROUTE_STACK_KEY = "conciertos-gdl-route-stack";
const MAX_STACK_LENGTH = 20;

export function RouteHistoryTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const search = searchParams.toString();
    const route = search ? `${pathname}?${search}` : pathname;
    const stack = getInternalRouteStack();
    const currentRoute = stack.at(-1);

    if (currentRoute === route) {
      return;
    }

    const existingIndex = stack.lastIndexOf(route);
    const nextStack =
      existingIndex >= 0 ? stack.slice(0, existingIndex + 1) : [...stack, route];

    setInternalRouteStack(nextStack.slice(-MAX_STACK_LENGTH));
  }, [pathname, searchParams]);

  return null;
}

export function getInternalRouteStack() {
  const rawStack = window.sessionStorage.getItem(ROUTE_STACK_KEY);

  if (!rawStack) {
    return [];
  }

  try {
    const stack = JSON.parse(rawStack) as unknown;

    return Array.isArray(stack)
      ? stack.filter((route): route is string => typeof route === "string")
      : [];
  } catch {
    return [];
  }
}

export function setInternalRouteStack(stack: string[]) {
  window.sessionStorage.setItem(
    ROUTE_STACK_KEY,
    JSON.stringify(stack.slice(-MAX_STACK_LENGTH)),
  );
}
