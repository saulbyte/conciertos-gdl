import { loadEnvConfig } from "@next/env";
import { EventSource } from "@prisma/client";
import {
  extractArtistFromTitle,
  normalizeDiscoveredEventTitle,
} from "../lib/discovery/normalize";

loadEnvConfig(process.cwd());

async function main() {
  const { prisma } = await import("../lib/prisma");

  const events = await prisma.event.findMany({
    where: {
      OR: [{ source: EventSource.DISCOVERED }, { title: { contains: "@" } }],
    },
    include: {
      venue: true,
      artists: {
        include: {
          artist: true,
        },
      },
    },
  });

  let updatedTitles = 0;
  let addedArtists = 0;
  let skipped = 0;

  for (const event of events) {
    const currentArtist = event.artists[0]?.artist.name;
    const extractedArtist = currentArtist ?? extractArtistFromTitle(event.title);
    const normalizedTitle = normalizeDiscoveredEventTitle({
      title: event.title,
      artistName: extractedArtist,
      venueName: event.venue.name,
    });

    if (!normalizedTitle) {
      skipped += 1;
      continue;
    }

    const updates: Promise<unknown>[] = [];

    if (event.title !== normalizedTitle) {
      updates.push(
        prisma.event.update({
          where: { id: event.id },
          data: { title: normalizedTitle },
        }),
      );
      updatedTitles += 1;
    }

    if (!currentArtist) {
      const artist = await prisma.artist.upsert({
        where: { name: normalizedTitle },
        create: { name: normalizedTitle, imageUrl: event.imageUrl },
        update: event.imageUrl ? { imageUrl: event.imageUrl } : {},
      });

      updates.push(
        prisma.eventArtist.upsert({
          where: {
            eventId_artistId: {
              eventId: event.id,
              artistId: artist.id,
            },
          },
          create: {
            eventId: event.id,
            artistId: artist.id,
          },
          update: {},
        }),
      );
      addedArtists += 1;
    }

    if (updates.length === 0) {
      skipped += 1;
      continue;
    }

    await Promise.all(updates);
    console.log(`Normalizado: ${event.title} -> ${normalizedTitle}`);
  }

  await prisma.$disconnect();

  console.log(
    `Listo. Revisados: ${events.length}. Titulos corregidos: ${updatedTitles}. Artistas vinculados: ${addedArtists}. Sin cambios: ${skipped}.`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
