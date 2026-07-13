import { EventSource, type PrismaClient } from "@prisma/client";
import { load } from "cheerio";
import { fetchHtml } from "@/lib/event-sources/http";
import { syncEventSource } from "@/lib/event-sources/sync";
import type {
  EventSourceAdapter,
  ExternalArtist,
  ExternalEvent,
} from "@/lib/event-sources/types";

const SOURCE_URL =
  "https://visitagdl.com/eventos-del-mundial-en-guadalajara-2026-conciertos-fan-fest-y-mas/";
const VENUE = {
  name: "Auditorio Benito Juarez",
  city: "Zapopan",
};

export const vibraJaliscoAdapter: EventSourceAdapter = {
  name: "Vibra Jalisco",
  source: EventSource.VIBRA_JALISCO,
  fetchEvents: fetchVibraJaliscoEvents,
};

export async function syncVibraJaliscoEvents(prisma: PrismaClient) {
  return syncEventSource(prisma, vibraJaliscoAdapter);
}

export async function fetchVibraJaliscoEvents(): Promise<ExternalEvent[]> {
  const html = await fetchHtml(SOURCE_URL);
  const events = parseVibraJaliscoEvents(html);
  const today = startOfMexicoCityDay(new Date());

  return events.filter((event) => event.eventDate >= today);
}

export function parseVibraJaliscoEvents(html: string): ExternalEvent[] {
  const $ = load(html);
  const imageUrl =
    $("meta[property='og:image']").attr("content") ??
    $("article img, main img").first().attr("src") ??
    null;
  const events: ExternalEvent[] = [];
  const section = $("h2")
    .filter((_, element) =>
      normalizeText($(element).text()).includes("vibra jalisco"),
    )
    .first();

  if (!section.length) {
    return createFallbackEvents(imageUrl);
  }

  let currentMonth = "";

  section.nextAll().each((_, element) => {
    const node = $(element);

    if (node.is("h2")) {
      return false;
    }

    if (node.is("h3")) {
      currentMonth = normalizeText(node.text());
      return;
    }

    if (!node.is("ul") || !isScheduleMonth(currentMonth)) {
      return;
    }

    node.find("li").each((_, item) => {
      const itemText = cleanText($(item).text());
      const strongText = cleanText($(item).find("strong").first().text());
      const lineup = cleanText(itemText.replace(strongText, ""));
      const eventDate = parseScheduleDate(strongText);

      if (!lineup || !eventDate) {
        return;
      }

      events.push(createEvent(lineup, eventDate, imageUrl));
    });
  });

  return events.length > 0 ? events : createFallbackEvents(imageUrl);
}

function createEvent(
  lineup: string,
  eventDate: Date,
  imageUrl: string | null,
): ExternalEvent {
  return {
    externalId: `vibra-jalisco-${formatIdDate(eventDate)}-${slugify(lineup)}`,
    title: lineup,
    description:
      "Concierto gratuito de Vibra Jalisco Zona Fan en el Auditorio Benito Juarez. Acceso gratuito, sujeto a aforo.",
    eventDate,
    imageUrl,
    sourceUrl: SOURCE_URL,
    priceMin: 0,
    priceMax: 0,
    currency: "MXN",
    venue: VENUE,
    artists: parseArtists(lineup),
  };
}

function createFallbackEvents(imageUrl: string | null): ExternalEvent[] {
  return [
    createEvent(
      "Golden Ganga",
      new Date("2026-07-11T21:00:00-06:00"),
      imageUrl,
    ),
  ];
}

function parseScheduleDate(value: string) {
  const normalized = normalizeText(value).replace(/[–—]/g, "-");
  const match = normalized.match(
    /(\d{1,2}) de (junio|julio) - (\d{1,2}):(\d{2}) (a\.m\.|p\.m\.)/,
  );

  if (!match) {
    return null;
  }

  const [, dayValue, monthValue, hourValue, minuteValue, period] = match;
  const month = monthValue === "junio" ? "06" : "07";
  const hour = toTwentyFourHour(Number(hourValue), period);
  const minute = minuteValue.padStart(2, "0");
  const date = new Date(
    `2026-${month}-${dayValue.padStart(2, "0")}T${String(hour).padStart(2, "0")}:${minute}:00-06:00`,
  );

  return Number.isNaN(date.getTime()) ? null : date;
}

function toTwentyFourHour(hour: number, period: string) {
  if (period === "a.m.") {
    return hour === 12 ? 0 : hour;
  }

  return hour === 12 ? 12 : hour + 12;
}

function parseArtists(lineup: string): ExternalArtist[] {
  return lineup
    .split(",")
    .map((artist) => cleanText(artist))
    .filter(Boolean);
}

function isScheduleMonth(value: string) {
  return value === "junio" || value === "julio";
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

function slugify(value: string) {
  return normalizeText(value)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
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
