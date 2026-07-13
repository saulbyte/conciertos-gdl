import { EventCandidateStatus } from "@prisma/client";
import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

const statusArg = process.argv
  .find((arg) => arg.startsWith("--status="))
  ?.replace("--status=", "")
  .toUpperCase();

const status = statusArg
  ? EventCandidateStatus[
      statusArg as keyof typeof EventCandidateStatus
    ]
  : EventCandidateStatus.PENDING;

if (!status) {
  console.error(
    `Status invalido. Usa: ${Object.values(EventCandidateStatus).join(", ")}`,
  );
  process.exit(1);
}

async function main() {
  const [{ prisma }, { listEventCandidates }] = await Promise.all([
    import("@/lib/prisma"),
    import("@/lib/discovery/candidates"),
  ]);

  try {
    const candidates = await listEventCandidates(prisma, status);

    if (candidates.length === 0) {
      console.log(`No hay candidatos con status ${status}.`);
      return;
    }

    for (const candidate of candidates) {
      console.log([
        candidate.id,
        `[${candidate.confidence}]`,
        candidate.eventDate?.toISOString().slice(0, 10) ?? "sin fecha",
        candidate.artistName ?? "sin artista",
        candidate.venueName ?? "sin recinto",
        candidate.city ?? "sin ciudad",
        formatCandidatePrice(candidate),
        candidate.title,
        candidate.sourceUrl,
      ].join(" | "));
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

function formatCandidatePrice(candidate: {
  priceMin?: unknown;
  priceMax?: unknown;
  currency?: string | null;
}) {
  const min = candidate.priceMin ? Number(candidate.priceMin) : null;
  const max = candidate.priceMax ? Number(candidate.priceMax) : null;
  const currency = candidate.currency ?? "MXN";

  if (min !== null && max !== null && min !== max) {
    return `${min}-${max} ${currency}`;
  }

  if (min !== null) {
    return `desde ${min} ${currency}`;
  }

  if (max !== null) {
    return `hasta ${max} ${currency}`;
  }

  return "sin precio";
}
