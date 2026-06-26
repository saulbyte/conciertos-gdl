import { AdmissionType, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { matchesFlexibleSearch } from "@/lib/search";

export type EventFilters = {
  query?: string;
  venue?: string;
  from?: string;
  to?: string;
  admission?: "free";
  when?: "weekend";
};

export type EventListItem = Awaited<ReturnType<typeof getEvents>>[number];
export type EventDetail = NonNullable<Awaited<ReturnType<typeof getEventById>>>;
export type DiscoveryEvent = EventListItem & {
  discoveryLabel: "Popular" | "Este fin" | "Recien anunciado" | "Para descubrir";
};
type EventSearchCandidate = Prisma.EventGetPayload<{
  include: {
    venue: true;
    artists: {
      include: {
        artist: true;
      };
    };
    _count: {
      select: { likes: true };
    };
  };
}>;

export async function getEvents(filters: EventFilters = {}) {
  const where = buildEventWhere(filters);
  const normalizedQuery = filters.query?.trim();

  const eventsFromDb = await prisma.event.findMany({
    where,
    orderBy: {
      eventDate: "asc",
    },
    include: {
      venue: true,
      artists: {
        include: {
          artist: true,
        },
      },
      _count: {
        select: { likes: true },
      },
    },
    take: normalizedQuery ? 1000 : 300,
  });
  const events = normalizedQuery
    ? eventsFromDb.filter((event) => eventMatchesQuery(event, normalizedQuery))
    : eventsFromDb;

  const popularEventIds = new Set(
    [...events]
      .filter((event) => event._count.likes >= 5)
      .sort((left, right) => right._count.likes - left._count.likes)
      .slice(0, 3)
      .map((event) => event.id),
  );

  return events.map(({ _count, ...event }) => ({
    ...event,
    likeCount: _count.likes,
    isPopular: popularEventIds.has(event.id),
  }));
}

export async function getEventById(id: string) {
  const event = await prisma.event.findUnique({
    where: { id },
    include: {
      venue: true,
      artists: {
        include: {
          artist: true,
        },
      },
      _count: {
        select: { likes: true },
      },
    },
  });

  if (!event) {
    return null;
  }

  const { _count, ...eventDetail } = event;

  return {
    ...eventDetail,
    likeCount: _count.likes,
  };
}

export async function getRelatedEvents(eventId: string, limit = 8) {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: {
      id: true,
      eventDate: true,
      venueId: true,
      artists: {
        select: {
          artistId: true,
        },
      },
    },
  });

  if (!event) {
    return [];
  }

  const artistIds = event.artists.map(({ artistId }) => artistId);
  const candidates = await prisma.event.findMany({
    where: {
      id: { not: event.id },
      eventDate: { gte: startOfToday() },
      OR: [
        artistIds.length > 0
          ? {
              artists: {
                some: {
                  artistId: {
                    in: artistIds,
                  },
                },
              },
            }
          : undefined,
        {
          venueId: event.venueId,
        },
      ].filter(Boolean) as Prisma.EventWhereInput[],
    },
    orderBy: {
      eventDate: "asc",
    },
    include: {
      venue: true,
      artists: {
        include: {
          artist: true,
        },
      },
      _count: {
        select: { likes: true },
      },
    },
    take: limit,
  });

  if (candidates.length < limit) {
    const fallback = await prisma.event.findMany({
      where: {
        id: {
          notIn: [event.id, ...candidates.map((candidate) => candidate.id)],
        },
        eventDate: { gte: startOfToday() },
      },
      orderBy: {
        eventDate: "asc",
      },
      include: {
        venue: true,
        artists: {
          include: {
            artist: true,
          },
        },
        _count: {
          select: { likes: true },
        },
      },
      take: limit - candidates.length,
    });

    candidates.push(...fallback);
  }

  const popularEventIds = new Set(
    [...candidates]
      .filter((candidate) => candidate._count.likes >= 5)
      .sort((left, right) => right._count.likes - left._count.likes)
      .slice(0, 3)
      .map((candidate) => candidate.id),
  );

  return candidates.map(({ _count, ...candidate }) => ({
    ...candidate,
    likeCount: _count.likes,
    isPopular: popularEventIds.has(candidate.id),
  }));
}

