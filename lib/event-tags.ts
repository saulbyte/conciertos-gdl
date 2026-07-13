import { TagKind, type EventSource, type PrismaClient } from "@prisma/client";
import type { ExternalEvent, ExternalEventTag } from "@/lib/event-sources/types";

type PersistEventTagsInput = {
  eventId: string;
  artistIds: string[];
  source: EventSource;
  event: ExternalEvent;
};

type NormalizedTag = {
  slug: string;
  name: string;
  kind: TagKind;
  confidence: number;
  source: string;
};

const MAX_TAGS_PER_EVENT = 8;

const TAG_SYNONYMS: Record<string, { name: string; kind: TagKind }> = {
  "alternative rock": { name: "Rock", kind: TagKind.GENRE },
  "alternativo": { name: "Alternativo", kind: TagKind.GENRE },
  "banda": { name: "Regional mexicano", kind: TagKind.GENRE },
  "ballads romantic": { name: "Pop", kind: TagKind.GENRE },
  "candlelight": { name: "Experiencia inmersiva", kind: TagKind.FORMAT },
  "clasica": { name: "Clásica", kind: TagKind.GENRE },
  "classical": { name: "Clásica", kind: TagKind.GENRE },
  "classical vocal": { name: "Clásica", kind: TagKind.GENRE },
  "clasico": { name: "Clásica", kind: TagKind.GENRE },
  "club": { name: "Club", kind: TagKind.FORMAT },
  "club dance": { name: "Electrónica", kind: TagKind.GENRE },
  "concierto": { name: "Concierto", kind: TagKind.FORMAT },
  "dance electronic": { name: "Electrónica", kind: TagKind.GENRE },
  "dancehall reggae": { name: "Reggae", kind: TagKind.GENRE },
  "electro pop": { name: "Pop", kind: TagKind.GENRE },
  "electronica": { name: "Electrónica", kind: TagKind.GENRE },
  "festival": { name: "Festival", kind: TagKind.FORMAT },
  "folk": { name: "Folk", kind: TagKind.GENRE },
  "gratis": { name: "Gratis", kind: TagKind.SIGNAL },
  "heavy metal": { name: "Metal", kind: TagKind.GENRE },
  "hip hop": { name: "Hip hop", kind: TagKind.GENRE },
  "hip hop rap": { name: "Hip hop", kind: TagKind.GENRE },
  "indie": { name: "Indie", kind: TagKind.GENRE },
  "indie folk": { name: "Indie", kind: TagKind.GENRE },
  "japanese rock": { name: "Rock", kind: TagKind.GENRE },
  "jazz": { name: "Jazz", kind: TagKind.GENRE },
  "latin electronica": { name: "Electrónica", kind: TagKind.GENRE },
  "latin pop": { name: "Pop", kind: TagKind.GENRE },
  "latin rap": { name: "Hip hop", kind: TagKind.GENRE },
  "latin rock": { name: "Rock", kind: TagKind.GENRE },
  "mariachi": { name: "Regional mexicano", kind: TagKind.GENRE },
  "metal": { name: "Metal", kind: TagKind.GENRE },
  "norteno": { name: "Regional mexicano", kind: TagKind.GENRE },
  "nu metal": { name: "Metal", kind: TagKind.GENRE },
  "pop": { name: "Pop", kind: TagKind.GENRE },
  "pop rock": { name: "Rock", kind: TagKind.GENRE },
  "pop vocal": { name: "Pop", kind: TagKind.GENRE },
  "r y b": { name: "R&B", kind: TagKind.GENRE },
  "reggae": { name: "Reggae", kind: TagKind.GENRE },
  "reggaeton": { name: "Reggaetón", kind: TagKind.GENRE },
  "regional mexicano": { name: "Regional mexicano", kind: TagKind.GENRE },
  "religious": { name: "Religiosa", kind: TagKind.GENRE },
  "rock": { name: "Rock", kind: TagKind.GENRE },
  "salsa": { name: "Salsa", kind: TagKind.GENRE },
  "singer vocalist": { name: "Pop", kind: TagKind.GENRE },
  "soul": { name: "Soul", kind: TagKind.GENRE },
  "sonidero": { name: "Sonidero", kind: TagKind.GENRE },
  "trap": { name: "Trap", kind: TagKind.GENRE },
  "trova": { name: "Trova", kind: TagKind.GENRE },
  "tributo": { name: "Tributo", kind: TagKind.FORMAT },
  "urban": { name: "Urbano", kind: TagKind.GENRE },
};

