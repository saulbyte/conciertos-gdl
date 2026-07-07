"use client";

import { type MouseEvent, useState } from "react";
import { Heart } from "lucide-react";

type EventLikeButtonProps = {
  eventId: string;
  initialCount: number;
  variant?: "card" | "detail" | "discovery" | "darkCard";
};

export function EventLikeButton({
  eventId,
  initialCount,
  variant = "card",
}: EventLikeButtonProps) {
  const storageKey = `la-cartelera:event-like:${eventId}`;
  const legacyStorageKey = `${["donde", "toca"].join("-")}:event-like:${eventId}`;
  const [count, setCount] = useState(initialCount);
  const [reacted, setReacted] = useState(
    () =>
      typeof window !== "undefined" &&
      (window.localStorage.getItem(storageKey) === "1" ||
        window.localStorage.getItem(legacyStorageKey) === "1"),
  );
  const [isPending, setIsPending] = useState(false);
  const [hasError, setHasError] = useState(false);

  async function registerInterest(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();

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
      window.localStorage.setItem(storageKey, "1");
      window.localStorage.removeItem(legacyStorageKey);
    } catch {
      setHasError(true);
    } finally {
      setIsPending(false);
    }
  }

  const isDetail = variant === "detail";
  const isDiscovery = variant === "discovery";
  const isDarkCard = variant === "darkCard";
  const isFilled = reacted;

  return (
    <button
      type="button"
      onClick={registerInterest}
      disabled={isPending || reacted}
      aria-pressed={reacted}
      aria-label={reacted ? "Interes registrado" : "Me interesa este evento"}
      title={hasError ? "No se pudo registrar. Intenta de nuevo." : "Me interesa"}
      className={
        isDiscovery
          ? "flex h-12 min-w-12 cursor-pointer flex-col items-center justify-center gap-0.5 rounded-full bg-black/25 px-2 text-[11px] font-black text-white shadow-lg shadow-black/30 backdrop-blur transition hover:bg-black/40 hover:text-[#ff8a9b] disabled:cursor-default disabled:text-[#ff304f]"
          : isDarkCard
          ? "inline-flex h-9 min-w-10 cursor-pointer items-center justify-center gap-1 bg-transparent px-1 text-xs font-black text-[#ff8a9b] transition hover:text-[#ff304f] disabled:cursor-default disabled:text-[#ff304f]"
          : isDetail
          ? "inline-flex h-12 cursor-pointer items-center justify-center gap-2 bg-transparent px-1 text-sm font-black text-[#ff8a9b] transition hover:text-[#ff304f] disabled:cursor-default disabled:text-[#ff304f]"
          : "inline-flex h-9 min-w-14 items-center justify-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 text-xs font-bold text-slate-600 transition hover:border-rose-300 hover:text-rose-600 disabled:cursor-default disabled:border-rose-200 disabled:text-rose-600"
      }
    >
      <Heart
        className={
          isDetail || isDiscovery
            ? "h-5 w-5"
            : isDarkCard
              ? "h-5 w-5"
              : "h-4 w-4"
        }
        fill={isFilled ? "#ff304f" : "none"}
        color={isFilled ? "#ff304f" : "currentColor"}
        aria-hidden="true"
      />
      <span>{count}</span>
    </button>
  );
}
