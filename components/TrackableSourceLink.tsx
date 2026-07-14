"use client";

import type { ReactNode } from "react";
import {
  trackEventInteraction,
  type PersonalizationEvent,
} from "@/lib/personalization-client";

type TrackableSourceLinkProps = {
  href: string;
  event: PersonalizationEvent;
  className: string;
  children: ReactNode;
};

export function TrackableSourceLink({
  href,
  event,
  className,
  children,
}: TrackableSourceLinkProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className={className}
      onClick={() => trackEventInteraction("SOURCE_OPEN", event)}
    >
      {children}
    </a>
  );
}