const IGNORED_EXTERNAL_TAGS = new Set([
  "artist",
  "band",
  "concert",
  "event style",
  "group",
  "individual",
  "music",
  "musician",
  "other",
  "world",
]);

const TEXT_RULES: Array<{
  pattern: RegExp;
  name: string;
  kind: TagKind;
  confidence: number;
}> = [
  { pattern: /\b(regional mexicano|banda|mariachi|norteñ[oa]|norteno)\b/iu, name: "Regional mexicano", kind: TagKind.GENRE, confidence: 82 },
  { pattern: /\b(rock|punk|garage|ska)\b/iu, name: "Rock", kind: TagKind.GENRE, confidence: 76 },
  { pattern: /\b(metal|heavy metal|death metal|black metal)\b/iu, name: "Metal", kind: TagKind.GENRE, confidence: 78 },
  { pattern: /\b(electr[oó]nica|dj|techno|house|trance)\b/iu, name: "Electrónica", kind: TagKind.GENRE, confidence: 76 },
  { pattern: /\b(jazz|soul|blues)\b/iu, name: "Jazz", kind: TagKind.GENRE, confidence: 74 },
  { pattern: /\b(pop|latin pop)\b/iu, name: "Pop", kind: TagKind.GENRE, confidence: 70 },
  { pattern: /\b(indie|alternativ[oa])\b/iu, name: "Indie", kind: TagKind.GENRE, confidence: 70 },
  { pattern: /\b(hip hop|rap|trap)\b/iu, name: "Hip hop", kind: TagKind.GENRE, confidence: 70 },
  { pattern: /\b(festival|fest)\b/iu, name: "Festival", kind: TagKind.FORMAT, confidence: 72 },
  { pattern: /\b(tributo|tribute)\b/iu, name: "Tributo", kind: TagKind.FORMAT, confidence: 74 },
  { pattern: /\b(candlelight|inmersiv[oa]|ballet of lights)\b/iu, name: "Experiencia inmersiva", kind: TagKind.FORMAT, confidence: 76 },
];

export async function persistEventTags(
  prisma: PrismaClient,
  input: PersistEventTagsInput,
) {
  const tags = normalizeEventTags(input.event, input.source);

  await prisma.eventTag.deleteMany({
    where: { eventId: input.eventId },
  });

  for (const tag of tags) {
    const savedTag = await prisma.tag.upsert({
      where: {
        slug_kind: {
          slug: tag.slug,
          kind: tag.kind,
        },
      },
      create: {
        slug: tag.slug,
        name: tag.name,
        kind: tag.kind,
      },
      update: {
        name: tag.name,
      },
    });

    await prisma.eventTag.upsert({
      where: {
        eventId_tagId: {
          eventId: input.eventId,
          tagId: savedTag.id,
        },
      },
      create: {
        eventId: input.eventId,
        tagId: savedTag.id,
        confidence: tag.confidence,
        source: tag.source,
      },
      update: {
        confidence: Math.max(tag.confidence, 60),
        source: tag.source,
      },
    });

    if (tag.kind === TagKind.GENRE || tag.kind === TagKind.FORMAT) {
      for (const artistId of input.artistIds) {
        await prisma.artistTag.upsert({
          where: {
            artistId_tagId: {
              artistId,
              tagId: savedTag.id,
            },
          },
          create: {
            artistId,
            tagId: savedTag.id,
            confidence: Math.max(tag.confidence - 8, 55),
            source: tag.source,
          },
          update: {
            confidence: Math.max(tag.confidence - 8, 55),
            source: tag.source,
          },
        });
      }
    }
  }
}

