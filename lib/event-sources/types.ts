import type { EventSource } from "@prisma/client";

export type ExternalEvent = {
  externalId: string;
  title: string;
  description: string | null;
  eventDate: Date;
  imageUrl: string | null;
  sourceUrl: string | null;
  priceMin?: number | null;
  priceMax?: number | null;
  currency?: string | null;
  availabilityStatus?: string | null;
  venue: {
    name: string;
    city: string;
  };
  artists: ExternalArtist[];
};

export type ExternalArtist =
  | string
  | {
      name: string;
      imageUrl?: string | null;
    };

export type EventSourceAdapter = {
  name: string;
  source: EventSource;
  fetchEvents: () => Promise<ExternalEvent[]>;
};

export type EventSourceSyncResult = {
  source: EventSource;
  fetched: number;
  created: number;
  updated: number;
  duplicates: number;
  observed: number;
};
