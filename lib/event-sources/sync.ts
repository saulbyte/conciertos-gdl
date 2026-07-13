import {
  EventObservationType,
  Prisma,
  type EventSource,
  type PrismaClient,
} from "@prisma/client";
import type {
  EventSourceAdapter,
  EventSourceSyncResult,
  ExternalEvent,
} from "@/lib/event-sources/types";
import { classifyAdmission } from "@/lib/event-sources/admission";
import { sanitizePriceRange } from "@/lib/event-sources/pricing";
import { recordSourceObservation } from "@/lib/event-observations";
import { persistEventTags } from "@/lib/event-tags";
import { notifyArtistSubscribersOfNewEvent } from "@/lib/notifications";

type EventEnrichmentData = {
  priceMin: Prisma.Decimal | null;
  priceMax: Prisma.Decimal | null;
  currency: string | null;
  availabilityStatus: string | null;
};

export async function syncEventSource(
  prisma: PrismaClient,
  adapter: EventSourceAdapter,
): Promise<EventSourceSyncResult> {
  const events = await adapter.fetchEvents();
  let created = 0;
  let updated = 0;
  let duplicates = 0;
  let observed = 0;

  for (const event of events) {
    const existing = await prisma.event.findUnique({
      where: {
        source_externalId: {
          source: adapter.source,
          externalId: event.externalId,
        },
      },
      select: { id: true },
    });

    if (!existing) {
      const duplicate = await findCrossSourceDuplicate(
        prisma,
        adapter.source,
        event,
      );

      if (duplicate) {
        const admissionType = classifyEventAdmission(event);
        const enrichmentData = buildEventEnrichmentData(event);

        if (
          admissionType === "FREE" ||
          enrichmentData.priceMin ||
          enrichmentData.priceMax ||
          enrichmentData.availabilityStatus
        ) {
          await prisma.event.update({
            where: { id: duplicate.id },
            data: {
              ...(admissionType === "FREE" ? { admissionType } : {}),
              ...enrichmentData,
              lastObservedAt: new Date(),
            },
          });
        }

        await recordSourceObservation(prisma, {
          eventId: duplicate.id,
          source: adapter.source,
          type: EventObservationType.SOURCE_DUPLICATE,
          event,
          duplicateEventId: duplicate.id,
        });
        observed += 1;
        duplicates += 1;
        continue;
      }
    }

    if (existing) {
      const updatedEvent = await persistEvent(prisma, adapter.source, event);
      await recordSourceObservation(prisma, {
        eventId: updatedEvent.id,
        source: adapter.source,
        type: EventObservationType.SOURCE_UPDATED,
        event,
      });
      observed += 1;
      updated += 1;
    } else {
      const createdEvent = await persistEvent(prisma, adapter.source, event);
      await recordSourceObservation(prisma, {
        eventId: createdEvent.id,
        source: adapter.source,
        type: EventObservationType.SOURCE_CREATED,
        event,
      });
      observed += 1;
      await notifyArtistSubscribersOfNewEvent(prisma, createdEvent.id);
      created += 1;
    }
  }

  return {
    source: adapter.source,
    fetched: events.length,
    created,
    updated,
    duplicates,
    observed,
  };
}

async function persistEvent(
  prisma: PrismaClient,
  source: EventSource,
  event: ExternalEvent,
) {
  const admissionType = classifyEventAdmission(event);
  const venue = await prisma.venue.upsert({
    where: {
      name_city: event.venue,
    },
    create: event.venue,
    update: {},
  });

  const artistConnections = await Promise.all(
    event.artists.map(async (externalArtist) => {
      const artistName =
        typeof externalArtist === "string" ? externalArtist : externalArtist.name;
      const imageUrl =
        typeof externalArtist === "string" ? null : externalArtist.imageUrl ?? null;
      const artist = await prisma.artist.upsert({
        where: { name: artistName },
        create: { name: artistName, imageUrl },
        update: imageUrl ? { imageUrl } : {},
      });

      return { artistId: artist.id };
    }),
  );
  const enrichmentData = buildEventEnrichmentData(event);

  const savedEvent = await prisma.event.upsert({
    where: {
      source_externalId: {
        source,
        externalId: event.externalId,
      },
    },
    create: {
      externalId: event.externalId,
      title: event.title,
      description: event.description,
      eventDate: event.eventDate,
      imageUrl: event.imageUrl,
      source,
      sourceUrl: event.sourceUrl,
      admissionType,
      ...enrichmentData,
      lastObservedAt: new Date(),
      venueId: venue.id,
      artists: {
        create: artistConnections,
      },
    },
    update: {
      title: event.title,
      description: event.description,
      eventDate: event.eventDate,
      imageUrl: event.imageUrl,
      sourceUrl: event.sourceUrl,
      admissionType,
      ...enrichmentData,
      lastObservedAt: new Date(),
      venueId: venue.id,
      artists: {
        deleteMany: {},
        create: artistConnections,
      },
    },
  });

  await persistEventTags(prisma, {
    eventId: savedEvent.id,
    artistIds: artistConnections.map((connection) => connection.artistId),
    source,
    event,
  });

  return savedEvent;
}

function buildEventEnrichmentData(event: ExternalEvent): EventEnrichmentData {
  const pricing = sanitizePriceRange({
    priceMin: event.priceMin,
    priceMax: event.priceMax,
    currency: event.currency,
  });

  return {
    priceMin: toDecimal(pricing.priceMin),
    priceMax: toDecimal(pricing.priceMax),
    currency: pricing.currency ?? null,
    availabilityStatus: event.availabilityStatus ?? null,
  };
}

function classifyEventAdmission(event: ExternalEvent) {
  const pricing = sanitizePriceRange({
    priceMin: event.priceMin,
    priceMax: event.priceMax,
    currency: event.currency,
  });

  if (pricing.admissionType === "FREE") {
    return "FREE";
  }

  if (pricing.admissionType === "PAID") {
    return "PAID";
  }

  return classifyAdmission(event.title, event.description);
}

function toDecimal(value?: number | null) {
  return typeof value === "number" && Number.isFinite(value)
    ? new Prisma.Decimal(value)
    : null;
}

async function findCrossSourceDuplicate(
  prisma: PrismaClient,
  source: EventSource,
  event: ExternalEvent,
) {
  const dayStart = new Date(event.eventDate);
  dayStart.setUTCDate(dayStart.getUTCDate() - 1);
  const dayEnd = new Date(dayStart);
  dayEnd.setUTCDate(dayEnd.getUTCDate() + 3);

  const candidates = await prisma.event.findMany({
    where: {
      source: { not: source },
      eventDate: {
        gte: dayStart,
        lt: dayEnd,
      },
    },
    select: {
      id: true,
      title: true,
      eventDate: true,
      venue: { select: { name: true } },
    },
  });

  const title = normalizeName(event.title);
  const venue = normalizeVenueName(event.venue.name);
  const localDate = getMexicoCityDateKey(event.eventDate);

  return candidates.find(
    (candidate) =>
      normalizeName(candidate.title) === title &&
      normalizeVenueName(candidate.venue.name) === venue &&
      getMexicoCityDateKey(candidate.eventDate) === localDate,
  );
}

function normalizeVenueName(value: string) {
  return normalizeName(value).replace(/\s+(?:gdl|guadalajara)$/u, "");
}

function normalizeName(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " y ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function getMexicoCityDateKey(date: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "America/Mexico_City",
  }).format(date);
}
