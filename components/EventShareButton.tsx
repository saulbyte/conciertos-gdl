"use client";

import { Check, Share2 } from "lucide-react";
import { useState } from "react";

type EventShareButtonProps = {
  title: string;
  path: string;
  variant?: "floating" | "detail" | "compact";
};

export function EventShareButton({
  title,
  path,
  variant = "floating",
}: EventShareButtonProps) {
  const [copied, setCopied] = useState(false);

  async function shareEvent() {
    const url = new URL(path, window.location.origin).toString();

    try {
      if (navigator.share) {
        await navigator.share({ title, url });
        return;
      }

      await navigator.clipboard.writeText(url);
      setCopied(true);
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
      className={
        variant === "detail"
          ? "inline-flex h-12 items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-4 text-sm font-bold text-slate-700 transition hover:border-violet-300 hover:text-violet-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600"
          : variant === "compact"
            ? "inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white shadow-lg backdrop-blur transition hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            : "flex h-12 w-12 items-center justify-center rounded-full border border-white/25 bg-black/35 text-white shadow-lg backdrop-blur transition hover:bg-black/55 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
      }
    >
      {copied ? (
        <Check className="h-5 w-5" aria-hidden="true" />
      ) : (
        <Share2 className="h-5 w-5" aria-hidden="true" />
      )}
      {variant === "detail" ? (
        <span>{copied ? "Copiado" : "Compartir"}</span>
      ) : null}
    </button>
  );
}
