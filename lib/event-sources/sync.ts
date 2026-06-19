import type { EventSource, PrismaClient } from "@prisma/client";
import type {
  EventSourceAdapter,
  EventSourceSyncResult,
  ExternalEvent,
} from "@/lib/event-sources/types";

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
        duplicates += 1;
        continue;
      }
    }

    await persistEvent(prisma, adapter.source, event);

    if (existing) {
      updated += 1;
    } else {
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

  await prisma.event.upsert({
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
  dayStart.setUTCHours(0, 0, 0, 0);
  const dayEnd = new Date(dayStart);
  dayEnd.setUTCDate(dayEnd.getUTCDate() + 1);

  return prisma.event.findFirst({
    where: {
      source: { not: source },
      title: {
        equals: event.title,
        mode: "insensitive",
      },
      eventDate: {
        gte: dayStart,
        lt: dayEnd,
      },
      venue: {
        name: {
          equals: event.venue.name,
          mode: "insensitive",
        },
      },
    },
    select: { id: true },
  });
}
