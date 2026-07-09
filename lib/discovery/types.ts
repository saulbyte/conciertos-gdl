import type { AdmissionType, EventCandidateStatus } from "@prisma/client";

export type SearchResult = {
  title: string;
  url: string;
  content: string | null;
  score: number | null;
};

export type CandidateInput = {
  title: string;
  description: string | null;
  eventDate: Date | null;
  imageUrl: string | null;
  sourceUrl: string;
  sourceName: string | null;
  venueName: string | null;
  city: string | null;
  admissionType: AdmissionType;
  confidence: number;
  rawText: string | null;
};

export type CandidateSummary = {
  id: string;
  title: string;
  status: EventCandidateStatus;
  confidence: number;
  eventDate: Date | null;
  venueName: string | null;
  city: string | null;
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