export function normalizeEventTags(
  event: ExternalEvent,
  source: EventSource,
): NormalizedTag[] {
  const candidates: NormalizedTag[] = [
    ...normalizeExternalTags(event.tags ?? [], source),
    ...inferTagsFromText(event, source),
  ];

  if (event.priceMin === 0 || event.priceMax === 0 || isFreeText(event)) {
    candidates.push(toTag("Gratis", TagKind.SIGNAL, 90, "admission"));
  }

  if (
    typeof event.priceMin === "number" &&
    event.priceMin > 0 &&
    event.priceMin <= 500
  ) {
    candidates.push(toTag("Plan accesible", TagKind.SIGNAL, 74, "pricing"));
  }

  if (isIntimateVenue(event.venue.name)) {
    candidates.push(toTag("Recinto íntimo", TagKind.FORMAT, 66, "venue"));
  }

  return dedupeTags(candidates).slice(0, MAX_TAGS_PER_EVENT);
}

function normalizeExternalTags(tags: ExternalEventTag[], source: EventSource) {
  return tags
    .map((tag) =>
      toKnownTag(
        tag.name,
        tag.kind ? (tag.kind as TagKind) : undefined,
        tag.confidence ?? 80,
        tag.source ?? source,
      ),
    )
    .filter((tag): tag is NormalizedTag => Boolean(tag));
}

function inferTagsFromText(event: ExternalEvent, source: EventSource) {
  const text = [
    event.title,
    event.description,
    event.venue.name,
    ...event.artists.map((artist) => (typeof artist === "string" ? artist : artist.name)),
  ]
    .filter(Boolean)
    .join(" ");

  return TEXT_RULES
    .filter((rule) => rule.pattern.test(text))
    .map((rule) => toTag(rule.name, rule.kind, rule.confidence, source));
}

function toKnownTag(
  value: string,
  fallbackKind: TagKind | undefined,
  confidence: number,
  source: string,
) {
  const clean = value.trim();
  const normalized = normalizeKey(clean);

  if (IGNORED_EXTERNAL_TAGS.has(normalized)) {
    return null;
  }

  const known = TAG_SYNONYMS[normalized];

  if (!known && source === "ticketmaster-classification") {
    return null;
  }

  if (!known && clean.length < 3) {
    return null;
  }

  return toTag(
    known?.name ?? titleCase(clean),
    known?.kind ?? fallbackKind ?? TagKind.GENRE,
    confidence,
    source,
  );
}

function toTag(
  name: string,
  kind: TagKind,
  confidence: number,
  source: string,
): NormalizedTag {
  return {
    slug: slugify(name),
    name,
    kind,
    confidence: Math.max(0, Math.min(100, Math.round(confidence))),
    source: String(source),
  };
}

function dedupeTags(tags: NormalizedTag[]) {
  const byKey = new Map<string, NormalizedTag>();

  for (const tag of tags) {
    const key = `${tag.kind}:${tag.slug}`;
    const existing = byKey.get(key);

    if (!existing || tag.confidence > existing.confidence) {
      byKey.set(key, tag);
    }
  }

  return [...byKey.values()].sort(
    (left, right) =>
      right.confidence - left.confidence ||
      left.name.localeCompare(right.name, "es"),
  );
}

function isIntimateVenue(value: string) {
  return /(foro|c3|bar|rooftop|club|cuerda|anestesia|echo)/iu.test(value);
}

function isFreeText(event: ExternalEvent) {
  return /\b(gratis|gratuit[oa]|entrada libre|acceso libre|sin costo)\b/iu.test(
    `${event.title} ${event.description ?? ""}`,
  );
}

function slugify(value: string) {
  return normalizeKey(value).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function normalizeKey(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " y ")
    .replace(/\s+/g, " ")
    .trim();
}

function titleCase(value: string) {
  return normalizeKey(value)
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
