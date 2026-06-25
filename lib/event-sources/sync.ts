import type { EventSource, PrismaClient } from "@prisma/client";
import type {
  EventSourceAdapter,
  EventSourceSyncResult,
  ExternalEvent,
} from "@/lib/event-sources/types";
import { classifyAdmission } from "@/lib/event-sources/admission";
import { notifyArtistSubscribersOfNewEvent } from "@/lib/notifications";

export async function syncEventSource(
  prisma: PrismaClient,
  adapter: EventSourceAdapter,
): Promise<EventSourceSyncResult> {
  const events = await adapter.fetchEvents();
  let created = 0;
  let updated = 0;
  let duplicates = 0;

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
        if (
          classifyAdmission(event.title, event.description) === "FREE"
        ) {
          await prisma.event.update({
            where: { id: duplicate.id },
            data: { admissionType: "FREE" },
          });
        }

        duplicates += 1;
        continue;
      }
    }

    if (existing) {
      await persistEvent(prisma, adapter.source, event);
      updated += 1;
    } else {
      const createdEvent = await persistEvent(prisma, adapter.source, event);
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
  };
}

async function persistEvent(
  prisma: PrismaClient,
  source: EventSource,
  event: ExternalEvent,
) {
  const admissionType = classifyAdmission(event.title, event.description);
  const venue = await prisma.venue.upsert({
    where: {
      name_city: event.venue,
    },
    create: event.venue,
    update: {},
  });

  const artistConnections = await Promise.all(
    event.artists.map(async (artistName) => {
      const artist = await prisma.artist.upsert({
        where: { name: artistName },
        create: { name: artistName },
        update: {},
      });

      return { artistId: artist.id };
    }),
  );

  return prisma.event.upsert({
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
      venueId: venue.id,
      artists: {
        deleteMany: {},
        create: artistConnections,
      },
    },
  });
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
