import { EventSource, type PrismaClient } from "@prisma/client";
import { load } from "cheerio";
import { fetchHtml } from "@/lib/event-sources/http";
import { syncEventSource } from "@/lib/event-sources/sync";
import type {
  EventSourceAdapter,
  ExternalEvent,
} from "@/lib/event-sources/types";

const BASE_URL = "https://foroindependencia.com.mx";
const EVENTS_URL = `${BASE_URL}/cartelera/`;

const MONTHS: Record<string, number> = {
  enero: 1,
  febrero: 2,
  marzo: 3,
  abril: 4,
  mayo: 5,
  junio: 6,
  julio: 7,
  agosto: 8,
  septiembre: 9,
  octubre: 10,
  noviembre: 11,
  diciembre: 12,
};

export const foroIndependenciaAdapter: EventSourceAdapter = {
  name: "Foro Independencia",
  source: EventSource.FORO_INDEPENDENCIA,
  fetchEvents: fetchForoIndependenciaEvents,
};

export async function syncForoIndependenciaEvents(prisma: PrismaClient) {
  return syncEventSource(prisma, foroIndependenciaAdapter);
}

export async function fetchForoIndependenciaEvents(): Promise<ExternalEvent[]> {
  const html = await fetchHtml(EVENTS_URL, 30_000);
  const now = new Date();

  return parseForoIndependenciaListing(html, now).filter(
    (event) => event.eventDate > now,
  );
}

export function parseForoIndependenciaListing(
  html: string,
  now = new Date(),
): ExternalEvent[] {
  const $ = load(html);
  const events: ExternalEvent[] = [];
  let year = getMexicoCityYear(now);
  let previousMonthDay: number | null = null;

  $(".e-loop-item.tribe_events").each((_, element) => {
    const card = $(element);
    const title = cleanText(
      card.find(".tec-events-elementor-event-widget__title").first().text(),
    );
    const rawDate = cleanText(
      card
        .find(".tec-events-elementor-event-widget__datetime-date--start")
        .first()
        .text(),
    );
    const rawTime = cleanText(
      card
        .find(".tec-events-elementor-event-widget__datetime-time--start")
        .first()
        .text(),
    );
    const rawUrl = card.find("a.event-img-link").first().attr("href");
    const imageUrl = toAbsoluteUrl(
      card.find("img.event-img").first().attr("src"),
    );
    const venue =
      cleanText(card.find("img.venue-thumb").first().attr("alt")) ||
      "Foro Independencia";
    const dateParts = parseDateParts(rawDate);

    if (!title || !rawUrl || !dateParts) {
      return;
    }

    const monthDay = dateParts.month * 100 + dateParts.day;

    if (previousMonthDay !== null && monthDay < previousMonthDay) {
      year += 1;
    }

    previousMonthDay = monthDay;

    const eventDate = parseLocalDateTime(year, dateParts, rawTime);
    const sourceUrl = new URL(rawUrl, BASE_URL).toString();
    const externalId = new URL(sourceUrl).pathname
      .split("/")
      .filter(Boolean)
      .pop();

    if (!externalId || !eventDate) {
      return;
    }

    events.push({
      externalId,
      title,
      description: null,
      eventDate,
      imageUrl,
      sourceUrl,
      venue: {
        name: venue,
        city: "Guadalajara",
      },
      artists: [],
    });
  });

  return [...new Map(events.map((event) => [event.externalId, event])).values()];
}

function parseDateParts(value: string) {
  const normalized = normalizeText(value);
  const match = normalized.match(/^([a-z]+)\s+(\d{1,2})$/);
  const month = match ? MONTHS[match[1]] : undefined;
  const day = match ? Number(match[2]) : 0;

  if (!month || day < 1 || day > 31) {
    return null;
  }

  return { month, day };
}

function parseLocalDateTime(
  year: number,
  date: { month: number; day: number },
  value: string,
) {
  const timeMatch = value.match(/^(\d{1,2}):(\d{2})$/);

  if (!timeMatch) {
    return null;
  }

  const hour = Number(timeMatch[1]);
  const minute = Number(timeMatch[2]);

  if (hour > 23 || minute > 59) {
    return null;
  }

  const parsed = new Date(
    `${year}-${String(date.month).padStart(2, "0")}-${String(date.day).padStart(2, "0")}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00-06:00`,
  );

  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function getMexicoCityYear(date: Date) {
  return Number(
    new Intl.DateTimeFormat("en", {
      year: "numeric",
      timeZone: "America/Mexico_City",
    }).format(date),
  );
}

function toAbsoluteUrl(value?: string | null) {
  return value ? new URL(value, BASE_URL).toString() : null;
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
