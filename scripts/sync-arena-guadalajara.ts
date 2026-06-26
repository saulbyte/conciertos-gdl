import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

async function main() {
  const [{ prisma }, { syncArenaGuadalajaraEvents }] = await Promise.all([
    import("@/lib/prisma"),
    import("@/lib/event-sources/arena-guadalajara"),
  ]);

  try {
    const result = await syncArenaGuadalajaraEvents(prisma);

    console.log(
      `Arena Guadalajara sync complete. Fetched: ${result.fetched}. Created: ${result.created}. Updated: ${result.updated}. Duplicates: ${result.duplicates}.`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
