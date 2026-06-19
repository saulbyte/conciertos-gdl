import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

async function main() {
  const [{ prisma }, { syncSuperboletosEvents }] = await Promise.all([
    import("@/lib/prisma"),
    import("@/lib/event-sources/superboletos"),
  ]);

  try {
    const result = await syncSuperboletosEvents(prisma);

    console.log(
      `Superboletos sync complete. Fetched: ${result.fetched}. Created: ${result.created}. Updated: ${result.updated}. Duplicates: ${result.duplicates}.`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
