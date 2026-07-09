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
  const $ = load(html);
  const title = cleanText(
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
    cleanText($("meta[property='og:image']").attr("content")) || null;
  const bodyText = cleanText($("body").text());
  const rawText = truncate(`${title}\n${description ?? ""}\n${bodyText}`, 8_000);
  const normalized = normalizeText(rawText);

  if (!title || !looksLikeMusicEvent(normalized)) {
    return null;
  }

  const eventDate = extractDate(html, rawText);
  const venueName = extractVenue(rawText);
  const city = inferCity(rawText);
  const admissionType = classifyAdmission(title, description);
  const confidence = scoreCandidate({
    normalized,
    eventDate,
    venueName,
    city,
    admissionType,
    imageUrl,
    url: result.url,
  });

  if (confidence < 55) {
    return null;
  }

  return {
    title,
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
}) {
  let score = 20;

  if (MUSIC_TERMS.some((term) => input.normalized.includes(normalizeText(term)))) {
    score += 25;
  }

  if (input.eventDate) {
    score += 20;
  }

  if (input.venueName) {
    score += 15;
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
