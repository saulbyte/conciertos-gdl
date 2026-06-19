"use client";

import { useState } from "react";
import { Heart } from "lucide-react";

type EventLikeButtonProps = {
  eventId: string;
  initialCount: number;
  variant?: "card" | "detail";
};

export function EventLikeButton({
  eventId,
  initialCount,
  variant = "card",
}: EventLikeButtonProps) {
  const [count, setCount] = useState(initialCount);
  const [reacted, setReacted] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [hasError, setHasError] = useState(false);

  async function registerInterest() {
    if (isPending || reacted) {
      return;
    }

    setIsPending(true);
    setHasError(false);

    try {
      const response = await fetch(`/api/events/${eventId}/like`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Could not register event interest");
      }

      const result = (await response.json()) as { count: number };
      setCount(result.count);
      setReacted(true);
    } catch {
      setHasError(true);
    } finally {
      setIsPending(false);
    }
  }

  const isDetail = variant === "detail";

  return (
    <button
      type="button"
      onClick={registerInterest}
      disabled={isPending || reacted}
      aria-pressed={reacted}
      aria-label={reacted ? "Interes registrado" : "Me interesa este evento"}
      title={hasError ? "No se pudo registrar. Intenta de nuevo." : "Me interesa"}
      className={
        isDetail
          ? "inline-flex h-12 items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-4 text-sm font-bold text-slate-700 transition hover:border-rose-300 hover:text-rose-600 disabled:cursor-default disabled:border-rose-200 disabled:text-rose-600"
          : "inline-flex h-9 min-w-14 items-center justify-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 text-xs font-bold text-slate-600 transition hover:border-rose-300 hover:text-rose-600 disabled:cursor-default disabled:border-rose-200 disabled:text-rose-600"
      }
    >
      <Heart
        className={isDetail ? "h-5 w-5" : "h-4 w-4"}
        fill={reacted ? "currentColor" : "none"}
        aria-hidden="true"
      />
      <span>{count}</span>
      {isDetail ? <span>interesados</span> : null}
    </button>
  );
}
