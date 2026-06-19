import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type EventFilters = {
  query?: string;
  venue?: string;
  from?: string;
  to?: string;
};

export type EventListItem = Awaited<ReturnType<typeof getEvents>>[number];
export type EventDetail = NonNullable<Awaited<ReturnType<typeof getEventById>>>;

export async function getEvents(filters: EventFilters = {}) {
  const where = buildEventWhere(filters);

  const events = await prisma.event.findMany({
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
    take: 300,
  });

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

function buildEventWhere(filters: EventFilters): Prisma.EventWhereInput {
  const where: Prisma.EventWhereInput = {
    eventDate: {
      gte: startOfToday(),
    },
  };

  if (filters.query) {
    where.OR = [
      {
        title: {
          contains: filters.query,
          mode: "insensitive",
        },
      },
      {
        artists: {
          some: {
            artist: {
              name: {
                contains: filters.query,
                mode: "insensitive",
              },
            },
          },
        },
      },
    ];
  }

  if (filters.venue) {
    where.venueId = filters.venue;
  }

  if (filters.from || filters.to) {
    where.eventDate = {
      gte: filters.from ? parseDate(filters.from) : startOfToday(),
      lte: filters.to ? endOfDate(filters.to) : undefined,
    };
  }

  return where;
}

function startOfToday() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

function parseDate(value: string) {
  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return undefined;
  }

  return date;
}

function endOfDate(value: string) {
  const date = new Date(`${value}T23:59:59.999`);

  if (Number.isNaN(date.getTime())) {
    return undefined;
  }

  return date;
}
