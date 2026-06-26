"use client";

import { ArrowLeft } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { getPreviousInternalRoute } from "@/components/RouteHistoryTracker";

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
  const router = useRouter();

  function goBack() {
    const previousRoute = getPreviousInternalRoute();
    const target =
      previousRoute && previousRoute !== pathname && previousRoute !== "/"
        ? previousRoute
        : fallbackHref;

    router.push(target, { scroll: target === fallbackHref });
  }

  return (
    <button
      type="button"
      onClick={goBack}
      className={
        variant === "dark"
          ? "inline-flex items-center gap-2 text-sm font-bold text-slate-300 transition hover:text-white"
          : "inline-flex items-center gap-2 text-sm font-bold text-slate-600 transition hover:text-violet-700"
      }
    >
      <ArrowLeft className="h-4 w-4" aria-hidden="true" />
      {label}
    </button>
  );
}
