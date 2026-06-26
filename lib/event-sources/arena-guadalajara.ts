import { EventSource, type PrismaClient } from "@prisma/client";
import { syncEventSource } from "@/lib/event-sources/sync";
import type {
  EventSourceAdapter,
  ExternalEvent,
} from "@/lib/event-sources/types";

const API_BASE_URL = "https://api.arenamonterrey.com";
const CARTELERA_URL = "https://arenaguadalajara.com/cartelera";
const VENUE_NAME = "Arena Guadalajara";
const VENUE_CITY = "Guadalajara";
const LOCATION_GUADALAJARA = 3;
const PAGE_SIZE = 100;
const MUSIC_CATEGORY_IDS = [1, 2, 6, 7, 9, 10, 13, 14, 15, 17];

type ArenaEventDate = {
  date?: string | null;
  id?: number | string | null;
  link_to_tickets?: string | null;
  location_id?: number | null;
};

type ArenaEvent = {
  id?: number | string | null;
  title?: string | null;
  description?: string | null;
  active?: boolean | null;
  link_to_tickets?: string | null;
  square_banner_aws?: string | null;
  vertical_banner_aws?: string | null;
  banner_aws?: string | null;
  event_dates?: ArenaEventDate[] | null;
};

export const arenaGuadalajaraAdapter: EventSourceAdapter = {
  name: "Arena Guadalajara",
  source: EventSource.ARENA_GUADALAJARA,
  fetchEvents: fetchArenaGuadalajaraEvents,
};

export async function syncArenaGuadalajaraEvents(prisma: PrismaClient) {
  return syncEventSource(prisma, arenaGuadalajaraAdapter);
}

export async function fetchArenaGuadalajaraEvents(): Promise<ExternalEvent[]> {
  const eventsById = new Map<string, ArenaEvent>();

  for (const categoryId of MUSIC_CATEGORY_IDS) {
    const events = await fetchArenaEventsByCategory(categoryId);

    for (const event of events) {
      const id = cleanText(event.id);

      if (id && event.active !== false) {
        eventsById.set(id, event);
      }
    }
  }

  const now = new Date();

  return [...eventsById.values()]
    .flatMap(mapArenaEvent)
    .filter((event) => event.eventDate > now);
}

async function fetchArenaEventsByCategory(categoryId: number) {
  const params = new URLSearchParams({
    page: "1",
    zignia: "false",
    page_size: String(PAGE_SIZE),
    month_filter: "0",
    year_filter: "0",
    location: String(LOCATION_GUADALAJARA),
    category_filter: String(categoryId),
  });
  const response = await fetch(`${API_BASE_URL}/next_event_dates?${params}`, {
    headers: {
      Accept: "application/json",
      "User-Agent":
        "ConciertosGDL/1.0 (+https://conciertos-gdl.vercel.app; event indexer)",
    },
    signal: AbortSignal.timeout(30_000),
  });

  if (!response.ok) {
    throw new Error(
      `Arena Guadalajara request failed: ${response.status} ${response.statusText}`,
    );
  }

  return (await response.json()) as ArenaEvent[];
}

function mapArenaEvent(event: ArenaEvent): ExternalEvent[] {
  const eventId = cleanText(event.id);
  const title = cleanText(event.title);
  const dates = event.event_dates ?? [];

  if (!eventId || !title || dates.length === 0) {
    return [];
  }

  return dates
    .map((date): ExternalEvent | null => {
      const eventDate = parseArenaDate(date.date);

      if (date.location_id !== LOCATION_GUADALAJARA || !eventDate) {
        return null;
      }

      return {
        externalId: `${eventId}-${cleanText(date.id) || eventDate.toISOString()}`,
        title,
        description: cleanText(event.description) || null,
        eventDate,
        imageUrl: normalizeImageUrl(
          event.square_banner_aws || event.vertical_banner_aws || event.banner_aws,
        ),
        sourceUrl: cleanText(date.link_to_tickets) ||
          cleanText(event.link_to_tickets) ||
          CARTELERA_URL,
        venue: {
          name: VENUE_NAME,
          city: VENUE_CITY,
        },
        artists: [],
      } satisfies ExternalEvent;
    })
    .filter((item): item is ExternalEvent => item !== null);
}

function parseArenaDate(value?: string | null) {
  const cleaned = cleanText(value);

  if (!cleaned) {
    return null;
  }

  const parsed = new Date(cleaned);

  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function normalizeImageUrl(value?: string | null) {
  const cleaned = cleanText(value);

  if (!cleaned) {
    return null;
  }

  return cleaned.replace(/^http:\/\//i, "https://");
}

function cleanText(value?: string | number | null) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}
