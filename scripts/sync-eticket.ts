import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

async function main() {
  const [{ prisma }, { syncEticketEvents }] = await Promise.all([
    import("@/lib/prisma"),
    import("@/lib/event-sources/eticket"),
  ]);

  try {
    const result = await syncEticketEvents(prisma);

    console.log(
      `eTicket sync complete. Fetched: ${result.fetched}. Created: ${result.created}. Updated: ${result.updated}. Duplicates: ${result.duplicates}.`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
