import { EventCandidateStatus, EventSource, type PrismaClient } from "@prisma/client";
import type {
  CandidateInput,
  CandidateSummary,
  DiscoveryResult,
} from "@/lib/discovery/types";
import {
  getDiscoveryQueries,
  searchDiscoveryCandidates,
} from "@/lib/discovery/search";
import { extractCandidateFromResult } from "@/lib/discovery/extractor";

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

      if (!candidate || (await eventAlreadyExists(prisma, candidate))) {
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

  return {
    queries: queries.length,
    searchResults,
    extracted,
    created,
    updated,
    skipped,
  };
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

  if (!candidate.eventDate || !candidate.venueName) {
    throw new Error(
      "El candidato necesita fecha y recinto antes de importarse al catalogo.",
    );
  }

  const duplicate = await findExistingEventDuplicate(prisma, {
    title: candidate.title,
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
        name: candidate.venueName,
        city: candidate.city ?? "Guadalajara",
      },
    },
    create: {
      name: candidate.venueName,
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
      title: candidate.title,
      description: candidate.description,
      eventDate: candidate.eventDate,
      imageUrl: candidate.imageUrl,
      source: EventSource.DISCOVERED,
      sourceUrl: candidate.sourceUrl,
      admissionType: candidate.admissionType,
      venueId: venue.id,
    },
    update: {
      title: candidate.title,
      description: candidate.description,
      eventDate: candidate.eventDate,
      imageUrl: candidate.imageUrl,
      sourceUrl: candidate.sourceUrl,
      admissionType: candidate.admissionType,
      venueId: venue.id,
    },
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

async function eventAlreadyExists(prisma: PrismaClient, candidate: CandidateInput) {
  if (await findExistingEventDuplicate(prisma, candidate)) {
    return true;
  }

  return false;
}

async function findExistingEventDuplicate(
  prisma: PrismaClient,
  candidate: CandidateInput,
) {
  const exactSource = await prisma.event.findFirst({
    where: { sourceUrl: candidate.sourceUrl },
    select: { id: true },
  });

  if (exactSource) {
    return exactSource;
  }

  if (!candidate.eventDate) {
    return null;
  }

  const windowStart = new Date(candidate.eventDate);
  windowStart.setUTCDate(windowStart.getUTCDate() - 1);
  const windowEnd = new Date(candidate.eventDate);
  windowEnd.setUTCDate(windowEnd.getUTCDate() + 2);

  const candidates = await prisma.event.findMany({
    where: {
      eventDate: {
        gte: windowStart,
        lt: windowEnd,
      },
    },
    select: {
      id: true,
      title: true,
      eventDate: true,
      venue: {
        select: {
          name: true,
          city: true,
        },
      },
    },
  });

  const title = normalizeTitle(candidate.title);
  const venue = normalizeName(candidate.venueName ?? "");
  const city = normalizeName(candidate.city ?? "");
  const dateKey = getMexicoCityDateKey(candidate.eventDate);

  return candidates.find((event) => {
    const eventTitle = normalizeTitle(event.title);
    const eventVenue = normalizeName(event.venue.name);
    const eventCity = normalizeName(event.venue.city);
    const sameDate = getMexicoCityDateKey(event.eventDate) === dateKey;
    const sameVenue =
      venue.length > 0 &&
      (eventVenue === venue || eventVenue.includes(venue) || venue.includes(eventVenue));
    const sameCity =
      city.length === 0 ||
      eventCity === city ||
      eventCity.includes(city) ||
      city.includes(eventCity);
    const sameTitle =
      eventTitle === title ||
      eventTitle.includes(title) ||
      title.includes(eventTitle);

    return sameDate && sameVenue && sameCity && sameTitle;
  }) ?? null;
}

function normalizeTitle(value: string) {
  return normalizeName(value.split("@")[0] ?? value);
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
