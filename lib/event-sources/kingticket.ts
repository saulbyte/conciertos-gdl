import { EventSource, type PrismaClient } from "@prisma/client";
import { load } from "cheerio";
import { syncEventSource } from "@/lib/event-sources/sync";
import type {
  EventSourceAdapter,
  ExternalEvent,
} from "@/lib/event-sources/types";

const STORE_PRODUCTS_URL =
  "https://kingticketboletos.com/wp-json/wc/store/v1/products";
const SEARCH_TERMS = [
  "guadalajara",
  "zapopan",
  "jalisco",
  "auditorio telmex",
  "estadio jalisco",
  "arena guadalajara",
  "arena vfg",
  "teatro diana",
];
const METRO_PATTERN =
  /jalisco|guadalajara|zapopan|tlaquepaque|tlajomulco|tonala|auditorio telmex|estadio jalisco|arena guadalajara|arena vfg|teatro diana/i;
const VENUE_NAMES = [
  "Auditorio Telmex",
  "Estadio Jalisco",
  "Arena Guadalajara",
  "Arena VFG",
  "Teatro Diana",
];

const MONTHS: Record<string, number> = {
  ene: 1,
  enero: 1,
  jan: 1,
  january: 1,
  feb: 2,
  febrero: 2,
  mar: 3,
  marzo: 3,
  apr: 4,
  abril: 4,
  abr: 4,
  may: 5,
  mayo: 5,
  jun: 6,
  junio: 6,
  jul: 7,
  julio: 7,
  aug: 8,
  agosto: 8,
  ago: 8,
  sep: 9,
  sept: 9,
  septiembre: 9,
  oct: 10,
  octubre: 10,
  nov: 11,
  noviembre: 11,
  dec: 12,
  diciembre: 12,
  dic: 12,
};

type KingTicketProduct = {
  id: number;
  name?: string;
  slug?: string;
  permalink?: string;
  short_description?: string;
  description?: string;
  images?: { src?: string }[];
};

type ParsedKingTicketTitle = {
  title: string;
  artist: string;
  venue: string;
  city: string;
  eventDate: Date;
};

export const kingTicketAdapter: EventSourceAdapter = {
  name: "KingTicket",
  source: EventSource.KINGTICKET,
  fetchEvents: fetchKingTicketEvents,
};

export async function syncKingTicketEvents(prisma: PrismaClient) {
  return syncEventSource(prisma, kingTicketAdapter);
}

export async function fetchKingTicketEvents(): Promise<ExternalEvent[]> {
  const productsById = new Map<number, KingTicketProduct>();

  for (const term of SEARCH_TERMS) {
    const products = await fetchProducts(term);

    for (const product of products) {
      productsById.set(product.id, product);
    }
  }

  const now = new Date();

  return [...productsById.values()]
    .map(mapProductToEvent)
    .filter((event): event is ExternalEvent => event !== null)
    .filter((event) => event.eventDate > now);
}

async function fetchProducts(search: string) {
  const url = new URL(STORE_PRODUCTS_URL);
  url.searchParams.set("search", search);
  url.searchParams.set("per_page", "100");

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "Accept-Language": "es-MX,es;q=0.9",
      "User-Agent":
        "ConciertosGDL/1.0 (+https://conciertos-gdl.vercel.app; event indexer)",
    },
    signal: AbortSignal.timeout(30_000),
  });

  if (!response.ok) {
    throw new Error(
      `KingTicket request failed: ${response.status} ${response.statusText}`,
    );
  }

  const products = (await response.json()) as KingTicketProduct[];

  return products.filter((product) =>
    METRO_PATTERN.test(normalizeText(getSearchableText(product))),
  );
}

function mapProductToEvent(product: KingTicketProduct): ExternalEvent | null {
  const imageUrl = product.images?.find((image) => image.src)?.src ?? null;
  const name = htmlToText(product.name);
  const slug = product.slug ?? "";
  const parsed = parseTitle(name) ?? parseTitle(slug.replace(/-/g, " "));

  if (!parsed) {
    return null;
  }

  const description = htmlToText(
    [product.short_description, product.description].filter(Boolean).join(" "),
  );

  return {
    externalId: String(product.id),
    title: parsed.title,
    description: description || null,
    eventDate: parsed.eventDate,
    imageUrl,
    sourceUrl: product.permalink ?? null,
    venue: {
      name: parsed.venue,
      city: parsed.city,
    },
    artists: [
      {
        name: parsed.artist,
        imageUrl,
      },
    ],
  };
}

