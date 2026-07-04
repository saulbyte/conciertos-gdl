"use client";

import { ArrowUp } from "lucide-react";
import { useEffect, useState } from "react";

export function BackToTopButton() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const updateVisibility = () => {
      setIsVisible(window.scrollY > Math.max(600, window.innerHeight));
    };
    const initialCheck = window.setTimeout(updateVisibility, 0);

    window.addEventListener("scroll", updateVisibility, { passive: true });
    return () => {
      window.clearTimeout(initialCheck);
      window.removeEventListener("scroll", updateVisibility);
    };
  }, []);

  if (!isVisible) return null;

  return (
    <button
      data-back-to-top
      type="button"
      aria-label="Volver arriba"
      title="Volver arriba"
      className="fixed right-4 bottom-[calc(5rem+env(safe-area-inset-bottom))] z-40 flex h-11 w-11 items-center justify-center rounded-full bg-[#ff304f] text-white shadow-[0_10px_28px_rgba(255,48,79,0.28)] transition hover:bg-[#ff5d74] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff304f] md:hidden"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
    >
      <ArrowUp className="h-5 w-5" aria-hidden="true" />
    </button>
  );
}
