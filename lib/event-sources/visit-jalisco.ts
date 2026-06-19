import { EventSource, type PrismaClient } from "@prisma/client";
import { load, type CheerioAPI } from "cheerio";
import { fetchHtml } from "@/lib/event-sources/http";
import { syncEventSource } from "@/lib/event-sources/sync";
import type {
  EventSourceAdapter,
  ExternalEvent,
} from "@/lib/event-sources/types";

const BASE_URL = "https://visitjalisco.mx";
const EVENTS_URL = `${BASE_URL}/activities?filter=events&lang=es`;

const MUSIC_TERMS = [
  "banda",
  "cantante",
  "cantautor",
  "concierto",
  "cuarteto",
  "dj",
  "filarmonica",
  "mariachi",
  "musica",
  "musical",
  "orquesta",
  "piano",
  "recital",
  "regional mexicano",
  "serenata",
  "sinfonica",
];

const METRO_CITIES = [
  ["zapopan", "Zapopan"],
  ["tlaquepaque", "San Pedro Tlaquepaque"],
  ["tlajomulco", "Tlajomulco de Zuniga"],
  ["tonala", "Tonala"],
  ["guadalajara", "Guadalajara"],
] as const;

const OUTSIDE_METRO_TERMS = [
  "ajijic",
  "chapala",
  "costalegre",
  "lagos de moreno",
  "mazamitla",
  "puerto vallarta",
  "sayula",
  "tala",
  "tapalpa",
  "tequila",
];

type ListingCandidate = {
  externalId: string;
  title: string;
  description: string;
  eventDate: Date;
  imageUrl: string | null;
  sourceUrl: string;
};

export const visitJaliscoAdapter: EventSourceAdapter = {
  name: "Visit Jalisco",
  source: EventSource.VISIT_JALISCO,
  fetchEvents: fetchVisitJaliscoEvents,
};

export async function syncVisitJaliscoEvents(prisma: PrismaClient) {
  return syncEventSource(prisma, visitJaliscoAdapter);
}

export async function fetchVisitJaliscoEvents(): Promise<ExternalEvent[]> {
  const listingHtml = await fetchHtml(EVENTS_URL);
  const candidates = parseListing(listingHtml);
  const events = await mapWithConcurrency(candidates, 4, fetchEventDetail);

  return events.filter((event): event is ExternalEvent => event !== null);
}

export function parseListing(html: string): ListingCandidate[] {
  const $ = load(html);
  const candidates: ListingCandidate[] = [];

  $(".activity-item[data-type='event']").each((_, element) => {
    const card = $(element);
    const title = cleanText(card.find("h3").first().text());
    const description = cleanText(card.find("p").first().text());
    const rawUrl = card.find("a[href*='/event/']").first().attr("href");
    const rawDate = card.attr("data-event-start");

    if (!title || !rawUrl || !rawDate) {
      return;
    }

    if (!isMusicCandidate(`${title} ${description}`)) {
      return;
    }

    const sourceUrl = new URL(rawUrl, BASE_URL).toString();
    const externalId = new URL(sourceUrl).pathname.split("/").filter(Boolean).pop();
    const eventDate = parseIsoDate(rawDate);

    if (!externalId || !eventDate) {
      return;
    }

    candidates.push({
      externalId,
      title,
      description,
      eventDate,
      imageUrl: toAbsoluteUrl(card.find("img").first().attr("src")),
      sourceUrl,
    });
  });

  return candidates;
}

async function fetchEventDetail(
  candidate: ListingCandidate,
): Promise<ExternalEvent | null> {
  try {
    const html = await fetchHtml(candidate.sourceUrl);
    const $ = load(html);
    const title = cleanText($("main h1").first().text()) || candidate.title;
    const content = extractPrimaryContent($);
    const description = content[0] ?? candidate.description ?? null;
    const venue = extractInfoStripValue($, "ti-map-pin") ?? "Por confirmar";
    const artist = extractInfoStripValue($, "ti-world");
    const searchableText = [
      title,
      candidate.description,
      ...content,
      artist,
    ].join(" ");

    if (!isMusicalEvent(searchableText)) {
      return null;
    }

    const city = inferMetroCity(`${title} ${venue} ${searchableText}`);

    if (!city) {
      return null;
    }

    return {
      externalId: candidate.externalId,
      title,
      description,
      eventDate: candidate.eventDate,
      imageUrl:
        toAbsoluteUrl(
          $("main img")
            .filter((_, image) => cleanText($(image).attr("alt")) === title)
            .first()
            .attr("src"),
        ) ?? candidate.imageUrl,
      sourceUrl: candidate.sourceUrl,
      venue: {
        name: venue,
        city,
      },
      artists:
        artist && isArtistLabel(artist, title, venue) ? [artist] : [],
    };
  } catch (error) {
    console.warn(`Visit Jalisco event skipped: ${candidate.sourceUrl}`, error);
    return null;
  }
}

function extractPrimaryContent($: CheerioAPI) {
  const paragraphs: string[] = [];

  $("main h2, main p").each((_, element) => {
    const text = cleanText($(element).text());

    if ($(element).is("h2") && text === "Eventos de Jalisco") {
      return false;
    }

    if ($(element).is("p") && text && !paragraphs.includes(text)) {
      paragraphs.push(text);
    }
  });

  return paragraphs.slice(0, 8);
}

function extractInfoStripValue($: CheerioAPI, iconClass: string) {
  const item = $(`.event-info-strip-item .${iconClass}`)
    .first()
    .closest(".event-info-strip-item");

  return cleanText(item.find(".event-info-strip-text").first().text()) || null;
}

function isMusicCandidate(value: string) {
  const normalized = normalizeForSearch(value);

  return (
    MUSIC_TERMS.some((term) => normalized.includes(term)) ||
    normalized.includes("festival")
  );
}

function isMusicalEvent(value: string) {
  const normalized = normalizeForSearch(value);

  return MUSIC_TERMS.some((term) => normalized.includes(term));
}

function inferMetroCity(value: string) {
  const normalized = normalizeForSearch(value);

  if (OUTSIDE_METRO_TERMS.some((term) => normalized.includes(term))) {
    return null;
  }

  for (const [term, city] of METRO_CITIES) {
    if (normalized.includes(term)) {
      return city;
    }
  }

  return "Guadalajara";
}

function isArtistLabel(value: string, title: string, venue: string) {
  const normalized = normalizeForSearch(value);

  if (
    /^https?:\/\//i.test(value) ||
    normalized.includes("festival") ||
    normalized === normalizeForSearch(title) ||
    normalized === normalizeForSearch(venue)
  ) {
    return false;
  }

  return ![
    "boletos",
    "comprar boletos",
    "mas informacion",
    "pagina oficial",
    "sitio oficial",
    "sitio web",
  ].includes(normalized);
}

function parseIsoDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }

  const date = new Date(`${value}T00:00:00-06:00`);

  return Number.isNaN(date.getTime()) ? null : date;
}

function cleanText(value?: string | null) {
  return value?.replace(/\s+/g, " ").trim() ?? "";
}

function normalizeForSearch(value: string) {
  return cleanText(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function toAbsoluteUrl(value?: string | null) {
  if (!value) {
    return null;
  }

  return new URL(value, BASE_URL).toString();
}

async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  mapper: (item: T) => Promise<R>,
) {
  const results: R[] = [];

  for (let index = 0; index < items.length; index += concurrency) {
    const batch = items.slice(index, index + concurrency);
    results.push(...(await Promise.all(batch.map(mapper))));
  }

  return results;
}
