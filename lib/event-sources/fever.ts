import { EventSource, type PrismaClient } from "@prisma/client";
import { load } from "cheerio";
import { fetchHtml } from "@/lib/event-sources/http";
import { syncEventSource } from "@/lib/event-sources/sync";
import type {
  EventSourceAdapter,
  ExternalEvent,
} from "@/lib/event-sources/types";

const BASE_URL = "https://feverup.com";
const LIST_URL = `${BASE_URL}/es/guadalajara`;
const MAX_DETAIL_PAGES = 80;

const INCLUDE_TERMS = [
  "ballet",
  "candlelight",
  "concierto",
  "jazz",
  "musica",
  "musical",
  "orquesta",
  "piano",
  "tributo",
  "violin",
  "violonchelo",
];

const EXCLUDE_TERMS = [
  "aguascalientes",
  "cata",
  "comedia",
  "comedy",
  "food",
  "juego",
  "museo",
  "tarjeta regalo",
  "wine",
];

type FeverDetail = {
  planId: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  sourceUrl: string;
  venueName: string;
  city: string;
  dates: Date[];
};

export const feverAdapter: EventSourceAdapter = {
  name: "Fever",
  source: EventSource.FEVER,
  fetchEvents: fetchFeverEvents,
};

export async function syncFeverEvents(prisma: PrismaClient) {
  return syncEventSource(prisma, feverAdapter);
}

export async function fetchFeverEvents(): Promise<ExternalEvent[]> {
  const listingHtml = await fetchHtml(LIST_URL, 30_000);
  const links = parseFeverLinks(listingHtml).slice(0, MAX_DETAIL_PAGES);
  const details = await mapWithConcurrency(links, 4, fetchFeverDetail);
  const today = startOfMexicoCityDay(new Date());

  return details
    .filter((detail): detail is FeverDetail => detail !== null)
    .flatMap((detail) =>
      detail.dates
        .filter((date) => date >= today)
        .map((date) => ({
          externalId: `${detail.planId}-${formatIdDate(date)}`,
          title: detail.title,
          description: detail.description,
          eventDate: date,
          imageUrl: detail.imageUrl,
          sourceUrl: detail.sourceUrl,
          venue: {
            name: detail.venueName,
            city: detail.city,
          },
          artists: extractArtists(detail.title),
        })),
    );
}

export function parseFeverLinks(html: string) {
  return [
    ...new Set(
      [...html.matchAll(/href="([^"]*\/m\/\d+[^"]*)"/giu)]
        .map((match) => new URL(match[1], BASE_URL).toString())
        .map((url) => url.split("?")[0]),
    ),
  ];
}

async function fetchFeverDetail(sourceUrl: string): Promise<FeverDetail | null> {
  try {
    const html = await fetchHtml(sourceUrl, 30_000);
    const detail = parseFeverDetail(html, sourceUrl);

    if (!detail || !isRelevantExperience(detail)) {
      return null;
    }

    return detail;
  } catch (error) {
    console.warn(`Fever experience skipped: ${sourceUrl}`, error);
    return null;
  }
}

export function parseFeverDetail(
  html: string,
  sourceUrl: string,
): FeverDetail | null {
  const $ = load(html);
  const jsonText = $("script[type='application/ld+json']").first().text();
  const product = parseJsonRecord(jsonText);
  const source = new URL(sourceUrl);
  const planId =
    cleanText(stringValue(product?.sku)) ||
    source.pathname.split("/").filter(Boolean).pop();
  const title =
    cleanTitle(
      cleanText(stringValue(product?.name)) ||
        cleanText($("meta[property='og:title']").attr("content")),
    );
  const description =
    cleanText(stringValue(product?.description)) ||
    cleanText($("meta[name='description']").attr("content")) ||
    null;
  const imageUrl =
    imageValue(product?.image) ||
    cleanText($("meta[property='og:image']").attr("content")) ||
    null;
  const decodedHtml = decodeEmbeddedText(html);
  const searchableText = `${description ?? ""} ${decodedHtml}`;
  const venueName = extractVenueName(product, searchableText);
  const city = inferCity(product, searchableText);
  const dates = extractSessionDates(html);

  if (!planId || !title || !venueName || dates.length === 0) {
    return null;
  }

  return {
    planId,
    title,
    description,
    imageUrl,
    sourceUrl: source.toString(),
    venueName,
    city,
    dates,
  };
}

