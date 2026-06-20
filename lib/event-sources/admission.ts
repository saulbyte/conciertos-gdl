import { AdmissionType } from "@prisma/client";

const FREE_DESCRIPTION_PATTERNS = [
  /\bconcierto gratuito\b/,
  /\bevento gratuito\b/,
  /\bentrada libre\b/,
  /\bacceso libre\b/,
  /\bentrada gratuita\b/,
  /\bacceso gratuito\b/,
  /\bsin costo\b/,
  /\btotalmente gratis\b/,
];

export function classifyAdmission(
  title: string,
  description: string | null,
): AdmissionType {
  const normalizedTitle = normalizeText(title);
  const normalizedDescription = normalizeText(description ?? "");

  if (
    /\bgratis\b/.test(normalizedTitle) ||
    /\bgratuit[oa]s?\b/.test(normalizedTitle) ||
    FREE_DESCRIPTION_PATTERNS.some((pattern) =>
      pattern.test(normalizedDescription),
    )
  ) {
    return AdmissionType.FREE;
  }

  return AdmissionType.UNKNOWN;
}

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}