export async function getDiscoveryEvents(
  filters: Pick<EventFilters, "venue" | "admission" | "when"> = {},
  limit = 20,
): Promise<DiscoveryEvent[]> {
  const events = (await getEvents(filters)).filter(isDiscoveryCandidate);
  const weekend = getWeekendRange();
  const newThreshold = new Date();
  const dailySeed = getMexicoCityDateKey(new Date());
  newThreshold.setDate(newThreshold.getDate() - 10);

  const popular = [...events]
    .filter((event) => event.likeCount > 0)
    .sort(
      (left, right) =>
        right.likeCount - left.likeCount ||
        left.eventDate.getTime() - right.eventDate.getTime(),
    );
  const upcoming = [...events].sort(
    (left, right) => left.eventDate.getTime() - right.eventDate.getTime(),
  );
  const recent = [...events]
    .filter((event) => event.createdAt >= newThreshold)
    .sort(
      (left, right) =>
        left.eventDate.getTime() - right.eventDate.getTime() ||
        right.createdAt.getTime() - left.createdAt.getTime(),
    );
  const surprise = [...events].sort(
    (left, right) =>
      dailyOrder(left.id, dailySeed) - dailyOrder(right.id, dailySeed),
  );
  const selected: EventListItem[] = [];
  const selectedIds = new Set<string>();

  addUniqueEvents(selected, selectedIds, popular, Math.ceil(limit * 0.4));
  addUniqueEvents(selected, selectedIds, upcoming, Math.ceil(limit * 0.3));
  addUniqueEvents(selected, selectedIds, recent, Math.ceil(limit * 0.2));
  addUniqueEvents(selected, selectedIds, surprise, limit - selected.length);
  addUniqueEvents(selected, selectedIds, upcoming, limit - selected.length);

  const popularIds = new Set(popular.slice(0, 5).map((event) => event.id));

  return selected.slice(0, limit).map((event) => ({
    ...event,
    discoveryLabel: popularIds.has(event.id)
      ? "Popular"
      : event.eventDate >= weekend.from && event.eventDate <= weekend.to
        ? "Este fin"
        : event.createdAt >= newThreshold
          ? "Recien anunciado"
          : "Para descubrir",
  }));
}

export async function getVenueOptions() {
  return prisma.venue.findMany({
    orderBy: {
      name: "asc",
    },
    select: {
      id: true,
      name: true,
    },
  });
}

export async function getFreeEventCount() {
  return prisma.event.count({
    where: {
      admissionType: AdmissionType.FREE,
      eventDate: { gte: startOfToday() },
    },
  });
}

export async function getWeekendEventCount() {
  const weekend = getWeekendRange();

  return prisma.event.count({
    where: {
      eventDate: {
        gte: weekend.from,
        lte: weekend.to,
      },
    },
  });
}

function buildEventWhere(filters: EventFilters): Prisma.EventWhereInput {
  const where: Prisma.EventWhereInput = {
    eventDate: {
      gte: startOfToday(),
    },
  };

  if (filters.venue) {
    where.venueId = filters.venue;
  }

  if (filters.admission === "free") {
    where.admissionType = AdmissionType.FREE;
  }

  if (filters.when === "weekend") {
    const weekend = getWeekendRange();
    where.eventDate = {
      gte: weekend.from,
      lte: weekend.to,
    };
  }

  if (filters.from || filters.to) {
    where.eventDate = {
      gte: filters.from ? parseDate(filters.from) : startOfToday(),
      lte: filters.to ? endOfDate(filters.to) : undefined,
    };
  }

  return where;
}

function eventMatchesQuery(event: EventSearchCandidate, query: string) {
  return [
    event.title,
    event.description,
    event.venue.name,
    event.venue.city,
    ...event.artists.map(({ artist }) => artist.name),
  ].some((value) => value && matchesFlexibleSearch(value, query));
}

function startOfToday() {
  return parseDate(getMexicoCityDateKey(new Date())) as Date;
}

function parseDate(value: string) {
  const date = new Date(`${value}T00:00:00-06:00`);

  if (Number.isNaN(date.getTime())) {
    return undefined;
  }

  return date;
}

function endOfDate(value: string) {
  const date = new Date(`${value}T23:59:59.999-06:00`);

  if (Number.isNaN(date.getTime())) {
    return undefined;
  }

  return date;
}

function getWeekendRange(now = new Date()) {
  const localDate = getMexicoCityDateKey(now);
  const localMidnightUtc = new Date(`${localDate}T00:00:00Z`);
  const day = localMidnightUtc.getUTCDay();
  const daysToFriday =
    day === 5 ? 0 : day === 6 ? -1 : day === 0 ? -2 : 5 - day;

  localMidnightUtc.setUTCDate(localMidnightUtc.getUTCDate() + daysToFriday);
  const friday = formatUtcDateKey(localMidnightUtc);
  localMidnightUtc.setUTCDate(localMidnightUtc.getUTCDate() + 2);
  const sunday = formatUtcDateKey(localMidnightUtc);

  return {
    from: new Date(`${friday}T00:00:00-06:00`),
    to: new Date(`${sunday}T23:59:59.999-06:00`),
  };
}

function getMexicoCityDateKey(date: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "America/Mexico_City",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));

  return `${values.year}-${values.month}-${values.day}`;
}

function formatUtcDateKey(date: Date) {
  return [
    date.getUTCFullYear(),
    String(date.getUTCMonth() + 1).padStart(2, "0"),
    String(date.getUTCDate()).padStart(2, "0"),
  ].join("-");
}

function addUniqueEvents(
  target: EventListItem[],
  ids: Set<string>,
  source: EventListItem[],
  count: number,
) {
  let added = 0;

  for (const event of source) {
    if (added >= count) break;
    if (ids.has(event.id)) continue;

    target.push(event);
    ids.add(event.id);
    added += 1;
  }
}

function dailyOrder(value: string, seed: string) {
  let hash = 2166136261;

  for (const character of `${seed}:${value}`) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function isDiscoveryCandidate(event: EventListItem) {
  const title = event.title
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  return !title.includes("estacionamiento");
}
