import { EventSource, type PrismaClient } from "@prisma/client";
import { syncEventSource } from "@/lib/event-sources/sync";
import type {
  EventSourceAdapter,
  ExternalEvent,
} from "@/lib/event-sources/types";

type TicketmasterImage = {
  url?: string;
  width?: number;
  height?: number;
};

type TicketmasterVenue = {
  name?: string;
  city?: {
    name?: string;
  };
};

type TicketmasterAttraction = {
  name?: string;
  images?: TicketmasterImage[];
};

type TicketmasterEvent = {
  id?: string;
  name?: string;
  info?: string;
  pleaseNote?: string;
  url?: string;
  images?: TicketmasterImage[];
  dates?: {
    start?: {
      dateTime?: string;
      localDate?: string;
      localTime?: string;
    };
  };
  _embedded?: {
    venues?: TicketmasterVenue[];
    attractions?: TicketmasterAttraction[];
  };
};

type TicketmasterResponse = {
  _embedded?: {
    events?: TicketmasterEvent[];
  };
  page?: {
    totalPages?: number;
  };
};

type SyncTicketmasterOptions = {
  city?: string;
  countryCode?: string;
  latlong?: string;
  radius?: number;
  size?: number;
  unit?: "km" | "miles";
};

const TICKETMASTER_DISCOVERY_URL =
  "https://app.ticketmaster.com/discovery/v2/events.json";
const GUADALAJARA_METRO_CENTER = "20.6597,-103.3496";
const GUADALAJARA_METRO_RADIUS_KM = 45;
const MAX_TICKETMASTER_PAGES = 5;

export async function fetchTicketmasterEvents(
  options: SyncTicketmasterOptions = {},
): Promise<ExternalEvent[]> {
  const apiKey = process.env.TICKETMASTER_API_KEY;

  if (!apiKey) {
    throw new Error("Missing required env var: TICKETMASTER_API_KEY");
  }

  const firstPage = await fetchTicketmasterPage(apiKey, options, 0);
  const totalPages = Math.min(
    firstPage.page?.totalPages ?? 1,
    MAX_TICKETMASTER_PAGES,
  );
  const remainingPages = await Promise.all(
    Array.from({ length: Math.max(0, totalPages - 1) }, (_, index) =>
      fetchTicketmasterPage(apiKey, options, index + 1),
    ),
  );
  const events = [firstPage, ...remainingPages].flatMap(
    (payload) => payload._embedded?.events ?? [],
  );
  const normalizedEvents = events
    .map(normalizeTicketmasterEvent)
    .filter(
      (event): event is ExternalEvent => event !== null,
    );

  return [...new Map(normalizedEvents.map((event) => [event.externalId, event])).values()];
}

export async function syncTicketmasterEvents(
  prisma: PrismaClient,
  options: SyncTicketmasterOptions = {},
) {
  return syncEventSource(prisma, createTicketmasterAdapter(options));
}

export function createTicketmasterAdapter(
  options: SyncTicketmasterOptions = {},
): EventSourceAdapter {
  return {
    name: "Ticketmaster",
    source: EventSource.TICKETMASTER,
    fetchEvents: () => fetchTicketmasterEvents(options),
  };
}

function normalizeTicketmasterEvent(
  event: TicketmasterEvent,
): ExternalEvent | null {
  const externalId = event.id;
  const title = event.name;
  const rawDate =
    event.dates?.start?.dateTime ??
    buildDateTime(event.dates?.start?.localDate, event.dates?.start?.localTime);
  const venue = event._embedded?.venues?.[0];

  if (!externalId || !title || !rawDate || !venue?.name) {
    return null;
  }

  const eventDate = new Date(rawDate);

  if (Number.isNaN(eventDate.getTime())) {
    return null;
  }

  return {
    externalId,
    title,
    description: event.info ?? event.pleaseNote ?? null,
    eventDate,
    imageUrl: selectBestImage(event.images),
    sourceUrl: event.url ?? null,
    venue: {
      name: venue.name,
      city: venue.city?.name ?? "Guadalajara",
    },
    artists: normalizeArtists(event._embedded?.attractions),
  };
}

function buildDateTime(localDate?: string, localTime?: string) {
  if (!localDate) {
    return null;
  }

  return `${localDate}T${localTime ?? "00:00:00"}`;
}

function selectBestImage(images: TicketmasterImage[] = []) {
  const image = [...images].sort((left, right) => {
    const leftPixels = (left.width ?? 0) * (left.height ?? 0);
    const rightPixels = (right.width ?? 0) * (right.height ?? 0);

    return rightPixels - leftPixels;
  })[0];

  return image?.url ?? null;
}

function normalizeArtists(attractions: TicketmasterAttraction[] = []) {
  const artists = new Map<string, { name: string; imageUrl: string | null }>();

  for (const attraction of attractions) {
    const name = attraction.name?.trim();

    if (!name || artists.has(name)) {
      continue;
    }

    artists.set(name, {
      name,
      imageUrl: selectBestImage(attraction.images),
    });
  }

  return [...artists.values()];
}

async function fetchTicketmasterPage(
  apiKey: string,
  options: SyncTicketmasterOptions,
  page: number,
) {
  const params = new URLSearchParams({
    apikey: apiKey,
    countryCode: options.countryCode ?? "MX",
    classificationName: "music",
    sort: "date,asc",
    size: String(options.size ?? 200),
    page: String(page),
  });

  if (options.city) {
    params.set("city", options.city);
  } else {
    params.set("latlong", options.latlong ?? GUADALAJARA_METRO_CENTER);
    params.set("radius", String(options.radius ?? GUADALAJARA_METRO_RADIUS_KM));
    params.set("unit", options.unit ?? "km");
  }

  const response = await fetch(`${TICKETMASTER_DISCOVERY_URL}?${params}`);

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as {
      fault?: { faultstring?: string };
    } | null;
    const detail = payload?.fault?.faultstring;

    throw new Error(
      `Ticketmaster request failed: ${response.status} ${detail ?? response.statusText}`,
    );
  }

  return (await response.json()) as TicketmasterResponse;
}
