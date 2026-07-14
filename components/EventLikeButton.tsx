"use client";

import { type MouseEvent, useEffect, useState, useSyncExternalStore } from "react";
import { Heart } from "lucide-react";
import {
  trackEventInteraction,
  type PersonalizationEvent,
} from "@/lib/personalization-client";

type EventLikeButtonProps = {
  eventId: string;
  initialCount: number;
  variant?: "card" | "detail" | "discovery" | "darkCard";
  trackingEvent?: PersonalizationEvent;
};

const LIKE_SYNC_EVENT = "revera:event-liked";

export function EventLikeButton({
  eventId,
  initialCount,
  variant = "card",
  trackingEvent,
}: EventLikeButtonProps) {
  const storageKey = `revera:event-like:${eventId}`;
  const previousBrandStorageKey = `la-cartelera:event-like:${eventId}`;
  const legacyStorageKey = `${["donde", "toca"].join("-")}:event-like:${eventId}`;
  const [count, setCount] = useState(initialCount);
  const reacted = useSyncExternalStore(
    (onStoreChange) => {
      function syncLikedEvent(event: Event) {
        const detail = (event as CustomEvent<{ eventId: string; count: number }>).detail;

        if (detail?.eventId === eventId) {
          onStoreChange();
        }
      }

      function syncStorage(event: StorageEvent) {
        if (
          event.key === storageKey ||
          event.key === previousBrandStorageKey ||
          event.key === legacyStorageKey
        ) {
          onStoreChange();
        }
      }

      window.addEventListener(LIKE_SYNC_EVENT, syncLikedEvent);
      window.addEventListener("storage", syncStorage);

      return () => {
        window.removeEventListener(LIKE_SYNC_EVENT, syncLikedEvent);
        window.removeEventListener("storage", syncStorage);
      };
    },
    () =>
      window.localStorage.getItem(storageKey) === "1" ||
      window.localStorage.getItem(previousBrandStorageKey) === "1" ||
      window.localStorage.getItem(legacyStorageKey) === "1",
    () => false,
  );
  const [isPending, setIsPending] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [justLiked, setJustLiked] = useState(false);

  useEffect(() => {
    const hasCurrentLike = window.localStorage.getItem(storageKey) === "1";
    const hasPreviousBrandLike =
      window.localStorage.getItem(previousBrandStorageKey) === "1";
    const hasLegacyLike = window.localStorage.getItem(legacyStorageKey) === "1";

    if (
      hasCurrentLike ||
      (!hasPreviousBrandLike && !hasLegacyLike)
    ) {
      return;
    }

    window.localStorage.setItem(storageKey, "1");
  }, [legacyStorageKey, previousBrandStorageKey, storageKey]);

  useEffect(() => {
    function syncLikedEvent(event: Event) {
      const detail = (event as CustomEvent<{ eventId: string; count: number }>).detail;

      if (detail?.eventId !== eventId) {
        return;
      }

      setCount(detail.count);
    }

    window.addEventListener(LIKE_SYNC_EVENT, syncLikedEvent);

    return () => {
      window.removeEventListener(LIKE_SYNC_EVENT, syncLikedEvent);
    };
  }, [eventId]);

  useEffect(() => {
    if (!justLiked) return;

    const timeout = window.setTimeout(() => setJustLiked(false), 760);
    return () => window.clearTimeout(timeout);
  }, [justLiked]);

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
      setJustLiked(true);
      if (trackingEvent) {
        trackEventInteraction("EVENT_LIKE", trackingEvent);
      }
      window.localStorage.setItem(storageKey, "1");
      window.localStorage.removeItem(previousBrandStorageKey);
      window.localStorage.removeItem(legacyStorageKey);
      window.dispatchEvent(
        new CustomEvent(LIKE_SYNC_EVENT, {
          detail: {
            eventId,
            count: result.count,
          },
        }),
      );
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
  const buttonClass = getButtonClass(variant, reacted);
  const iconClass = getIconClass(variant);

  return (
    <button
      type="button"
      onClick={registerInterest}
      disabled={isPending || reacted}
      aria-pressed={reacted}
      aria-label={reacted ? "Interes registrado" : "Me interesa este evento"}
      title={hasError ? "No se pudo registrar. Intenta de nuevo." : "Me interesa"}
      data-just-liked={justLiked ? "true" : undefined}
      className={buttonClass}
    >
      <span className="like-burst" aria-hidden="true">
        <span />
        <span />
        <span />
        <span />
      </span>
      <Heart
        className={iconClass}
        fill={isFilled ? "#ff304f" : "none"}
        color={isFilled ? "#ff304f" : "currentColor"}
        aria-hidden="true"
      />
      <span
        className={
          isDiscovery
            ? "leading-none"
            : isDetail || isDarkCard
              ? "leading-none"
              : "leading-none"
        }
      >
        {count}
      </span>
    </button>
  );
}

function getButtonClass(
  variant: EventLikeButtonProps["variant"],
  reacted: boolean,
) {
  const base =
    "like-button group relative isolate cursor-pointer select-none items-center justify-center overflow-visible font-black transition duration-200 active:scale-95 disabled:cursor-default";
  const reactedClass = reacted
    ? "text-[#ff304f]"
    : "text-[#f6f3ea] hover:text-[#ff304f]";

  if (variant === "discovery") {
    return `${base} ${reactedClass} flex h-14 min-w-14 flex-col gap-0.5 rounded-full bg-[#071018]/72 px-2 text-[11px] shadow-[0_10px_26px_rgba(0,0,0,0.35)] ring-1 ring-white/12 backdrop-blur-md hover:bg-[#ff304f]/14 hover:ring-[#ff304f]/45 disabled:bg-[#071018]/78 disabled:ring-[#ff304f]/35`;
  }

  if (variant === "darkCard") {
    return `${base} ${reactedClass} inline-flex h-10 min-w-12 gap-1 rounded-full bg-[#071018]/76 px-2.5 text-xs shadow-[0_8px_22px_rgba(0,0,0,0.32)] ring-1 ring-white/10 backdrop-blur-md hover:bg-[#ff304f]/12 hover:ring-[#ff304f]/40 disabled:bg-[#071018]/82 disabled:ring-[#ff304f]/30`;
  }

  if (variant === "detail") {
    return `${base} ${reactedClass} inline-flex h-12 min-w-16 gap-2 rounded-full bg-white/[0.045] px-3 text-sm ring-1 ring-white/10 hover:bg-[#ff304f]/12 hover:ring-[#ff304f]/40 disabled:bg-[#ff304f]/10 disabled:ring-[#ff304f]/28`;
  }

  return `${base} ${reactedClass} inline-flex h-10 min-w-14 gap-1.5 rounded-full bg-[#071018]/76 px-2.5 text-xs shadow-[0_8px_22px_rgba(0,0,0,0.28)] ring-1 ring-white/10 backdrop-blur-md hover:bg-[#ff304f]/12 hover:ring-[#ff304f]/40 disabled:bg-[#071018]/82 disabled:ring-[#ff304f]/30`;
}

function getIconClass(variant: EventLikeButtonProps["variant"]) {
  if (variant === "discovery") {
    return "like-heart h-6 w-6 drop-shadow-[0_0_10px_rgba(255,48,79,0.18)]";
  }

  if (variant === "detail") {
    return "like-heart h-6 w-6 drop-shadow-[0_0_10px_rgba(255,48,79,0.18)]";
  }

  return "like-heart h-5 w-5 drop-shadow-[0_0_10px_rgba(255,48,79,0.18)]";
}
