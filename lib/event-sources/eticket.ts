import { EventSource, type PrismaClient } from "@prisma/client";
import { load } from "cheerio";
import { syncEventSource } from "@/lib/event-sources/sync";
import type {
  EventSourceAdapter,
  ExternalEvent,
} from "@/lib/event-sources/types";

const LIST_URL = "https://www.eticket.mx/eventos.aspx?categoria=1";
const DETAIL_BASE_URL = "https://www.eticket.mx/masinformacion.aspx?idevento=";
const METRO_PATTERN =
  /jalisco|guadalajara|zapopan|tlaquepaque|tlajomulco|tonal[aá]|auditorio telmex|teatro diana|arena vfg|arena guadalajara|coliseo gnp/i;

type EticketJsonLd = {
  "@type"?: string;
  name?: string;
  description?: string;
  image?: string;
  url?: string;
  startDate?: string;
  eventStatus?: string;
  location?: {
    name?: string;
    address?: {
      addressLocality?: string;
      addressRegion?: string;
    };
  };
  performer?: {
    name?: string;
    image?: string;
  };
};

export const eticketAdapter: EventSourceAdapter = {
  name: "eTicket",
  source: EventSource.ETICKET,
  fetchEvents: fetchEticketEvents,
};

export async function syncEticketEvents(prisma: PrismaClient) {
  return syncEventSource(prisma, eticketAdapter);
}

export async function fetchEticketEvents(): Promise<ExternalEvent[]> {
  const listHtml = await fetchEticketHtml(LIST_URL);

  if (!METRO_PATTERN.test(normalizeText(listHtml))) {
    return [];
  }

  const ids = parseEventIds(listHtml);
  const details = await mapWithConcurrency(ids, 4, fetchEticketDetail);
  const now = new Date();

  return details
    .filter((event): event is ExternalEvent => event !== null)
    .filter((event) => event.eventDate > now);
}

export function parseEventIds(html: string) {
  return [
    ...new Set(
      [...html.matchAll(/masinformacion\.aspx\?idevento=(\d+)/giu)].map(
        (match) => match[1],
      ),
    ),
  ];
}

async function fetchEticketDetail(id: string): Promise<ExternalEvent | null> {
  const detailUrl = `${DETAIL_BASE_URL}${id}`;
  const html = await fetchEticketHtml(detailUrl);
  const detail = parseEticketDetail(html, id, detailUrl);

  if (!detail || !isMetroEvent(detail)) {
    return null;
  }

  return detail;
}

export function parseEticketDetail(
  html: string,
  externalId: string,
  fallbackUrl: string,
): ExternalEvent | null {
  const $ = load(html);
  const jsonLd = extractEventJsonLd($);

  if (!jsonLd || isCancelled(jsonLd.eventStatus)) {
    return null;
  }

  const title = cleanText(jsonLd.name);
  const eventDate = parseDate(jsonLd.startDate);
  const venueName = cleanText(jsonLd.location?.name);
  const city = normalizeCity(jsonLd.location?.address?.addressLocality);

  if (!title || !eventDate || !venueName || !city) {
    return null;
  }

  const performerName = cleanText(jsonLd.performer?.name);
  const performerImage = cleanText(jsonLd.performer?.image);

  return {
    externalId,
    title,
    description: cleanText(jsonLd.description) || null,
    eventDate,
    imageUrl: cleanText(jsonLd.image) || null,
    sourceUrl: cleanText(jsonLd.url) || fallbackUrl,
    venue: {
      name: venueName,
      city,
    },
    artists: performerName
      ? [{ name: performerName, imageUrl: performerImage || null }]
      : [],
  };
}

function extractEventJsonLd($: ReturnType<typeof load>) {
  for (const script of $("script[type='application/ld+json']").toArray()) {
    const raw = $(script).text();

    try {
      const parsed = JSON.parse(raw) as EticketJsonLd | EticketJsonLd[];
      const events = Array.isArray(parsed) ? parsed : [parsed];
      const event = events.find((item) => item["@type"] === "Event");

      if (event) {
        return event;
      }
    } catch {
      // Ignore unrelated malformed snippets.
    }
  }

  return null;
}

async function fetchEticketHtml(url: string) {
  const response = await fetch(url, {
    headers: {
      Accept: "text/html,application/xhtml+xml",
      "Accept-Language": "es-MX,es;q=0.9",
      "User-Agent":
        "ConciertosGDL/1.0 (+https://conciertos-gdl.vercel.app; event indexer)",
    },
    signal: AbortSignal.timeout(30_000),
  });

  if (!response.ok) {
    throw new Error(`eTicket request failed: ${response.status} ${response.statusText}`);
  }

  const buffer = await response.arrayBuffer();

  return new TextDecoder("iso-8859-1").decode(buffer);
}

function isMetroEvent(event: ExternalEvent) {
  return METRO_PATTERN.test(
    normalizeText(`${event.venue.name} ${event.venue.city} ${event.description ?? ""}`),
  );
}

function parseDate(value?: string | null) {
  const cleaned = cleanText(value);
  const parsed = cleaned ? new Date(cleaned) : null;

  return parsed && !Number.isNaN(parsed.getTime()) ? parsed : null;
}

function normalizeCity(value?: string | null) {
  const normalized = normalizeText(value);

  if (normalized.includes("zapopan")) return "Zapopan";
  if (normalized.includes("tlaquepaque")) return "San Pedro Tlaquepaque";
  if (normalized.includes("tlajomulco")) return "Tlajomulco de Zuniga";
  if (normalized.includes("tonala")) return "Tonala";
  if (normalized.includes("guadalajara")) return "Guadalajara";

  return null;
}

function isCancelled(value?: string | null) {
  return normalizeText(value).includes("eventcancelled");
}

function cleanText(value?: string | null) {
  return value?.replace(/\s+/g, " ").trim() ?? "";
}

function normalizeText(value?: string | null) {
  return cleanText(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  mapper: (item: T) => Promise<R>,
) {
  const results: R[] = [];

  for (let index = 0; index < items.length; index += concurrency) {
    results.push(
      ...(await Promise.all(items.slice(index, index + concurrency).map(mapper))),
    );
  }

  return results;
}
