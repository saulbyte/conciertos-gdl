import { loadEnvConfig } from "@next/env";
import { persistEventTags } from "@/lib/event-tags";
import type { ExternalEvent } from "@/lib/event-sources/types";

loadEnvConfig(process.cwd());

async function main() {
  const { prisma } = await import("@/lib/prisma");
  await prisma.artistTag.deleteMany();
  await prisma.eventTag.deleteMany();
  await prisma.tag.deleteMany();

  const events = await prisma.event.findMany({
    include: {
      venue: true,
      artists: {
        include: {
          artist: true,
        },
      },
    },
    orderBy: {
      eventDate: "asc",
    },
  });
  let tagged = 0;

  for (const event of events) {
    const externalEvent: ExternalEvent = {
      externalId: event.externalId,
      title: event.title,
      description: event.description,
      eventDate: event.eventDate,
      imageUrl: event.imageUrl,
      sourceUrl: event.sourceUrl,
      priceMin: event.priceMin?.toNumber() ?? null,
      priceMax: event.priceMax?.toNumber() ?? null,
      currency: event.currency,
      availabilityStatus: event.availabilityStatus,
      venue: {
        name: event.venue.name,
        city: event.venue.city,
      },
      artists: event.artists.map(({ artist }) => ({
        name: artist.name,
        imageUrl: artist.imageUrl,
      })),
    };

    await persistEventTags(prisma, {
      eventId: event.id,
      artistIds: event.artists.map(({ artistId }) => artistId),
      source: event.source,
      event: externalEvent,
    });
    tagged += 1;
  }

  console.log(`Backfilled tags for ${tagged} events.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    const { prisma } = await import("@/lib/prisma");
    await prisma.$disconnect();
  });
