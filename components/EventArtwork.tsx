"use client";

import { useState } from "react";
import { Music2 } from "lucide-react";

type EventArtworkProps = {
  src: string | null;
  alt?: string;
  className?: string;
  iconClassName?: string;
};

export function EventArtwork({
  src,
  alt = "",
  className = "h-full w-full object-cover",
  iconClassName = "h-12 w-12",
}: EventArtworkProps) {
  const [hasError, setHasError] = useState(false);

  if (!src || hasError) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(145deg,#0f172a,#312e81)] text-violet-200">
        <Music2 className={iconClassName} aria-hidden="true" />
      </div>
    );
  }

  // Hosts vary by source, so a native image is safer than a broad allowlist.
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} className={className} onError={() => setHasError(true)} />;
}
