import { AdmissionType } from "@prisma/client";

type PricingInput = {
  structured?: unknown;
  text?: string | null;
};

export type ExtractedPricing = {
  admissionType?: AdmissionType;
  priceMin?: number | null;
  priceMax?: number | null;
  currency?: string | null;
};

const FREE_PATTERNS = [
  /\bconcierto gratuito\b/iu,
  /\bevento gratuito\b/iu,
  /\bentrada libre\b/iu,
  /\bacceso libre\b/iu,
  /\bentrada gratuita\b/iu,
  /\bacceso gratuito\b/iu,
  /\bsin costo\b/iu,
  /\btotalmente gratis\b/iu,
  /\bgratis\b/iu,
  /\bgratuit[oa]s?\b/iu,
];

const PRICE_PATTERN =
  /(?:(mxn|m\.n\.|pesos|usd)\s*)?\$?\s*(\d{1,3}(?:[,.]\d{3})*(?:[,.]\d{2})?|\d{2,6})(?:\s*(mxn|m\.n\.|pesos|usd))?/giu;
const PRICE_CONTEXT_PATTERN =
  /\b(?:boleto|boletos|entrada|entradas|cover|general|preventa|vip|desde|costo|precio|ticket|tickets|admis[ií]on)\b/iu;

export function extractPricing(input: PricingInput): ExtractedPricing {
  const structuredPrices = extractStructuredPrices(input.structured);
  const text = normalizeWhitespace(input.text ?? "");
  const textPrices = extractTextPrices(text);
  const prices = [...structuredPrices.prices, ...textPrices.prices];
  const currency = structuredPrices.currency ?? textPrices.currency ?? null;

  if (FREE_PATTERNS.some((pattern) => pattern.test(text))) {
    return {
      admissionType: AdmissionType.FREE,
      priceMin: 0,
      priceMax: 0,
      currency: currency ?? "MXN",
    };
  }

  if (prices.length === 0) {
    return {};
  }

  return {
    admissionType: AdmissionType.PAID,
    priceMin: Math.min(...prices),
    priceMax: Math.max(...prices),
    currency: currency ?? "MXN",
  };
}

export function classifyAdmissionFromPricing(
  title: string,
  description: string | null,
) {
  return extractPricing({ text: `${title} ${description ?? ""}` }).admissionType;
}

function extractStructuredPrices(value: unknown) {
  const prices: number[] = [];
  let currency: string | null = null;

  for (const record of flattenRecords(value)) {
    const offer = record.offers;
    const offerRecords = flattenRecords(offer);

    for (const offerRecord of offerRecords) {
      const price = numberValue(offerRecord.price);
      const lowPrice = numberValue(offerRecord.lowPrice);
      const highPrice = numberValue(offerRecord.highPrice);

      if (price !== null) prices.push(price);
      if (lowPrice !== null) prices.push(lowPrice);
      if (highPrice !== null) prices.push(highPrice);

      currency =
        stringValue(offerRecord.priceCurrency) ||
        stringValue(offerRecord.currency) ||
        currency;
    }
  }

  return { prices, currency: normalizeCurrency(currency) };
}

function extractTextPrices(text: string) {
  if (!text || !PRICE_CONTEXT_PATTERN.test(text)) {
    return { prices: [], currency: null };
  }

  const prices: number[] = [];
  let currency: string | null = null;

  for (const match of text.matchAll(PRICE_PATTERN)) {
    const amount = parseAmount(match[2]);

    if (amount === null || amount < 20 || amount > 100_000) {
      continue;
    }

    prices.push(amount);
    currency = normalizeCurrency(match[1] || match[3] || currency);
  }

  return { prices, currency };
}

function parseAmount(value: string) {
  const normalized = value
    .replace(/\s+/g, "")
    .replace(/,/g, "")
    .replace(/(?<=\d)\.(?=\d{3}\b)/g, "");
  const amount = Number(normalized);

  return Number.isFinite(amount) ? amount : null;
}

function normalizeCurrency(value?: string | null) {
  if (!value) {
    return null;
  }

  const normalized = value.toLowerCase().replace(/\./g, "").trim();

  if (normalized === "usd") return "USD";

  return "MXN";
}

function flattenRecords(value: unknown): Array<Record<string, unknown>> {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value.flatMap(flattenRecords);
  }

  if (!isRecord(value)) {
    return [];
  }

  const graph = value["@graph"];

  if (Array.isArray(graph)) {
    return [value, ...graph.flatMap(flattenRecords)];
  }

  return [value];
}

function numberValue(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    return parseAmount(value);
  }

  return null;
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value : null;
}

function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
