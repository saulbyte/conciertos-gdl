const TITLE_PREFIXES = [
  /^boletos?\s+(para|de)\s+/i,
  /^concierto\s+(de|para)\s+/i,
  /^presentacion\s+(de|para)\s+/i,
  /^show\s+(de|para)\s+/i,
];

type NormalizableDiscoveryEvent = {
  title: string;
  artistName?: string | null;
  venueName?: string | null;
};

export function normalizeDiscoveredEventData(
  event: NormalizableDiscoveryEvent,
) {
  const artistName = normalizePersonOrEventName(
    event.artistName ?? extractArtistFromTitle(event.title),
  );
  const title = normalizeDiscoveredEventTitle({
    title: event.title,
    artistName,
    venueName: event.venueName,
  });

  return {
    artistName,
    title,
  };
}

export function normalizeDiscoveredEventTitle(
  event: NormalizableDiscoveryEvent,
) {
  const artistName = normalizePersonOrEventName(event.artistName);

  if (artistName) {
    return artistName;
  }

  return (
    normalizePersonOrEventName(extractArtistFromTitle(event.title)) ??
    event.title.trim()
  );
}

export function extractArtistFromTitle(title: string) {
  const firstSegment = title.split(/\s+@\s+|@/)[0] ?? title;
  return stripKnownPrefixes(firstSegment).trim();
}

function normalizePersonOrEventName(value?: string | null) {
  if (!value) {
    return null;
  }

  const cleaned = stripKnownPrefixes(value)
    .replace(/\s+/g, " ")
    .replace(/\s+@\s+.*$/g, "")
    .trim();

  return cleaned.length > 0 ? cleaned : null;
}

function stripKnownPrefixes(value: string) {
  return TITLE_PREFIXES.reduce(
    (current, pattern) => current.replace(pattern, ""),
    value,
  );
}
