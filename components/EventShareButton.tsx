"use client";

import { Check, Share2 } from "lucide-react";
import { useState } from "react";
import {
  trackEventInteraction,
  type PersonalizationEvent,
} from "@/lib/personalization-client";

type EventShareButtonProps = {
  title: string;
  path: string;
  variant?: "floating" | "detail" | "compact";
  trackingEvent?: PersonalizationEvent;
};

export function EventShareButton({
  title,
  path,
  variant = "floating",
  trackingEvent,
}: EventShareButtonProps) {
  const [copied, setCopied] = useState(false);

  async function shareEvent() {
    const url = new URL(path, window.location.origin).toString();

    try {
      if (navigator.share) {
        await navigator.share({ title, url });
        if (trackingEvent) {
          trackEventInteraction("EVENT_SHARE", trackingEvent);
        }
        return;
      }

      await navigator.clipboard.writeText(url);
      setCopied(true);
      if (trackingEvent) {
        trackEventInteraction("EVENT_SHARE", trackingEvent);
      }
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // Closing the native share dialog is an expected no-op.
    }
  }

  return (
    <button
      type="button"
      onClick={shareEvent}
      aria-label={copied ? "Enlace copiado" : "Compartir evento"}
      title={copied ? "Enlace copiado" : "Compartir"}
      data-just-liked={copied ? "true" : undefined}
      className={getShareButtonClass(variant)}
    >
      <span className="like-burst" aria-hidden="true">
        <span />
        <span />
        <span />
        <span />
      </span>
      {copied ? (
        <Check className={getShareIconClass(variant)} aria-hidden="true" />
      ) : (
        <Share2 className={getShareIconClass(variant)} aria-hidden="true" />
      )}
      {variant === "detail" ? (
        <span>{copied ? "Copiado" : "Compartir"}</span>
      ) : null}
    </button>
  );
}

function getShareButtonClass(variant: EventShareButtonProps["variant"]) {
  const base =
    "like-button group relative isolate cursor-pointer select-none items-center justify-center overflow-visible font-black text-[#f6f3ea] transition duration-200 hover:text-[#ff304f] active:scale-95";

  if (variant === "detail") {
    return `${base} inline-flex h-12 min-w-12 gap-2 rounded-full bg-white/[0.045] px-3 text-sm ring-1 ring-white/10 hover:bg-[#ff304f]/12 hover:ring-[#ff304f]/40`;
  }

  if (variant === "compact") {
    return `${base} inline-flex h-10 min-w-10 rounded-full bg-[#071018]/76 px-2.5 text-xs shadow-[0_8px_22px_rgba(0,0,0,0.32)] ring-1 ring-white/10 backdrop-blur-md hover:bg-[#ff304f]/12 hover:ring-[#ff304f]/40`;
  }

  return `${base} flex h-14 min-w-14 flex-col gap-0.5 rounded-full bg-[#071018]/72 px-2 text-[11px] shadow-[0_10px_26px_rgba(0,0,0,0.35)] ring-1 ring-white/12 backdrop-blur-md hover:bg-[#ff304f]/14 hover:ring-[#ff304f]/45`;
}

function getShareIconClass(variant: EventShareButtonProps["variant"]) {
  if (variant === "detail" || variant === "floating") {
    return "like-heart h-6 w-6 drop-shadow-[0_0_10px_rgba(255,48,79,0.18)]";
  }

  return "like-heart h-5 w-5 drop-shadow-[0_0_10px_rgba(255,48,79,0.18)]";
}
