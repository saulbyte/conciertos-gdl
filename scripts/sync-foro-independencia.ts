import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

async function main() {
  const [{ prisma }, { syncForoIndependenciaEvents }] = await Promise.all([
    import("@/lib/prisma"),
    import("@/lib/event-sources/foro-independencia"),
  ]);

  try {
    const result = await syncForoIndependenciaEvents(prisma);

    console.log(
      `Foro Independencia sync complete. Fetched: ${result.fetched}. Created: ${result.created}. Updated: ${result.updated}. Duplicates: ${result.duplicates}.`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
