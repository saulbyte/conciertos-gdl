import { AdmissionType } from "@prisma/client";
import { extractPricing } from "@/lib/event-sources/pricing";

export function classifyAdmission(
  title: string,
  description: string | null,
): AdmissionType {
  const pricing = extractPricing({
    text: normalizeText(`${title} ${description ?? ""}`),
  });

  if (pricing.admissionType) {
    return pricing.admissionType;
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
