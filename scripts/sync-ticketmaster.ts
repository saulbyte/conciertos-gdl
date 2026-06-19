import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

async function main() {
  const [{ prisma }, { syncTicketmasterEvents }] = await Promise.all([
    import("@/lib/prisma"),
    import("@/lib/ticketmaster"),
  ]);

  try {
    const result = await syncTicketmasterEvents(prisma);

    console.log(
      `Ticketmaster sync complete. Fetched: ${result.fetched}. Created: ${result.created}. Updated: ${result.updated}. Duplicates: ${result.duplicates}.`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
