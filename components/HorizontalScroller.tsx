"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRef } from "react";

type HorizontalScrollerProps = {
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
  label: string;
};

export function HorizontalScroller({
  children,
  className = "",
  contentClassName = "",
  label,
}: HorizontalScrollerProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);

  function scroll(direction: "left" | "right") {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    scroller.scrollBy({
      left: direction === "right" ? scroller.clientWidth * 0.8 : -scroller.clientWidth * 0.8,
      behavior: "smooth",
    });
  }

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        className="absolute left-1 top-1/2 z-10 hidden h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-white/12 bg-[#071018]/90 text-[#f6f3ea] shadow-lg shadow-black/30 backdrop-blur transition hover:border-[#00c2d1]/60 hover:text-[#00c2d1] md:flex sm:left-0 sm:h-9 sm:w-9"
        aria-label={`Desplazar ${label} a la izquierda`}
        onClick={() => scroll("left")}
      >
        <ChevronLeft className="h-5 w-5" aria-hidden="true" />
      </button>
      <div
        ref={scrollerRef}
        className={`no-scrollbar overflow-x-auto overscroll-x-contain scroll-smooth scroll-px-4 sm:scroll-px-6 lg:scroll-px-10 ${contentClassName}`}
      >
        {children}
      </div>
      <button
        type="button"
        className="absolute right-1 top-1/2 z-10 hidden h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-white/12 bg-[#071018]/90 text-[#f6f3ea] shadow-lg shadow-black/30 backdrop-blur transition hover:border-[#00c2d1]/60 hover:text-[#00c2d1] md:flex sm:right-0 sm:h-9 sm:w-9"
        aria-label={`Desplazar ${label} a la derecha`}
        onClick={() => scroll("right")}
      >
        <ChevronRight className="h-5 w-5" aria-hidden="true" />
      </button>
    </div>
  );
}
