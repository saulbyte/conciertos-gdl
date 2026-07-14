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

export type PersonalizationRailArtist = {
  id: string;
  name: string;
  imageUrl: string | null;
  fallbackImageUrl: string | null;
  eventCount: number;
  subscriberCount: number;
  nextEvent: {
    id: string;
    eventDate: string;
    venueId: string;
    venueName: string;
    likeCount: number;
    tags: PersonalizationTag[];
  } | null;
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

export type PersonalizedRailSuggestion = {
  id: string;
  title: string;
  description: string;
  eventIds: string[];
};

export function getPersonalizedRailSuggestions(
  events: PersonalizationEvent[],
): PersonalizedRailSuggestion[] {
  const profile = readProfile();

  if (profile.actionCount < 3) {
    return [];
  }

  const usedEventIds = new Set<string>();
  const rails: PersonalizedRailSuggestion[] = [];

  pushRail(rails, usedEventIds, {
    id: "for-you",
    title: "Para ti",
    description: "Una mezcla que empieza a tomar forma con lo que miras, guardas y compartes.",
    eventIds: rankedEvents(profile, events)
      .filter((item) => item.score >= 3)
      .slice(0, 12)
      .map((item) => item.event.id),
  });

  const topGenre = topEntry(profile.interests.genres);
  if (topGenre) {
    pushRail(rails, usedEventIds, {
      id: `genre-${topGenre}`,
      title: "Tu sonido",
      description: "Eventos cercanos a los generos que mas se repiten en tus senales.",
      eventIds: rankedEvents(profile, events)
        .filter((item) => item.event.tags.some((tag) => tag.kind === "GENRE" && tag.slug === topGenre))
        .slice(0, 12)
        .map((item) => item.event.id),
    });
  }

  const topArtist = topEntry(profile.interests.artists);
  if (topArtist) {
    pushRail(rails, usedEventIds, {
      id: `artist-${topArtist}`,
      title: "Mas como esto",
      description: "Fechas que conectan con artistas que ya llamaron tu atencion.",
      eventIds: rankedEvents(profile, events)
        .filter((item) => item.event.artists.some((artist) => artist.id === topArtist))
        .slice(0, 12)
        .map((item) => item.event.id),
    });
  }

  const topVenue = topEntry(profile.interests.venues);
  if (topVenue) {
    pushRail(rails, usedEventIds, {
      id: `venue-${topVenue}`,
      title: "Donde vuelves a mirar",
      description: "Recintos que empiezan a aparecer en tu forma de descubrir.",
      eventIds: rankedEvents(profile, events)
        .filter((item) => item.event.venueId === topVenue)
        .slice(0, 12)
        .map((item) => item.event.id),
    });
  }

  const likesFree = (profile.interests.signals["gratis"] ?? 0) > 0;
  if (likesFree) {
    pushRail(rails, usedEventIds, {
      id: "free-for-you",
      title: "Sin pagar boleto",
      description: "Planes sin costo que encajan mejor con lo que has explorado.",
      eventIds: rankedEvents(profile, events)
        .filter((item) => item.event.admissionType === "FREE")
        .slice(0, 12)
        .map((item) => item.event.id),
    });
  }

  const likesAccessible = (profile.interests.signals["plan-accesible"] ?? 0) > 0;
  if (likesAccessible) {
    pushRail(rails, usedEventIds, {
      id: "accessible-for-you",
      title: "Facil decir que si",
      description: "Opciones que parecen ligeras para armar plan sin pensarlo tanto.",
      eventIds: rankedEvents(profile, events)
        .filter((item) => {
          const price = Math.min(
            item.event.priceMin ?? Number.POSITIVE_INFINITY,
            item.event.priceMax ?? Number.POSITIVE_INFINITY,
          );

          return price <= 500;
        })
        .slice(0, 12)
        .map((item) => item.event.id),
    });
  }

  return rails.slice(0, 4);
}

export function hasPersonalizationSignals() {
  return readProfile().actionCount >= 3;
}

export function getPersonalizedArtistRail(artists: PersonalizationRailArtist[]) {
  const profile = readProfile();
  const hasSignals = profile.actionCount >= 3;

  const rankedArtists = [...artists]
    .map((artist) => ({
      artist,
      score: scoreArtist(profile, artist, hasSignals),
    }))
    .sort((left, right) => {
      const leftDate = left.artist.nextEvent
        ? new Date(left.artist.nextEvent.eventDate).getTime()
        : Number.MAX_VALUE;
      const rightDate = right.artist.nextEvent
        ? new Date(right.artist.nextEvent.eventDate).getTime()
        : Number.MAX_VALUE;

      return (
        right.score -
          left.score ||
        leftDate -
          rightDate ||
        left.artist.name.localeCompare(right.artist.name)
      );
    });
  const personalized = hasSignals
    ? rankedArtists
        .filter((item) => (profile.interests.artists[item.artist.id] ?? 0) > 0)
        .slice(0, 5)
    : [];
  const withDates = rankedArtists
    .filter((item) => item.artist.nextEvent)
    .slice(0, 12);
  const withoutDates = rankedArtists
    .filter((item) => !item.artist.nextEvent)
    .slice(0, 18);
  const candidateArtists = uniqueArtists([
    ...personalized,
    ...interleaveArtistScores(withDates, withoutDates),
    ...rankedArtists,
  ])
    .slice(0, 40)
    .map((item) => item.artist);
  const mixedArtists = balancedArtistMix(candidateArtists, 14);

  return {
    title: hasSignals ? "Artistas para ti" : "Artistas para descubrir",
    artists: mixedArtists,
  };
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

function scoreArtist(
  profile: LocalProfile,
  artist: PersonalizationRailArtist,
  hasSignals: boolean,
) {
  const nextEvent = artist.nextEvent;
  let score = 0;

  if (artist.imageUrl || artist.fallbackImageUrl) score += 8;
  if (artist.eventCount > 1) score += Math.min(artist.eventCount * 3, 12);
  score += Math.min(artist.subscriberCount * 2, 14);

  if (nextEvent) {
    score += 8;
    score += Math.min(nextEvent.likeCount * 2, 14);
    score += Math.max(0, 12 - daysUntil(nextEvent.eventDate) * 0.25);
  } else {
    score += 6;
  }

  if (!hasSignals) {
    return score;
  }

  score += (profile.interests.artists[artist.id] ?? 0) * 2.2;

  if (!nextEvent) {
    return score;
  }

  score += (profile.interests.venues[nextEvent.venueId] ?? 0) * 0.65;

  for (const tag of nextEvent.tags) {
    if (tag.kind === "GENRE") score += (profile.interests.genres[tag.slug] ?? 0) * 1.2;
    if (tag.kind === "FORMAT") score += (profile.interests.formats[tag.slug] ?? 0) * 0.75;
    if (tag.kind === "SIGNAL") score += (profile.interests.signals[tag.slug] ?? 0) * 0.5;
  }

  return score;
}

function interleaveArtistScores<T>(left: T[], right: T[]) {
  const output: T[] = [];
  const length = Math.max(left.length, right.length);

  for (let index = 0; index < length; index += 1) {
    if (left[index]) output.push(left[index]);
    if (right[index]) output.push(right[index]);
  }

  return output;
}

function uniqueArtists(
  items: { artist: PersonalizationRailArtist; score: number }[],
) {
  const seen = new Set<string>();

  return items.filter((item) => {
    if (seen.has(item.artist.id)) {
      return false;
    }

    seen.add(item.artist.id);
    return true;
  });
}

function dailyMixArtists(artists: PersonalizationRailArtist[]) {
  const dateKey = new Date().toISOString().slice(0, 10);

  return [...artists].sort(
    (left, right) =>
      stableMixScore(`${dateKey}:${left.id}`) -
      stableMixScore(`${dateKey}:${right.id}`),
  );
}

function stableMixScore(value: string) {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }

  return hash;
}

function balancedArtistMix(artists: PersonalizationRailArtist[], limit: number) {
  const dateKey = new Date().toISOString().slice(0, 10);
  const withDates = dailyMixArtists(artists.filter((artist) => artist.nextEvent));
  const withoutDates = dailyMixArtists(artists.filter((artist) => !artist.nextEvent));
  const output: PersonalizationRailArtist[] = [];
  const seen = new Set<string>();
  let withIndex = 0;
  let withoutIndex = 0;
  let useDated = stableMixScore(`start:${dateKey}`) % 2 === 0;

  while (output.length < limit && (withIndex < withDates.length || withoutIndex < withoutDates.length)) {
    const source = useDated ? withDates : withoutDates;
    const fallback = useDated ? withoutDates : withDates;
    let picked = source[useDated ? withIndex : withoutIndex];

    if (picked) {
      if (useDated) withIndex += 1;
      else withoutIndex += 1;
    } else {
      picked = fallback[useDated ? withoutIndex : withIndex];
      if (picked) {
        if (useDated) withoutIndex += 1;
        else withIndex += 1;
      }
    }

    if (picked && !seen.has(picked.id)) {
      output.push(picked);
      seen.add(picked.id);
    }

    useDated = !useDated;
  }

  return output;
}

function daysUntil(date: string) {
  const today = new Date();
  const target = new Date(date);
  const diff = target.getTime() - today.getTime();

  return Math.max(0, diff / (1000 * 60 * 60 * 24));
}

function rankedEvents(profile: LocalProfile, events: PersonalizationEvent[]) {
  const seen = new Set([
    ...profile.history.viewedEvents,
    ...profile.history.likedEvents,
    ...profile.history.openedSources,
  ]);

  return events
    .filter((event) => !seen.has(event.id))
    .map((event) => ({
      event,
      score: scoreEvent(profile, event),
    }))
    .sort((left, right) => right.score - left.score);
}

function topEntry(record: Record<string, number>) {
  return Object.entries(record)
    .filter(([, value]) => value > 0)
    .sort((left, right) => right[1] - left[1])[0]?.[0] ?? null;
}

function pushRail(
  rails: PersonalizedRailSuggestion[],
  usedEventIds: Set<string>,
  rail: PersonalizedRailSuggestion,
) {
  const uniqueEventIds = rail.eventIds.filter((eventId) => !usedEventIds.has(eventId));

  if (uniqueEventIds.length < 3) {
    return;
  }

  for (const eventId of uniqueEventIds) {
    usedEventIds.add(eventId);
  }

  rails.push({
    ...rail,
    eventIds: uniqueEventIds,
  });
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
