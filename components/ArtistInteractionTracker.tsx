"use client";

import { useEffect, useRef } from "react";
import { trackArtistInteraction } from "@/lib/personalization-client";

type ArtistInteractionTrackerProps = {
  artistId: string;
};

export function ArtistInteractionTracker({ artistId }: ArtistInteractionTrackerProps) {
  const tracked = useRef(false);

  useEffect(() => {
    if (tracked.current) return;

    tracked.current = true;
    trackArtistInteraction("ARTIST_VIEW", artistId);
  }, [artistId]);

  return null;
}
