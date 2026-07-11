import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

const id = process.argv[2];

if (!id) {
  console.error("Uso: npm run candidates:reject -- <candidate-id>");
  process.exit(1);
}

async function main() {
  const [{ prisma }, { rejectEventCandidate }] = await Promise.all([
    import("@/lib/prisma"),
    import("@/lib/discovery/candidates"),
  ]);

  try {
    const candidate = await rejectEventCandidate(prisma, id);

    console.log(`Candidate rejected: ${candidate.id} ${candidate.title}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
