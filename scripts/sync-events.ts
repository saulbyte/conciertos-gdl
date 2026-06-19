import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

async function main() {
  const [{ prisma }, { syncAllEventSources }] = await Promise.all([
    import("@/lib/prisma"),
    import("@/lib/event-sources"),
  ]);

  try {
    const results = await syncAllEventSources(prisma);

    for (const result of results) {
      console.log(
        `${result.source} sync complete. Fetched: ${result.fetched}. Created: ${result.created}. Updated: ${result.updated}. Duplicates: ${result.duplicates}.`,
      );
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
