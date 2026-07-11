import {
  EventObservationType,
  Prisma,
  type EventSource,
  type PrismaClient,
} from "@prisma/client";
import type { CandidateInput } from "@/lib/discovery/types";
import type { ExternalEvent } from "@/lib/event-sources/types";

type SourceObservationInput = {
  eventId?: string | null;
  source: EventSource;
  type: EventObservationType;
  event: ExternalEvent;
  duplicateEventId?: string | null;
};

type CandidateObservationInput = {
  candidateId?: string | null;
  importedEventId?: string | null;
  type: EventObservationType;
  candidate: CandidateInput;
};

export async function recordSourceObservation(
  prisma: PrismaClient,
  input: SourceObservationInput,
) {
  return prisma.eventObservation.create({
    data: {
      eventId: input.eventId ?? null,
      source: input.source,
      type: input.type,
      title: input.event.title,
      artistName: getPrimaryArtistName(input.event.artists),
      venueName: input.event.venue.name,
      city: input.event.venue.city,
      eventDate: input.event.eventDate,
      sourceUrl: input.event.sourceUrl,
      priceMin: toDecimal(input.event.priceMin),
      priceMax: toDecimal(input.event.priceMax),
      currency: input.event.currency ?? null,
      availabilityStatus: input.event.availabilityStatus ?? null,
      metadata: {
        externalId: input.event.externalId,
        duplicateEventId: input.duplicateEventId ?? null,
        artistCount: input.event.artists.length,
        hasImage: Boolean(input.event.imageUrl),
        hasDescription: Boolean(input.event.description),
      },
    },
  });
}

export async function recordCandidateObservation(
  prisma: PrismaClient,
  input: CandidateObservationInput,
) {
  return prisma.eventObservation.create({
    data: {
      candidateId: input.candidateId ?? null,
      eventId: input.importedEventId ?? null,
      source: "DISCOVERED",
      type: input.type,
      title: input.candidate.title,
      artistName: input.candidate.artistName,
      venueName: input.candidate.venueName,
      city: input.candidate.city,
      eventDate: input.candidate.eventDate,
      sourceUrl: input.candidate.sourceUrl,
      confidence: input.candidate.confidence,
      metadata: {
        sourceName: input.candidate.sourceName ?? null,
        admissionType: input.candidate.admissionType,
        hasImage: Boolean(input.candidate.imageUrl),
        hasDescription: Boolean(input.candidate.description),
      },
    },
  });
}

function getPrimaryArtistName(artists: ExternalEvent["artists"]) {
  const first = artists[0];

  if (!first) {
    return null;
  }

  return typeof first === "string" ? first : first.name;
}

function toDecimal(value?: number | null): Prisma.Decimal | null {
  return typeof value === "number" && Number.isFinite(value)
    ? new Prisma.Decimal(value)
    : null;
}
