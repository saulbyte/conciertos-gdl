import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

async function main() {
  const [{ prisma }, { syncC3StageEvents }] = await Promise.all([
    import("@/lib/prisma"),
    import("@/lib/event-sources/c3-stage"),
  ]);

  try {
    const result = await syncC3StageEvents(prisma);

    console.log(
      `C3 Stage sync complete. Fetched: ${result.fetched}. Created: ${result.created}. Updated: ${result.updated}. Duplicates: ${result.duplicates}.`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
