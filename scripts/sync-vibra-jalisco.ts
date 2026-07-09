import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

async function main() {
  const [{ prisma }, { syncVibraJaliscoEvents }] = await Promise.all([
    import("@/lib/prisma"),
    import("@/lib/event-sources/vibra-jalisco"),
  ]);

  try {
    const result = await syncVibraJaliscoEvents(prisma);

    console.log(
      `Vibra Jalisco sync complete. Fetched: ${result.fetched}. Created: ${result.created}. Updated: ${result.updated}. Duplicates: ${result.duplicates}.`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
