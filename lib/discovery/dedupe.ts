import type { PrismaClient } from "@prisma/client";
import type { CandidateInput } from "@/lib/discovery/types";

export async function findExistingEventDuplicate(
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
      artists: {
        select: {
          artist: {
            select: {
              name: true,
            },
          },
        },
      },
    },
  });

  const title = normalizeTitle(candidate.artistName ?? candidate.title);
  const venue = normalizeName(candidate.venueName ?? "");
  const city = normalizeName(candidate.city ?? "");
  const dateKey = getMexicoCityDateKey(candidate.eventDate);

  return (
    candidates.find((event) => {
      const eventNames = [
        event.title,
        ...event.artists.map((item) => item.artist.name),
      ];
      const eventVenue = normalizeName(event.venue.name);
      const eventCity = normalizeName(event.venue.city);
      const sameDate = getMexicoCityDateKey(event.eventDate) === dateKey;
      const sameVenue =
        venue.length > 0 &&
        (eventVenue === venue ||
          eventVenue.includes(venue) ||
          venue.includes(eventVenue));
      const sameCity =
        city.length === 0 ||
        eventCity === city ||
        eventCity.includes(city) ||
        city.includes(eventCity);
      const sameTitle = eventNames.some((name) =>
        namesLookLikeSameEvent(title, normalizeTitle(name)),
      );

      return sameDate && sameVenue && sameCity && sameTitle;
    }) ?? null
  );
}

export function namesLookLikeSameEvent(left: string, right: string) {
  if (!left || !right) {
    return false;
  }

  if (left === right || left.includes(right) || right.includes(left)) {
    return true;
  }

  const leftTokens = significantTokens(left);
  const rightTokens = significantTokens(right);

  if (leftTokens.length === 0 || rightTokens.length === 0) {
    return false;
  }

  const overlap = leftTokens.filter((token) => rightTokens.includes(token));
  const smaller = Math.min(leftTokens.length, rightTokens.length);
  const containment = overlap.length / smaller;

  return overlap.length >= 2 && containment >= 0.75;
}

export function normalizeTitle(value: string) {
  return normalizeName(value.split("@")[0] ?? value);
}

export function normalizeName(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " y ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function getMexicoCityDateKey(date: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "America/Mexico_City",
  }).format(date);
}

function significantTokens(value: string) {
  const stopwords = new Set([
    "a",
    "al",
    "and",
    "at",
    "de",
    "del",
    "el",
    "en",
    "la",
    "las",
    "le",
    "los",
    "the",
    "y",
  ]);

  return normalizeName(value)
    .split(" ")
    .filter((token) => token.length > 1 && !stopwords.has(token));
}
