import { AdmissionType } from "@prisma/client";
import { load } from "cheerio";
import { classifyAdmission } from "@/lib/event-sources/admission";
import { fetchHtml } from "@/lib/event-sources/http";
import type { CandidateInput, SearchResult } from "@/lib/discovery/types";

const MUSIC_TERMS = [
  "artista",
  "banda",
  "candlelight",
  "concierto",
  "dj",
  "festival",
  "gira",
  "jazz",
  "mariachi",
  "musica",
  "musical",
  "orquesta",
  "rock",
  "show en vivo",
  "tributo",
];

const EXCLUDE_TERMS = [
  "curso",
  "diplomado",
  "partido",
  "restaurante",
  "taller",
  "webinar",
];

const VENUE_PATTERNS = [
  /(?:recinto|sede|lugar|ubicacion):\s*([^\n\r.]+)/iu,
  /(?:en el|en la)\s+((?:auditorio|foro|teatro|arena|estadio|palcco|c3|centro cultural)[^\n\r.]+)/iu,
];

const MONTHS: Record<string, number> = {
  enero: 0,
  febrero: 1,
  marzo: 2,
  abril: 3,
  mayo: 4,
  junio: 5,
  julio: 6,
  agosto: 7,
  septiembre: 8,
  setiembre: 8,
  octubre: 9,
  noviembre: 10,
  diciembre: 11,
};

export async function extractCandidateFromResult(
  result: SearchResult,
): Promise<CandidateInput | null> {
  try {
    const html = await fetchHtml(result.url, 20_000);

    return extractCandidateFromHtml(html, result);
  } catch (error) {
    console.warn(`Discovery page skipped: ${result.url}`, error);
    return null;
  }
}

export function extractCandidateFromHtml(
  html: string,
  result: SearchResult,
): CandidateInput | null {
  if (isListingPageUrl(result.url)) {
    return null;
  }

  const $ = load(html);
  const structuredEvent = extractStructuredEvent(html);
  const title = cleanText(
    structuredEvent?.title ||
      $("meta[property='og:title']").attr("content") ||
      $("h1").first().text() ||
      $("title").text() ||
      result.title,
  );
  const description =
    cleanText(
      $("meta[property='og:description']").attr("content") ||
        $("meta[name='description']").attr("content") ||
        result.content,
    ) || null;
  const imageUrl =
    cleanText(structuredEvent?.imageUrl) ||
    cleanText($("meta[property='og:image']").attr("content")) ||
    null;
  const bodyText = cleanText($("body").text());
  const rawText = truncate(`${title}\n${description ?? ""}\n${bodyText}`, 8_000);
  const normalized = normalizeText(rawText);

  if (!title || !looksLikeMusicEvent(normalized)) {
    return null;
  }

  const artistName = structuredEvent?.artistName ?? extractArtistName(title);
  const eventDate = structuredEvent?.eventDate ?? extractDate(html, rawText);
  const venueName = structuredEvent?.venueName ?? extractVenue(rawText);
  const city = structuredEvent?.city ?? inferCity(rawText);
  const admissionType = classifyAdmission(
    title,
    `${description ?? ""} ${rawText}`,
  );
  const confidence = scoreCandidate({
    normalized,
    eventDate,
    venueName,
    city,
    admissionType,
    imageUrl,
    url: result.url,
    artistName,
  });

  if (!eventDate || !isConcreteArtistName(artistName) || confidence < 75) {
    return null;
  }

  const confirmedArtistName = artistName;

  return {
    title,
    artistName: confirmedArtistName,
    description,
    eventDate,
    imageUrl,
    sourceUrl: result.url,
    sourceName: inferSourceName(result.url),
    venueName,
    city,
    admissionType,
    confidence,
    rawText,
  };
}

function extractStructuredEvent(html: string) {
  const $ = load(html);
  const scripts = $("script[type='application/ld+json']")
    .map((_, element) => $(element).text())
    .get();

  for (const script of scripts) {
    const records = flattenJsonLd(parseJson(script));
    const event = records.find((record) =>
      /event$/iu.test(String(record["@type"] ?? "")),
    );

    if (!event) {
      continue;
    }

    const location = isRecord(event.location) ? event.location : null;
    const address = isRecord(location?.address) ? location.address : null;
    const eventDate = parseDate(stringValue(event.startDate));
    const artistName = extractPerformerName(event.performer);

    return {
      title:
        cleanText(stringValue(event.name)) ||
        cleanText(stringValue(event.headline)) ||
        null,
      eventDate,
      artistName,
      imageUrl: imageValue(event.image),
      venueName: cleanText(stringValue(location?.name)) || null,
      city:
        cleanText(stringValue(address?.addressLocality)) ||
        cleanText(stringValue(address?.addressRegion)) ||
        null,
    };
  }

  return null;
}

function flattenJsonLd(value: unknown): Record<string, unknown>[] {
  if (Array.isArray(value)) {
    return value.flatMap(flattenJsonLd);
  }

  if (!isRecord(value)) {
    return [];
  }

  const graph = value["@graph"];

  if (Array.isArray(graph)) {
    return [value, ...graph.flatMap(flattenJsonLd)];
  }

  return [value];
}

function parseJson(value: string) {
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return null;
  }
}

function parseDate(value: string) {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
}

function imageValue(value: unknown) {
  if (typeof value === "string") {
    return value;
  }

  if (Array.isArray(value)) {
    return imageValue(value[0]);
  }

  if (isRecord(value)) {
    return stringValue(value.url) || stringValue(value.contentUrl) || null;
  }

  return null;
}

function extractPerformerName(value: unknown) {
  if (Array.isArray(value)) {
    return extractPerformerName(value[0]);
  }

  if (isRecord(value)) {
    return cleanText(stringValue(value.name)) || null;
  }

  return null;
}

