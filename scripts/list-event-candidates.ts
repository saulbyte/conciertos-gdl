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
        candidate.venueName ?? "sin recinto",
        candidate.city ?? "sin ciudad",
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
