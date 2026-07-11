import type { SearchResult } from "@/lib/discovery/types";
import { fetchHtml } from "@/lib/event-sources/http";

const TAVILY_SEARCH_URL = "https://api.tavily.com/search";

const DEFAULT_QUERIES = [
  "concierto gratis Guadalajara 2026",
  "evento musical gratuito Guadalajara 2026",
  "festival musica Guadalajara entrada libre",
  "concierto Zapopan gratis 2026",
  "site:jalisco.gob.mx Guadalajara concierto gratis",
  "site:guadalajara.gob.mx musica concierto Guadalajara",
  "site:zapopan.gob.mx concierto festival musica",
  "site:fiestasdeoctubre.jalisco.gob.mx concierto Guadalajara",
  "Golden Ganga Guadalajara gratis Auditorio Benito Juarez",
];

const DEFAULT_SEED_URLS = [
  "https://www.songkick.com/es/metro-areas/31015-mexico-guadalajara",
];

type TavilyResponse = {
  results?: Array<{
    title?: string;
    url?: string;
    content?: string;
    score?: number;
  }>;
};

export function getDiscoveryQueries() {
  const customQueries = process.env.DISCOVERY_QUERIES?.split("|")
    .map((query) => query.trim())
    .filter(Boolean);

  return customQueries?.length ? customQueries : DEFAULT_QUERIES;
}

export function getDiscoverySeedUrls() {
  const customSeeds = process.env.DISCOVERY_SEED_URLS?.split("|")
    .map((url) => url.trim())
    .filter(Boolean);

  return customSeeds?.length ? customSeeds : DEFAULT_SEED_URLS;
}

export async function getDiscoverySeedResults(): Promise<SearchResult[]> {
  const results: SearchResult[] = [];

  for (const seedUrl of getDiscoverySeedUrls()) {
    const html = await fetchHtml(seedUrl, 30_000);
    const links = parseCandidateLinks(html, seedUrl);

    results.push(...links);
  }

  return [...new Map(results.map((result) => [result.url, result])).values()];
}

export async function searchDiscoveryCandidates(
  query: string,
  maxResults = 8,
): Promise<SearchResult[]> {
  const apiKey = process.env.TAVILY_API_KEY;

  if (!apiKey) {
    throw new Error(
      "Missing TAVILY_API_KEY. Crea una API key en Tavily y agregala a .env.local/Vercel para usar discover:events.",
    );
  }

  const response = await fetch(TAVILY_SEARCH_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      api_key: apiKey,
      query,
      search_depth: "basic",
      include_answer: false,
      include_images: false,
      max_results: maxResults,
    }),
    signal: AbortSignal.timeout(30_000),
  });

  if (!response.ok) {
    throw new Error(
      `Tavily search failed for "${query}": ${response.status} ${response.statusText}`,
    );
  }

  const payload = (await response.json()) as TavilyResponse;

  return (payload.results ?? [])
    .filter((result) => result.url && result.title)
    .map((result) => ({
      title: result.title ?? "",
      url: normalizeUrl(result.url ?? ""),
      content: result.content ?? null,
      score: typeof result.score === "number" ? result.score : null,
    }));
}

function normalizeUrl(url: string) {
  const parsed = new URL(url);

  parsed.hash = "";

  return parsed.toString();
}

function parseCandidateLinks(html: string, seedUrl: string): SearchResult[] {
  const baseUrl = new URL(seedUrl);
  const matches = [...html.matchAll(/href="([^"]*\/concerts\/\d+[^"]*)"/giu)];

  return [...new Set(matches.map((match) => match[1]))].map((href) => {
    const url = new URL(href, baseUrl.origin);
    url.hash = "";

    return {
      title: "Songkick Guadalajara",
      url: url.toString().split("?")[0],
      content: null,
      score: null,
    };
  });
}
