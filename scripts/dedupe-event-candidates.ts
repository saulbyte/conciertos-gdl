import { loadEnvConfig } from "@next/env";
import { EventCandidateStatus } from "@prisma/client";
import { findExistingEventDuplicate } from "../lib/discovery/dedupe";

loadEnvConfig(process.cwd());

async function main() {
  const { prisma } = await import("../lib/prisma");

  const candidates = await prisma.eventCandidate.findMany({
    where: {
      status: EventCandidateStatus.PENDING,
      eventDate: { not: null },
      artistName: { not: null },
    },
    orderBy: [{ confidence: "desc" }, { createdAt: "desc" }],
  });

  let rejected = 0;
  let kept = 0;

  for (const candidate of candidates) {
    if (!candidate.eventDate || !candidate.artistName) {
      kept += 1;
      continue;
    }

    const duplicate = await findExistingEventDuplicate(prisma, {
      title: candidate.title,
      artistName: candidate.artistName,
      description: candidate.description,
      eventDate: candidate.eventDate,
      imageUrl: candidate.imageUrl,
      sourceUrl: candidate.sourceUrl,
      sourceName: candidate.sourceName,
      venueName: candidate.venueName,
      city: candidate.city,
      admissionType: candidate.admissionType,
      confidence: candidate.confidence,
      rawText: candidate.rawText,
    });

    if (!duplicate) {
      kept += 1;
      continue;
    }

    await prisma.eventCandidate.update({
      where: { id: candidate.id },
      data: {
        status: EventCandidateStatus.REJECTED,
        reviewedAt: new Date(),
      },
    });

    rejected += 1;
    console.log(
      `Duplicado rechazado: ${candidate.title} -> evento ${duplicate.id}`,
    );
  }

  await prisma.$disconnect();
  console.log(
    `Listo. Candidatos revisados: ${candidates.length}. Rechazados por duplicado: ${rejected}. Conservados: ${kept}.`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