function parseTitle(value: string): ParsedKingTicketTitle | null {
  const cleaned = cleanTitle(value);
  const dateMatch = cleaned.match(
    /\b(ene(?:ro)?|feb(?:rero)?|mar(?:zo)?|abr(?:il)?|may(?:o)?|jun(?:io)?|jul(?:io)?|ago(?:sto)?|sep|sept|septiembre|oct(?:ubre)?|nov(?:iembre)?|dic(?:iembre)?|jan(?:uary)?|apr|aug|dec)\s+(\d{1,2})\s+(\d{4})\b/iu,
  );

  if (dateMatch?.index === undefined) {
    return null;
  }

  const month = MONTHS[normalizeText(dateMatch[1])];
  const day = Number(dateMatch[2]);
  const year = Number(dateMatch[3]);

  if (!month || day < 1 || day > 31) {
    return null;
  }

  const beforeDate = cleaned.slice(0, dateMatch.index).trim();
  const afterDate = cleaned.slice(dateMatch.index + dateMatch[0].length).trim();
  const city = inferCity(afterDate || cleaned);
  const parts = getTitleParts(beforeDate);

  if (parts.length < 2 || !city) {
    return null;
  }

  const artist = formatArtistName(parts[0]);
  const venue = parts.slice(1).join(" - ");
  const eventDate = new Date(
    `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}T20:00:00-06:00`,
  );

  if (Number.isNaN(eventDate.getTime())) {
    return null;
  }

  return {
    title: artist,
    artist,
    venue,
    city,
    eventDate,
  };
}

function getTitleParts(beforeDate: string) {
  const separatedParts = beforeDate
    .split(/\s+-\s+|\s+–\s+|\s+—\s+/u)
    .map(cleanTitle)
    .filter(Boolean);

  if (separatedParts.length >= 2) {
    return separatedParts;
  }

  const normalized = normalizeText(beforeDate);
  const venue = VENUE_NAMES.find((candidate) =>
    normalized.includes(normalizeText(candidate)),
  );

  if (!venue) {
    return separatedParts;
  }

  const venueIndex = normalized.indexOf(normalizeText(venue));
  const artist = cleanTitle(beforeDate.slice(0, venueIndex));

  return artist ? [artist, venue] : separatedParts;
}

function inferCity(value: string) {
  const normalized = normalizeText(value);

  if (normalized.includes("zapopan")) return "Zapopan";
  if (normalized.includes("tlaquepaque")) return "San Pedro Tlaquepaque";
  if (normalized.includes("tlajomulco")) return "Tlajomulco de Zuniga";
  if (normalized.includes("tonala")) return "Tonala";
  if (normalized.includes("guadalajara") || normalized.includes("jalisco")) {
    return "Guadalajara";
  }

  return null;
}

function formatArtistName(value: string) {
  const normalized = normalizeText(value);

  if (normalized === "julion alvarez") {
    return "Julión Alvarez";
  }

  return value
    .toLowerCase()
    .replace(/\b\p{L}/gu, (letter) => letter.toUpperCase());
}

function getSearchableText(product: KingTicketProduct) {
  return [
    product.name,
    product.slug,
    product.permalink,
    product.short_description,
    product.description,
  ]
    .filter(Boolean)
    .join(" ");
}

function htmlToText(value?: string | null) {
  return cleanTitle(load(value ?? "").text());
}

function cleanTitle(value: string) {
  return value
    .replace(/\bcomprar boletos\b/gi, "")
    .replace(/^\d+\s+/u, "")
    .replace(/\s+/g, " ")
    .replace(/\s*[-–—]\s*$/u, "")
    .trim();
}

function normalizeText(value: string) {
  return htmlToText(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}
