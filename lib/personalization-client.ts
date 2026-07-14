"use client";

export type PersonalizationTag = {
  slug: string;
  name: string;
  kind: "GENRE" | "FORMAT" | "SIGNAL";
  confidence: number;
};

export type PersonalizationArtist = {
  id: string;
  name: string;
};

export type PersonalizationEvent = {
  id: string;
  title: string;
  venueId: string;
  venueName: string;
  source: string;
  admissionType?: string | null;
  priceMin?: number | null;
  priceMax?: number | null;
  artists: PersonalizationArtist[];
  tags: PersonalizationTag[];
};

export type InteractionAction =
  | "EVENT_VIEW"
  | "EVENT_LIKE"
  | "EVENT_SHARE"
  | "SOURCE_OPEN"
  | "ARTIST_VIEW"
  | "ARTIST_SUBSCRIBE";

type LocalProfile = {
  version: 1;
  updatedAt: string;
  actionCount: number;
  interests: {
    genres: Record<string, number>;
    formats: Record<string, number>;
    signals: Record<string, number>;
    artists: Record<string, number>;
    venues: Record<string, number>;
  };
  history: {
    viewedEvents: string[];
    likedEvents: string[];
    sharedEvents: string[];
    openedSources: string[];
    viewedArtists: string[];
  };
};

const STORAGE_KEY = "revera:profile:v1";
const MAX_HISTORY = 80;

const ACTION_WEIGHTS: Record<InteractionAction, number> = {
  EVENT_VIEW: 1,
  EVENT_LIKE: 5,
  EVENT_SHARE: 6,
  SOURCE_OPEN: 4,
  ARTIST_VIEW: 2,
  ARTIST_SUBSCRIBE: 7,
};

export function trackEventInteraction(
  action: InteractionAction,
  event: PersonalizationEvent,
) {
  const profile = readProfile();
  const weight = ACTION_WEIGHTS[action] ?? 1;

  for (const tag of event.tags) {
    const tagWeight = Math.max(0.6, tag.confidence / 100) * weight;

    if (tag.kind === "GENRE") increment(profile.interests.genres, tag.slug, tagWeight);
    if (tag.kind === "FORMAT") increment(profile.interests.formats, tag.slug, tagWeight);
    if (tag.kind === "SIGNAL") increment(profile.interests.signals, tag.slug, tagWeight);
  }

  for (const artist of event.artists) {
    increment(profile.interests.artists, artist.id, weight);
  }

  increment(profile.interests.venues, event.venueId, Math.max(1, weight * 0.65));
  profile.actionCount += 1;
  profile.updatedAt = new Date().toISOString();

  if (action === "EVENT_VIEW") pushHistory(profile.history.viewedEvents, event.id);
  if (action === "EVENT_LIKE") pushHistory(profile.history.likedEvents, event.id);
  if (action === "EVENT_SHARE") pushHistory(profile.history.sharedEvents, event.id);
  if (action === "SOURCE_OPEN") pushHistory(profile.history.openedSources, event.id);

  writeProfile(profile);
  reportInteraction(action, event);
  window.dispatchEvent(new CustomEvent("revera:profile-updated"));
}

export function trackArtistInteraction(
  action: Extract<InteractionAction, "ARTIST_VIEW" | "ARTIST_SUBSCRIBE">,
  artistId: string,
) {
  const profile = readProfile();
  const weight = ACTION_WEIGHTS[action] ?? 1;

  increment(profile.interests.artists, artistId, weight);
  pushHistory(profile.history.viewedArtists, artistId);
  profile.actionCount += 1;
  profile.updatedAt = new Date().toISOString();

  writeProfile(profile);
  reportInteraction(action, undefined, artistId);
  window.dispatchEvent(new CustomEvent("revera:profile-updated"));
}

export function getRecommendedEventIds(events: PersonalizationEvent[]) {
  const profile = readProfile();

  if (profile.actionCount < 3) {
    return [];
  }

  const seen = new Set([
    ...profile.history.viewedEvents,
    ...profile.history.likedEvents,
    ...profile.history.openedSources,
  ]);

  return events
    .map((event) => ({
      id: event.id,
      score: scoreEvent(profile, event),
    }))
    .filter((item) => item.score >= 3)
    .filter((item) => !seen.has(item.id))
    .sort((left, right) => right.score - left.score)
    .slice(0, 12)
    .map((item) => item.id);
}

export function hasPersonalizationSignals() {
  return readProfile().actionCount >= 3;
}

function scoreEvent(profile: LocalProfile, event: PersonalizationEvent) {
  let score = 0;

  for (const tag of event.tags) {
    if (tag.kind === "GENRE") score += profile.interests.genres[tag.slug] ?? 0;
    if (tag.kind === "FORMAT") score += (profile.interests.formats[tag.slug] ?? 0) * 0.85;
    if (tag.kind === "SIGNAL") score += (profile.interests.signals[tag.slug] ?? 0) * 0.7;
  }

  for (const artist of event.artists) {
    score += (profile.interests.artists[artist.id] ?? 0) * 1.2;
  }

  score += (profile.interests.venues[event.venueId] ?? 0) * 0.45;

  return score;
}

function readProfile(): LocalProfile {
  if (typeof window === "undefined") return createProfile();

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as LocalProfile) : null;

    if (parsed?.version === 1) {
      return parsed;
    }
  } catch {
    // Corrupt local data should not break discovery.
  }

  return createProfile();
}

function writeProfile(profile: LocalProfile) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  } catch {
    // Storage can be unavailable in private modes.
  }
}

function createProfile(): LocalProfile {
  return {
    version: 1,
    updatedAt: new Date().toISOString(),
    actionCount: 0,
    interests: {
      genres: {},
      formats: {},
      signals: {},
      artists: {},
      venues: {},
    },
    history: {
      viewedEvents: [],
      likedEvents: [],
      sharedEvents: [],
      openedSources: [],
      viewedArtists: [],
    },
  };
}

function increment(record: Record<string, number>, key: string, amount: number) {
  record[key] = Number(((record[key] ?? 0) + amount).toFixed(2));
}

function pushHistory(values: string[], value: string) {
  const next = [value, ...values.filter((item) => item !== value)].slice(0, MAX_HISTORY);
  values.splice(0, values.length, ...next);
}

function reportInteraction(
  action: InteractionAction,
  event?: PersonalizationEvent,
  artistId?: string,
) {
  const metadata = event
    ? {
        source: event.source,
        venueId: event.venueId,
        tagSlugs: event.tags.slice(0, 8).map((tag) => tag.slug).join(","),
      }
    : undefined;

  const body = JSON.stringify({
    action,
    eventId: event?.id,
    artistId,
    metadata,
  });

  if (navigator.sendBeacon) {
    navigator.sendBeacon(
      "/api/interactions",
      new Blob([body], { type: "application/json" }),
    );
    return;
  }

  fetch("/api/interactions", {
    body,
    headers: { "Content-Type": "application/json" },
    keepalive: true,
    method: "POST",
  }).catch(() => undefined);
}
