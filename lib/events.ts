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

  return prisma.event.findMany({
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
    },
    take: 300,
  });
}

export async function getEventById(id: string) {
  return prisma.event.findUnique({
    where: { id },
    include: {
      venue: true,
      artists: {
        include: {
          artist: true,
        },
      },
    },
  });
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
