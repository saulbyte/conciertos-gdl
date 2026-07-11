import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

async function main() {
  const [{ prisma }, { syncFeverEvents }] = await Promise.all([
    import("@/lib/prisma"),
    import("@/lib/event-sources/fever"),
  ]);

  try {
    const result = await syncFeverEvents(prisma);

    console.log(
      `Fever sync complete. Fetched: ${result.fetched}. Created: ${result.created}. Updated: ${result.updated}. Duplicates: ${result.duplicates}. Observed: ${result.observed}.`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
