import type { AdmissionType, EventCandidateStatus, Prisma } from "@prisma/client";

export type CandidatePriceValue = number | Prisma.Decimal | null;

export type SearchResult = {
  title: string;
  url: string;
  content: string | null;
  score: number | null;
};

export type CandidateInput = {
  title: string;
  artistName: string;
  description: string | null;
  eventDate: Date | null;
  imageUrl: string | null;
  sourceUrl: string;
  sourceName: string | null;
  venueName: string | null;
  city: string | null;
  admissionType: AdmissionType;
  priceMin?: CandidatePriceValue;
  priceMax?: CandidatePriceValue;
  currency?: string | null;
  confidence: number;
  rawText: string | null;
};

export type CandidateSummary = {
  id: string;
  title: string;
  artistName: string | null;
  status: EventCandidateStatus;
  confidence: number;
  eventDate: Date | null;
  venueName: string | null;
  city: string | null;
  priceMin?: unknown;
  priceMax?: unknown;
  currency?: string | null;
  sourceName: string | null;
  sourceUrl: string;
};

export type DiscoveryResult = {
  queries: number;
  searchResults: number;
  extracted: number;
  created: number;
  updated: number;
  skipped: number;
};