function parseJsonRecord(value: string) {
  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function imageValue(value: unknown) {
  if (typeof value === "string") {
    return value;
  }

  if (isRecord(value)) {
    return cleanText(stringValue(value.contentUrl)) || null;
  }

  return null;
}

function extractVenueName(product: Record<string, unknown> | null, text: string) {
  const offers = Array.isArray(product?.offers) ? product.offers : [];

  for (const offer of offers) {
    if (!isRecord(offer) || !isRecord(offer.areaServed)) {
      continue;
    }

    const name = cleanText(stringValue(offer.areaServed.name));

    if (name) {
      return name;
    }
  }

  return (
    cleanVenue(
      cleanText(
        text.match(/(?:Lugar|Ubicacion):\s*([^<\r\n]+)/iu)?.[1],
      ),
    ) ||
    "Por confirmar"
  );
}

function inferCity(product: Record<string, unknown> | null, text: string) {
  const offers = Array.isArray(product?.offers) ? product.offers : [];

  for (const offer of offers) {
    if (!isRecord(offer) || !isRecord(offer.areaServed)) {
      continue;
    }

    const address = isRecord(offer.areaServed.address)
      ? offer.areaServed.address
      : null;
    const city = cleanText(stringValue(address?.addressLocality));

    if (city) {
      return city;
    }
  }

  if (/zapopan/iu.test(text)) {
    return "Zapopan";
  }

  return "Guadalajara";
}

function extractSessionDates(html: string) {
  const values = [
    ...html.matchAll(
      /(?:starts_at_iso|startsAtIso|startDate|eventDate)\\?":\\?"(20\d{2}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}-\d{2}:\d{2})/giu,
    ),
  ].map((match) => match[1]);

  const unique = [...new Set(values)];

  return unique
    .map((value) => new Date(value))
    .filter((date) => !Number.isNaN(date.getTime()))
    .sort((left, right) => left.getTime() - right.getTime());
}

function isRelevantExperience(detail: FeverDetail) {
  const normalized = normalizeText(
    `${detail.title} ${detail.description ?? ""} ${detail.venueName} ${detail.city}`,
  );
  const hasInclude = INCLUDE_TERMS.some((term) => normalized.includes(term));
  const hasExclude = EXCLUDE_TERMS.some((term) => normalized.includes(term));

  return hasInclude && !hasExclude && isMetroCity(detail.city, detail.venueName);
}

function extractArtists(title: string) {
  const cleaned = cleanText(title)
    .replace(/^candlelight:\s*/iu, "")
    .replace(/^the\s+jazz\s+room:\s*/iu, "")
    .replace(/^ballet\s+of\s+lights:\s*/iu, "");

  const tribute = cleaned.match(/(?:tributo|homenaje)\s+a\s+(.+)$/iu)?.[1];

  if (tribute) {
    return [cleanText(tribute)];
  }

  return [];
}

function startOfMexicoCityDay(date: Date) {
  const dateKey = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "America/Mexico_City",
  }).format(date);

  return new Date(`${dateKey}T00:00:00-06:00`);
}

function formatIdDate(date: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone: "America/Mexico_City",
  })
    .format(date)
    .replace(/[^0-9]+/g, "-");
}

function cleanText(value?: string | null) {
  return value
    ?.replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim() ?? "";
}

function cleanTitle(value: string) {
  return cleanText(value)
    .replace(/^boletos\s+/iu, "")
    .replace(/\s*\|\s*fever$/iu, "");
}

function cleanVenue(value: string) {
  return cleanText(value)
    .replace(/\s+Av\..*$/iu, "")
    .replace(/\s+\d{4,}.*$/u, "")
    .replace(/,\s*(?:Guadalajara|Zapopan|Jal\.).*$/iu, "")
    .replace(/,+$/u, "");
}

function decodeEmbeddedText(value: string) {
  return value
    .replace(/\\u003Cbr\\u003E/giu, "\n")
    .replace(/\\u003C[^>]+\\u003E/giu, " ")
    .replace(/\\u0026nbsp;/giu, " ")
    .replace(/\\u0022/giu, '"')
    .replace(/&nbsp;/giu, " ");
}

function isMetroCity(city: string, venueName: string) {
  return /guadalajara|zapopan|tlaquepaque|tonala|tlajomulco/iu.test(
    `${city} ${venueName}`,
  );
}

function normalizeText(value: string) {
  return cleanText(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value : "";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
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
