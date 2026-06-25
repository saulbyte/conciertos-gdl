import { EventSource, type PrismaClient } from "@prisma/client";
import { load } from "cheerio";
import { fetchHtml } from "@/lib/event-sources/http";
import { syncEventSource } from "@/lib/event-sources/sync";
import type {
  EventSourceAdapter,
  ExternalEvent,
} from "@/lib/event-sources/types";

const FETCH_BASE_URL = "https://funticket.cc";
const SITEMAP_URL = `${FETCH_BASE_URL}/sitemap.xml`;

const MONTHS: Record<string, number> = {
  ene: 1,
  enero: 1,
  feb: 2,
  febrero: 2,
  mar: 3,
  marzo: 3,
  abr: 4,
  abril: 4,
  may: 5,
  mayo: 5,
  jun: 6,
  junio: 6,
  jul: 7,
  julio: 7,
  ago: 8,
  agosto: 8,
  sep: 9,
  septiembre: 9,
  oct: 10,
  octubre: 10,
  nov: 11,
  noviembre: 11,
  dic: 12,
  diciembre: 12,
};

type FunTicketCandidate = {
  externalId: string;
  fetchUrl: string;
  sourceUrl: string;
};

type FunTicketDetail = {
  title: string;
  artist: string | null;
  description: string | null;
  dateLabel: string;
  timeLabel: string | null;
  venue: string;
  city: string;
  imageUrl: string | null;
};

export const funTicketAdapter: EventSourceAdapter = {
  name: "FunTicket",
  source: EventSource.FUNTICKET,
  fetchEvents: fetchFunTicketEvents,
};

export async function syncFunTicketEvents(prisma: PrismaClient) {
  return syncEventSource(prisma, funTicketAdapter);
}

export async function fetchFunTicketEvents(): Promise<ExternalEvent[]> {
  const sitemap = await fetchHtml(SITEMAP_URL, 30_000);
  const candidates = parseFunTicketSitemap(sitemap);
  const events = await mapWithConcurrency(candidates, 4, fetchFunTicketDetail);
  const now = new Date();

  return events
    .filter((event): event is ExternalEvent => event !== null)
    .filter((event) => event.eventDate > now);
}

export function parseFunTicketSitemap(xml: string): FunTicketCandidate[] {
  const urls = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) =>
    match[1].trim(),
  );

  return urls
    .filter((url) => /\/evento\//u.test(url))
    .filter((url) => /guadalajara|jalisco|zapopan|gdl/iu.test(url))
    .map((sourceUrl) => {
      const parsed = new URL(sourceUrl);
      const externalId = parsed.pathname.split("/").filter(Boolean).pop();

      if (!externalId) {
        return null;
      }

      return {
        externalId,
        sourceUrl: parsed.toString(),
        fetchUrl: new URL(parsed.pathname, FETCH_BASE_URL).toString(),
      };
    })
    .filter((candidate): candidate is FunTicketCandidate => candidate !== null);
}

async function fetchFunTicketDetail(
  candidate: FunTicketCandidate,
): Promise<ExternalEvent | null> {
  try {
    const html = await fetchHtml(candidate.fetchUrl, 30_000);
    const detail = parseFunTicketDetail(html);

    if (!detail || !isMetropolitanEvent(detail)) {
      return null;
    }

    const eventDate = parseLocalDateTime(detail.dateLabel, detail.timeLabel);

    if (!eventDate) {
      return null;
    }

    return {
      externalId: candidate.externalId,
      title: detail.title,
      description: detail.description,
      eventDate,
      imageUrl: detail.imageUrl,
      sourceUrl: candidate.sourceUrl,
      venue: {
        name: detail.venue,
        city: detail.city,
      },
      artists: detail.artist ? [detail.artist] : [],
    };
  } catch (error) {
    if (error instanceof Error && error.message.includes("404 Not Found")) {
      return null;
    }

    console.warn(`FunTicket event skipped: ${candidate.fetchUrl}`, error);
    return null;
  }
}

export function parseFunTicketDetail(html: string): FunTicketDetail | null {
  const $ = load(html);
  const description =
    cleanText($("meta[name='description']").attr("content")) ||
    cleanText($("meta[property='og:description']").attr("content"));
  const imageUrl =
    cleanText($("meta[property='og:image']").attr("content")) || null;
  const bodyText = cleanText($("body").text());
  const rawDetailTitle = getTitleFromDescription(description);
  const dateFromDescription = description.match(
    /Evento\s+(?:el|:)\s*(\d{1,2}\s+de\s+[a-záéíóúñ]+\.?\s+\d{4})/iu,
  )?.[1];
  const timeFromBody = bodyText.match(
    /Fecha y Hora\s*(?:\d{1,2}\s+de\s+[a-záéíóúñ]+\.?\s+\d{4})\s*(\d{1,2}:\d{2})\s*hrs?\.?/iu,
  )?.[1];
  const venueFromDescription = description.match(
    /\sen\s+(.+?),\s*(?:GUADALAJARA|Guadalajara|Zapopan)\b/u,
  )?.[1];
  const venue = cleanText(venueFromDescription);

  if (!rawDetailTitle || !dateFromDescription || !venue) {
    return null;
  }

  const artist = extractArtist(rawDetailTitle);

  return {
    title: cleanTitle(rawDetailTitle),
    artist,
    description: description || null,
    dateLabel: dateFromDescription,
    timeLabel: timeFromBody ?? null,
    venue,
    city: inferCity(bodyText, description),
    imageUrl,
  };
}

function parseLocalDateTime(dateLabel: string, timeLabel: string | null) {
  const normalizedDate = normalizeText(dateLabel);
  const match = normalizedDate.match(
    /^(\d{1,2})\s+de\s+([a-z]+)\.?\s+(\d{4})$/u,
  );
  const timeMatch = cleanText(timeLabel).match(/^(\d{1,2}):(\d{2})$/u);

  if (!match || !timeMatch) {
    return null;
  }

  const day = Number(match[1]);
  const month = MONTHS[match[2]];
  const year = Number(match[3]);
  const hour = Number(timeMatch[1]);
  const minute = Number(timeMatch[2]);

  if (!month || day < 1 || day > 31 || hour > 23 || minute > 59) {
    return null;
  }

  const parsed = new Date(
    `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00-06:00`,
  );

  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function isMetropolitanEvent(detail: FunTicketDetail) {
  return /guadalajara|zapopan|jalisco|jal\./iu.test(
    `${detail.city} ${detail.venue} ${detail.description ?? ""}`,
  );
}

function inferCity(bodyText: string, description: string) {
  const searchable = `${bodyText} ${description}`;

  if (/Zapopan|Tepeyac/i.test(searchable)) {
    return "Zapopan";
  }

  return "Guadalajara";
}

function extractArtist(rawTitle: string) {
  const detail = cleanTitle(rawTitle);
  const artist = detail.split(/\s+-\s+/u)[0];

  return cleanTitle(artist) || null;
}

function getTitleFromDescription(description: string) {
  return (
    description.match(/boletos oficiales para\s+(.+?)\s+en\s+/iu)?.[1] ?? ""
  );
}

function cleanTitle(value: string) {
  return cleanText(value).replace(/^✅\s*/u, "");
}

function cleanText(value?: string | null) {
  return value?.replace(/\s+/g, " ").trim() ?? "";
}

function normalizeText(value: string) {
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