function extractArtistName(title: string) {
  const cleaned = cleanText(title)
    .replace(/^boletos\s+(?:para\s+)?/iu, "")
    .replace(/^concierto\s+(?:de\s+)?/iu, "");
  const ticketMatch = cleaned.match(/^(.+?)\s+(?:en vivo|entradas|boletos)/iu)?.[1];
  const concertMatch = cleaned.match(/(?:concierto|presentacion|presentación)\s+de\s+(.+?)(?:\s+en|\s+gratis|$)/iu)?.[1];
  const orchestraMatch = cleaned.match(/(orquesta\s+metropolitana\s+de\s+guadalajara)/iu)?.[1];
  const beforeAt = cleanText(cleaned.split("@")[0]);
  const hasAtPattern = /@/.test(cleaned);
  const beforeVenue = cleanText(
    beforeAt.split(
      /\s+(?:en|at)\s+(?:auditorio|foro|teatro|arena|estadio|c3|baramericas|anexo|palcco)\b/iu,
    )[0],
  );

  return (
    cleanText(orchestraMatch) ||
    cleanText(concertMatch) ||
    cleanText(ticketMatch) ||
    (hasAtPattern ? beforeVenue || beforeAt : null)
  );
}

function isConcreteArtistName(value: string | null): value is string {
  if (!value) {
    return false;
  }

  const normalized = normalizeText(value);

  if (normalized.length < 2 || normalized.length > 80) {
    return false;
  }

  return !/(agenda|cartelera|categoria|eventos|festival de musica|gobierno|instagram|facebook|tiktok|zona 3)/u.test(
    normalized,
  );
}

function isListingPageUrl(url: string) {
  return /songkick\.com\/(?:es\/)?metro-areas\//iu.test(url);
}

function looksLikeMusicEvent(normalized: string) {
  const includesMusic = MUSIC_TERMS.some((term) =>
    normalized.includes(normalizeText(term)),
  );
  const excluded = EXCLUDE_TERMS.some((term) =>
    normalized.includes(normalizeText(term)),
  );
  const inMetroArea =
    /guadalajara|zapopan|tlaquepaque|tonala|tlajomulco|jalisco/u.test(
      normalized,
    );

  return includesMusic && inMetroArea && !excluded;
}

function scoreCandidate(input: {
  normalized: string;
  eventDate: Date | null;
  venueName: string | null;
  city: string | null;
  admissionType: AdmissionType;
  imageUrl: string | null;
  url: string;
  artistName: string | null;
}) {
  let score = 10;

  if (MUSIC_TERMS.some((term) => input.normalized.includes(normalizeText(term)))) {
    score += 15;
  }

  if (isConcreteArtistName(input.artistName)) {
    score += 30;
  }

  if (input.eventDate) {
    score += 25;
  }

  if (input.venueName) {
    score += 10;
  }

  if (input.city) {
    score += 10;
  }

  if (input.admissionType === AdmissionType.FREE) {
    score += 10;
  }

  if (input.imageUrl) {
    score += 5;
  }

  if (/\.(gob|jalisco|guadalajara|zapopan)\./iu.test(input.url)) {
    score += 10;
  }

  return Math.min(score, 100);
}

function extractDate(html: string, text: string) {
  const $ = load(html);
  const structuredDate =
    $("time[datetime]").first().attr("datetime") ||
    html.match(/"startDate"\s*:\s*"([^"]+)"/iu)?.[1] ||
    html.match(/"eventDate"\s*:\s*"([^"]+)"/iu)?.[1];

  if (structuredDate) {
    const date = new Date(structuredDate);

    if (!Number.isNaN(date.getTime())) {
      return date;
    }
  }

  const match = text.match(
    /(\d{1,2})\s+de\s+(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|setiembre|octubre|noviembre|diciembre)(?:\s+de\s+(\d{4}))?/iu,
  );

  if (!match) {
    return null;
  }

  const year = Number(match[3] ?? new Date().getFullYear());
  const date = new Date(
    `${year}-${String(MONTHS[normalizeText(match[2])] + 1).padStart(2, "0")}-${String(Number(match[1])).padStart(2, "0")}T${extractTime(text)}`,
  );

  return Number.isNaN(date.getTime()) ? null : date;
}

function extractTime(text: string) {
  const match = text.match(/(\d{1,2})(?::(\d{2}))?\s*(?:h|hrs|horas|p\.?\s*m\.?|pm)/iu);

  if (!match) {
    return "20:00:00-06:00";
  }

  let hour = Number(match[1]);
  const minute = Number(match[2] ?? 0);

  if (/p\.?\s*m\.?|pm/iu.test(match[0]) && hour < 12) {
    hour += 12;
  }

  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00-06:00`;
}

function extractVenue(text: string) {
  for (const pattern of VENUE_PATTERNS) {
    const venue = cleanText(text.match(pattern)?.[1]);

    if (venue) {
      return truncate(venue.replace(/\s+en\s+Guadalajara.*$/iu, ""), 120);
    }
  }

  return null;
}

function inferCity(text: string) {
  if (/zapopan/iu.test(text)) return "Zapopan";
  if (/tlaquepaque/iu.test(text)) return "Tlaquepaque";
  if (/tonala|tonalá/iu.test(text)) return "Tonala";
  if (/tlajomulco/iu.test(text)) return "Tlajomulco";
  if (/guadalajara|jalisco/iu.test(text)) return "Guadalajara";

  return null;
}

function inferSourceName(url: string) {
  const hostname = new URL(url).hostname.replace(/^www\./u, "");

  return hostname;
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

function truncate(value: string, length: number) {
  return value.length > length ? `${value.slice(0, length - 1)}…` : value;
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value : "";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
