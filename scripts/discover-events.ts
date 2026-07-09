import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

async function main() {
  const [{ prisma }, { discoverEventCandidates }] = await Promise.all([
    import("@/lib/prisma"),
    import("@/lib/discovery/candidates"),
  ]);

  try {
    const result = await discoverEventCandidates(prisma);

    console.log(
      `Discovery complete. Queries: ${result.queries}. Search results: ${result.searchResults}. Extracted: ${result.extracted}. Created: ${result.created}. Updated: ${result.updated}. Skipped: ${result.skipped}.`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
