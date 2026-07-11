import { EventCandidateStatus, EventSource, type PrismaClient } from "@prisma/client";
import type {
  CandidateInput,
  CandidateSummary,
  DiscoveryResult,
} from "@/lib/discovery/types";
import {
  getDiscoverySeedResults,
  getDiscoveryQueries,
  searchDiscoveryCandidates,
} from "@/lib/discovery/search";
import { extractCandidateFromResult } from "@/lib/discovery/extractor";
import { findExistingEventDuplicate } from "@/lib/discovery/dedupe";
import { normalizeDiscoveredEventData } from "@/lib/discovery/normalize";

export async function discoverEventCandidates(
  prisma: PrismaClient,
): Promise<DiscoveryResult> {
  const queries = getDiscoveryQueries();
  const seenUrls = new Set<string>();
  let searchResults = 0;
  let extracted = 0;
  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const query of queries) {
    const results = await searchDiscoveryCandidates(query);
    searchResults += results.length;

    for (const result of results) {
      if (seenUrls.has(result.url)) {
        skipped += 1;
        continue;
      }

      seenUrls.add(result.url);

      const candidate = await extractCandidateFromResult(result);

      if (!candidate || isPastCandidate(candidate)) {
        skipped += 1;
        continue;
      }

      if (await rejectExistingPendingDuplicate(prisma, candidate)) {
        skipped += 1;
        continue;
      }

      extracted += 1;

      const existing = await prisma.eventCandidate.findUnique({
        where: {
          sourceUrl_title: {
            sourceUrl: candidate.sourceUrl,
            title: candidate.title,
          },
        },
        select: { id: true },
      });

      await prisma.eventCandidate.upsert({
        where: {
          sourceUrl_title: {
            sourceUrl: candidate.sourceUrl,
            title: candidate.title,
          },
        },
        create: candidate,
        update: {
          artistName: candidate.artistName,
          description: candidate.description,
          eventDate: candidate.eventDate,
          imageUrl: candidate.imageUrl,
          sourceName: candidate.sourceName,
          venueName: candidate.venueName,
          city: candidate.city,
          admissionType: candidate.admissionType,
          confidence: candidate.confidence,
          rawText: candidate.rawText,
          status: EventCandidateStatus.PENDING,
          reviewedAt: null,
        },
      });

      if (existing) {
        updated += 1;
      } else {
        created += 1;
      }
    }
  }

  const seedResults = await getDiscoverySeedResults();
  searchResults += seedResults.length;

  for (const result of seedResults) {
    if (seenUrls.has(result.url)) {
      skipped += 1;
      continue;
    }

    seenUrls.add(result.url);

    const candidate = await extractCandidateFromResult(result);

    if (!candidate || isPastCandidate(candidate)) {
      skipped += 1;
      continue;
    }

    if (await rejectExistingPendingDuplicate(prisma, candidate)) {
      skipped += 1;
      continue;
    }

    extracted += 1;

    const existing = await prisma.eventCandidate.findUnique({
      where: {
        sourceUrl_title: {
          sourceUrl: candidate.sourceUrl,
          title: candidate.title,
        },
      },
      select: { id: true },
    });

    await prisma.eventCandidate.upsert({
      where: {
        sourceUrl_title: {
          sourceUrl: candidate.sourceUrl,
          title: candidate.title,
        },
      },
      create: candidate,
      update: {
        artistName: candidate.artistName,
        description: candidate.description,
        eventDate: candidate.eventDate,
        imageUrl: candidate.imageUrl,
        sourceName: candidate.sourceName,
        venueName: candidate.venueName,
        city: candidate.city,
        admissionType: candidate.admissionType,
        confidence: candidate.confidence,
        rawText: candidate.rawText,
        status: EventCandidateStatus.PENDING,
        reviewedAt: null,
      },
    });

    if (existing) {
      updated += 1;
    } else {
      created += 1;
    }
  }

  return {
    queries: queries.length,
    searchResults,
    extracted,
    created,
    updated,
    skipped,
  };
}

function isPastCandidate(candidate: CandidateInput) {
  if (!candidate.eventDate) {
    return false;
  }

  return candidate.eventDate < startOfMexicoCityDay(new Date());
}

export function startOfMexicoCityDay(date: Date) {
  const dateKey = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "America/Mexico_City",
  }).format(date);

  return new Date(`${dateKey}T00:00:00-06:00`);
}

