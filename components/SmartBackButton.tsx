"use client";

import { ArrowLeft } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  getInternalRouteStack,
  setInternalRouteStack,
} from "@/components/RouteHistoryTracker";

type SmartBackButtonProps = {
  fallbackHref: string;
  label: string;
  variant?: "light" | "dark";
};

export function SmartBackButton({
  fallbackHref,
  label,
  variant = "light",
}: SmartBackButtonProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  function goBack() {
    const search = searchParams.toString();
    const currentRoute = search ? `${pathname}?${search}` : pathname;
    const stack = getInternalRouteStack();
    const stackWithoutCurrent =
      stack.at(-1) === currentRoute ? stack.slice(0, -1) : stack;
    const previousRoute = stackWithoutCurrent.at(-1);
    const target = previousRoute && previousRoute !== "/" ? previousRoute : fallbackHref;

    setInternalRouteStack(
      previousRoute && previousRoute !== "/"
        ? stackWithoutCurrent
        : [fallbackHref],
    );

    router.push(target, { scroll: target === fallbackHref });
  }

  return (
    <button
      type="button"
      onClick={goBack}
      aria-label={label}
      data-smart-back-button
      className={
        variant === "dark"
          ? "inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-md px-1 text-base font-bold text-slate-300 transition hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          : "inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-md px-1 text-base font-bold text-slate-600 transition hover:text-violet-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600"
      }
    >
      <ArrowLeft className="h-5 w-5" aria-hidden="true" />
      {label}
    </button>
  );
}
