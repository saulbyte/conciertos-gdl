import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

async function main() {
  const [{ prisma }, { syncFunTicketEvents }] = await Promise.all([
    import("@/lib/prisma"),
    import("@/lib/event-sources/funticket"),
  ]);

  try {
    const result = await syncFunTicketEvents(prisma);

    console.log(
      `FunTicket sync complete. Fetched: ${result.fetched}. Created: ${result.created}. Updated: ${result.updated}. Duplicates: ${result.duplicates}.`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
