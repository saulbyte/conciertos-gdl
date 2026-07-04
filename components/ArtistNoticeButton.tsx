"use client";

import { Bell } from "lucide-react";

export function ArtistNoticeButton() {
  function focusVisibleInput() {
    const inputs = Array.from(
      document.querySelectorAll<HTMLInputElement>("[data-artist-alert-input]"),
    );
    const visibleInput =
      inputs.find((input) => input.getClientRects().length > 0) ?? inputs[0];

    visibleInput?.scrollIntoView({ behavior: "smooth", block: "center" });
    window.setTimeout(() => visibleInput?.focus(), 250);
  }

  return (
    <button
      type="button"
      onClick={focusVisibleInput}
      className="inline-flex h-12 min-w-52 items-center justify-center gap-2 rounded-md bg-[#ff304f] px-5 text-sm font-black text-white shadow-lg shadow-black/30 transition hover:bg-[#ff5d74]"
    >
      <Bell className="h-4 w-4" aria-hidden="true" />
      Avisarme
    </button>
  );
}
