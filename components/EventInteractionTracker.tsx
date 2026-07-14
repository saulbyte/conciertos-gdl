"use client";

import { useEffect, useRef } from "react";
import {
  trackEventInteraction,
  type PersonalizationEvent,
} from "@/lib/personalization-client";

type EventInteractionTrackerProps = {
  event: PersonalizationEvent;
  action?: "EVENT_VIEW" | "SOURCE_OPEN";
};

export function EventInteractionTracker({
  event,
  action = "EVENT_VIEW",
}: EventInteractionTrackerProps) {
  const tracked = useRef(false);

  useEffect(() => {
    if (tracked.current) return;

    tracked.current = true;
    trackEventInteraction(action, event);
  }, [action, event]);

  return null;
}