export async function listEventCandidates(
  prisma: PrismaClient,
  status: EventCandidateStatus = EventCandidateStatus.PENDING,
): Promise<CandidateSummary[]> {
  return prisma.eventCandidate.findMany({
    where: { status },
    orderBy: [{ confidence: "desc" }, { createdAt: "desc" }],
    take: 50,
    select: {
      id: true,
      title: true,
      artistName: true,
      status: true,
      confidence: true,
      eventDate: true,
      venueName: true,
      city: true,
      sourceName: true,
      sourceUrl: true,
    },
  });
}

export async function rejectEventCandidate(prisma: PrismaClient, id: string) {
  return prisma.eventCandidate.update({
    where: { id },
    data: {
      status: EventCandidateStatus.REJECTED,
      reviewedAt: new Date(),
    },
  });
}

export async function importEventCandidate(prisma: PrismaClient, id: string) {
  const candidate = await prisma.eventCandidate.findUnique({
    where: { id },
  });

  if (!candidate) {
    throw new Error(`No existe el candidato ${id}.`);
  }

  if (!candidate.eventDate || !candidate.artistName) {
    throw new Error(
      "El candidato necesita fecha y artista antes de importarse al catalogo.",
    );
  }

  const normalized = normalizeDiscoveredEventData(candidate);

  if (!normalized.artistName) {
    throw new Error(
      "El candidato necesita un artista reconocible antes de importarse al catalogo.",
    );
  }

  const duplicate = await findExistingEventDuplicate(prisma, {
    title: normalized.title,
    artistName: normalized.artistName,
    description: candidate.description,
    eventDate: candidate.eventDate,
    imageUrl: candidate.imageUrl,
    sourceUrl: candidate.sourceUrl,
    sourceName: candidate.sourceName,
    venueName: candidate.venueName,
    city: candidate.city,
    admissionType: candidate.admissionType,
    confidence: candidate.confidence,
    rawText: candidate.rawText,
  });

  if (duplicate) {
    await prisma.eventCandidate.update({
      where: { id },
      data: {
        status: EventCandidateStatus.REJECTED,
        reviewedAt: new Date(),
      },
    });
    throw new Error(
      "Este candidato parece duplicado de un evento existente y fue rechazado.",
    );
  }

  const venue = await prisma.venue.upsert({
    where: {
      name_city: {
        name: candidate.venueName ?? "Por confirmar",
        city: candidate.city ?? "Guadalajara",
      },
    },
    create: {
      name: candidate.venueName ?? "Por confirmar",
      city: candidate.city ?? "Guadalajara",
    },
    update: {},
  });

  const event = await prisma.event.upsert({
    where: {
      source_externalId: {
        source: EventSource.DISCOVERED,
        externalId: candidate.id,
      },
    },
    create: {
      externalId: candidate.id,
      title: normalized.title,
      description: candidate.description,
      eventDate: candidate.eventDate,
      imageUrl: candidate.imageUrl,
      source: EventSource.DISCOVERED,
      sourceUrl: candidate.sourceUrl,
      admissionType: candidate.admissionType,
      venueId: venue.id,
    },
    update: {
      title: normalized.title,
      description: candidate.description,
      eventDate: candidate.eventDate,
      imageUrl: candidate.imageUrl,
      sourceUrl: candidate.sourceUrl,
      admissionType: candidate.admissionType,
      venueId: venue.id,
    },
  });

  const artist = await prisma.artist.upsert({
    where: { name: normalized.artistName },
    create: { name: normalized.artistName, imageUrl: candidate.imageUrl },
    update: candidate.imageUrl ? { imageUrl: candidate.imageUrl } : {},
  });

  await prisma.eventArtist.upsert({
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
  });

  await prisma.eventCandidate.update({
    where: { id },
    data: {
      status: EventCandidateStatus.IMPORTED,
      importedEventId: event.id,
      reviewedAt: new Date(),
    },
  });

  return event;
}

async function rejectExistingPendingDuplicate(
  prisma: PrismaClient,
  candidate: CandidateInput,
) {
  const duplicate = await findExistingEventDuplicate(prisma, candidate);

  if (!duplicate) {
    return false;
  }

  await prisma.eventCandidate.updateMany({
    where: {
      sourceUrl: candidate.sourceUrl,
      title: candidate.title,
      status: EventCandidateStatus.PENDING,
    },
    data: {
      status: EventCandidateStatus.REJECTED,
      reviewedAt: new Date(),
    },
  });

  return true;
}
