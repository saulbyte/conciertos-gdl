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
          ? "inline-flex h-12 cursor-pointer items-center justify-center gap-2 rounded-md bg-white/[0.035] px-4 text-sm font-black text-[#f6f3ea] transition hover:bg-white/[0.055] hover:text-[#00c2d1] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00c2d1]"
          : variant === "compact"
            ? "inline-flex h-10 w-10 cursor-pointer items-center justify-center bg-transparent text-white transition hover:text-[#00c2d1] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            : "flex h-12 w-12 cursor-pointer items-center justify-center bg-transparent text-white transition hover:text-[#00c2d1] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
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
