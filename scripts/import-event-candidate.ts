import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

const id = process.argv[2];

if (!id) {
  console.error("Uso: npm run candidates:import -- <candidate-id>");
  process.exit(1);
}

async function main() {
  const [{ prisma }, { importEventCandidate }] = await Promise.all([
    import("@/lib/prisma"),
    import("@/lib/discovery/candidates"),
  ]);

  try {
    const event = await importEventCandidate(prisma, id);

    console.log(`Candidate imported as event ${event.id}: ${event.title}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
