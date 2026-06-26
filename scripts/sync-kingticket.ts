import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

async function main() {
  const [{ prisma }, { syncKingTicketEvents }] = await Promise.all([
    import("@/lib/prisma"),
    import("@/lib/event-sources/kingticket"),
  ]);

  try {
    const result = await syncKingTicketEvents(prisma);

    console.log(
      `KingTicket sync complete. Fetched: ${result.fetched}. Created: ${result.created}. Updated: ${result.updated}. Duplicates: ${result.duplicates}.`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
