"use client";

import { useState } from "react";
import { Music2 } from "lucide-react";

export const GENERIC_EVENT_IMAGE = "/images/concert-hero.png";

type EventArtworkProps = {
  src: string | null;
  alt?: string;
  className?: string;
  iconClassName?: string;
  loading?: "eager" | "lazy";
};

export function EventArtwork({
  src,
  alt = "",
  className = "h-full w-full object-cover",
  iconClassName = "h-12 w-12",
  loading = "lazy",
}: EventArtworkProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const [fallbackHasError, setFallbackHasError] = useState(false);

  const imageSrc =
    !src || failedSrc === src || isUnsuitableArtwork(src)
      ? GENERIC_EVENT_IMAGE
      : src;

  if (fallbackHasError) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(145deg,#071018,#0b1d26)] text-[#00c2d1]">
        <Music2 className={iconClassName} aria-hidden="true" />
      </div>
    );
  }

  return (
    // Hosts vary by source, so a native image is safer than a broad allowlist.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={imageSrc}
      alt={alt}
      className={className}
      loading={loading}
      decoding="async"
      onLoad={(event) => {
        if (event.currentTarget.naturalWidth === 0) {
          handleImageError();
        }
      }}
      onError={handleImageError}
    />
  );

  function handleImageError() {
    if (imageSrc === GENERIC_EVENT_IMAGE) {
      setFallbackHasError(true);
      return;
    }

    setFailedSrc(imageSrc);
  }
}

function isUnsuitableArtwork(src: string) {
  return src.includes("images.sk-static.com/images/media/profile_images/");
}
