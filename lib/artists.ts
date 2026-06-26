import { prisma } from "@/lib/prisma";

export type ArtistListItem = Awaited<ReturnType<typeof getArtists>>[number];
export type ArtistDetail = NonNullable<Awaited<ReturnType<typeof getArtistById>>>;
export type ArtistSortMode = "popular" | "upcoming" | "all" | "az";

export async function getArtists(query?: string, mode: ArtistSortMode = "popular") {
  const normalizedQuery = query?.trim();
  const today = startOfToday();
  const artists = await prisma.artist.findMany({
    where: {
      ...(normalizedQuery
        ? {
            name: {
              contains: normalizedQuery,
              mode: "insensitive",
            },
          }
        : {}),
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
        orderBy: {
          event: {
            eventDate: "asc",
          },
        },
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
      const upcomingEvents = artist.events.filter(
        ({ event }) => event.eventDate >= today,
      );
      const nextEvent = upcomingEvents[0]?.event ?? null;
      const fallbackImageUrl =
        [...artist.events].reverse().find(({ event }) => event.imageUrl)?.event
          .imageUrl ?? null;

      return {
        id: artist.id,
        name: artist.name,
        imageUrl: artist.imageUrl,
        fallbackImageUrl,
        createdAt: artist.createdAt,
        eventCount: upcomingEvents.length,
        subscriberCount: artist._count.subscriptions,
        nextEvent: nextEvent
          ? {
              ...nextEvent,
              likeCount: nextEvent._count.likes,
            }
          : null,
      };
    })
    .filter((artist) => (mode === "upcoming" ? artist.eventCount > 0 : true))
    .sort((left, right) => {
      const leftDate = left.nextEvent?.eventDate.getTime() ?? Number.MAX_VALUE;
      const rightDate = right.nextEvent?.eventDate.getTime() ?? Number.MAX_VALUE;

      if (mode === "az") {
        return left.name.localeCompare(right.name);
      }

      if (mode === "upcoming") {
        return (
          leftDate - rightDate ||
          right.subscriberCount - left.subscriberCount ||
          left.name.localeCompare(right.name)
        );
      }

      if (mode === "all") {
        return (
          leftDate - rightDate ||
          left.name.localeCompare(right.name)
        );
      }

      return (
        right.subscriberCount - left.subscriberCount ||
        right.eventCount - left.eventCount ||
        leftDate - rightDate ||
        left.name.localeCompare(right.name)
      );
    });
}

export async function getArtistById(id: string) {
  const [artist, latestEventWithImage] = await Promise.all([
    prisma.artist.findUnique({
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
    }),
    prisma.eventArtist.findFirst({
      where: {
        artistId: id,
        event: {
          imageUrl: {
            not: null,
          },
        },
      },
      orderBy: {
        event: {
          eventDate: "desc",
        },
      },
      include: {
        event: true,
      },
    }),
  ]);

  if (!artist) {
    return null;
  }

  return {
    id: artist.id,
    name: artist.name,
    imageUrl: artist.imageUrl,
    fallbackImageUrl: latestEventWithImage?.event.imageUrl ?? null,
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
