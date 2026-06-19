import { EventSource, type PrismaClient } from "@prisma/client";
import { load } from "cheerio";
import { fetchHtml } from "@/lib/event-sources/http";
import { syncEventSource } from "@/lib/event-sources/sync";
import type {
  EventSourceAdapter,
  ExternalEvent,
} from "@/lib/event-sources/types";

const BASE_URL = "https://www.c3stage.com";
const EVENTS_URL = `${BASE_URL}/calendario-de-eventos/`;

type C3ListingCandidate = {
  externalId: string;
  title: string;
  description: string | null;
  date: string;
  imageUrl: string | null;
  sourceUrl: string;
  venue: string;
  city: string;
};

export const c3StageAdapter: EventSourceAdapter = {
  name: "C3 Stage",
  source: EventSource.C3_STAGE,
  fetchEvents: fetchC3StageEvents,
};

export async function syncC3StageEvents(prisma: PrismaClient) {
  return syncEventSource(prisma, c3StageAdapter);
}

export async function fetchC3StageEvents(): Promise<ExternalEvent[]> {
  const html = await fetchHtml(EVENTS_URL);
  const candidates = parseC3Listing(html);
  const events = await mapWithConcurrency(candidates, 4, fetchC3EventDetail);
  const now = new Date();

  return events
    .filter((event): event is ExternalEvent => event !== null)
    .filter((event) => event.eventDate > now);
}

export function parseC3Listing(html: string): C3ListingCandidate[] {
  const $ = load(html);
  const candidates: C3ListingCandidate[] = [];

  $("article.entry-event").each((_, element) => {
    const card = $(element);
    const title = getMetaContent(card, "name");
    const sourceUrl = getMetaContent(card, "url");
    const imageUrl = getMetaContent(card, "image");
    const description = getMetaContent(card, "description");
    const rawDate = card.find("[itemprop='startDate']").first().attr("content");
    const venue = cleanText(card.find("[itemprop='location']").first().text());
    const city =
      card.find("[itemprop='addressLocality']").first().attr("content") ||
      "Guadalajara";
    const date = rawDate?.match(/^\d{4}-\d{2}-\d{2}/)?.[0];
    const postId = cleanText(card.attr("data-post-id"));
    const slug = sourceUrl
      ? new URL(sourceUrl, BASE_URL).pathname.split("/").filter(Boolean).pop()
      : null;

    if (!title || !sourceUrl || !date || !venue || (!postId && !slug)) {
      return;
    }

    candidates.push({
      externalId: postId || slug!,
      title,
      description: description || null,
      date,
      imageUrl: imageUrl || null,
      sourceUrl: new URL(sourceUrl, BASE_URL).toString(),
      venue,
      city: cleanText(city),
    });
  });

  return candidates;
}

async function fetchC3EventDetail(
  candidate: C3ListingCandidate,
): Promise<ExternalEvent | null> {
  try {
    const html = await fetchHtml(candidate.sourceUrl);
    const $ = load(html);
    const description =
      getMetaContent($("article.event").first(), "description") ||
      candidate.description;
    const rawArtist = extractLabelValue(
      $(".event-venue").first().text(),
      "Artista",
    );
    const artist =
      rawArtist && isArtistConsistentWithTitle(rawArtist, candidate.title)
        ? rawArtist
        : null;
    const displayTime =
      description?.match(
        /\bShow\s+(\d{1,2}:\d{2}(?:\s*(?:[AP]M|hrs?\.?))?)/i,
      )?.[1] ||
      extractLabelValue($(".event-time").first().text(), "Hora");
    const eventDate = parseLocalDateTime(candidate.date, displayTime);

    if (!eventDate) {
      return null;
    }

    return {
      externalId: candidate.externalId,
      title: candidate.title,
      description,
      eventDate,
      imageUrl: candidate.imageUrl,
      sourceUrl: candidate.sourceUrl,
      venue: {
        name: candidate.venue,
        city: candidate.city,
      },
      artists: artist ? [artist] : [],
    };
  } catch (error) {
    console.warn(`C3 Stage event skipped: ${candidate.sourceUrl}`, error);
    return null;
  }
}

function parseLocalDateTime(date: string, value: string | null) {
  const match = cleanText(value).match(
    /^(\d{1,2}):(\d{2})(?:\s*([AP]M|hrs?\.?))?$/i,
  );

  if (!match) {
    return null;
  }

  const [, rawHour, minute, period = ""] = match;
  let hour = Number(rawHour);

  if (/[AP]M/i.test(period)) {
    hour %= 12;

    if (period.toUpperCase() === "PM") {
      hour += 12;
    }
  }

  if (hour > 23) {
    return null;
  }

  const parsed = new Date(
    `${date}T${String(hour).padStart(2, "0")}:${minute}:00-06:00`,
  );

  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function isArtistConsistentWithTitle(artist: string, title: string) {
  const normalizedArtist = normalizeForComparison(artist);
  const normalizedTitle = normalizeForComparison(title);

  return (
    normalizedArtist.includes(normalizedTitle) ||
    normalizedTitle.includes(normalizedArtist)
  );
}

function normalizeForComparison(value: string) {
  return cleanText(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function extractLabelValue(value: string, label: string) {
  const normalized = cleanText(value);
  const match = normalized.match(new RegExp(`^${label}:\\s*(.+)$`, "i"));

  return match?.[1]?.trim() || null;
}

function getMetaContent(
  element: ReturnType<ReturnType<typeof load>>,
  itemprop: string,
) {
  return cleanText(
    element.find(`meta[itemprop='${itemprop}']`).first().attr("content"),
  );
}

function cleanText(value?: string | null) {
  return value?.replace(/\s+/g, " ").trim() ?? "";
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
