import { prisma } from "@/lib/prisma";

export type ArtistListItem = Awaited<ReturnType<typeof getArtists>>[number];
export type ArtistDetail = NonNullable<Awaited<ReturnType<typeof getArtistById>>>;

export async function getArtists() {
  const artists = await prisma.artist.findMany({
    where: {
      events: {
        some: {
          event: {
            eventDate: {
              gte: startOfToday(),
            },
          },
        },
      },
    },
    include: {
      _count: {
        select: {
          events: true,
          subscriptions: {
            where: { active: true },
          },
        },
      },
      events: {
        where: {
          event: {
            eventDate: {
              gte: startOfToday(),
            },
          },
        },
        orderBy: {
          event: {
            eventDate: "asc",
          },
        },
        take: 1,
        include: {
          event: {
            include: {
              venue: true,
              _count: {
                select: { likes: true },
              },
            },
          },
        },
      },
    },
  });

  return artists
    .map((artist) => {
      const nextEvent = artist.events[0]?.event ?? null;

      return {
        id: artist.id,
        name: artist.name,
        imageUrl: artist.imageUrl,
        createdAt: artist.createdAt,
        eventCount: artist._count.events,
        subscriberCount: artist._count.subscriptions,
        nextEvent: nextEvent
          ? {
              ...nextEvent,
              likeCount: nextEvent._count.likes,
            }
          : null,
      };
    })
    .sort((left, right) => {
      const leftDate = left.nextEvent?.eventDate.getTime() ?? Number.MAX_VALUE;
      const rightDate = right.nextEvent?.eventDate.getTime() ?? Number.MAX_VALUE;

      return (
        right.subscriberCount - left.subscriberCount ||
        leftDate - rightDate ||
        left.name.localeCompare(right.name)
      );
    });
}

export async function getArtistById(id: string) {
  const artist = await prisma.artist.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          subscriptions: {
            where: { active: true },
          },
        },
      },
      events: {
        where: {
          event: {
            eventDate: {
              gte: startOfToday(),
            },
          },
        },
        orderBy: {
          event: {
            eventDate: "asc",
          },
        },
        include: {
          event: {
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
          },
        },
      },
    },
  });

  if (!artist) {
    return null;
  }

  return {
    id: artist.id,
    name: artist.name,
    imageUrl: artist.imageUrl,
    createdAt: artist.createdAt,
    subscriberCount: artist._count.subscriptions,
    events: artist.events.map(({ event }) => {
      const { _count, ...eventData } = event;

      return {
        ...eventData,
        likeCount: _count.likes,
        isPopular: _count.likes >= 5,
      };
    }),
  };
}

function startOfToday() {
  const parts = new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "America/Mexico_City",
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));

  return new Date(`${values.year}-${values.month}-${values.day}T00:00:00-06:00`);
}
