import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

async function main() {
  const { prisma } = await import("../lib/prisma");
  const limit = Number.parseInt(process.argv[2] ?? "30", 10);

  const observations = await prisma.eventObservation.findMany({
    orderBy: { createdAt: "desc" },
    take: Number.isFinite(limit) ? limit : 30,
    include: {
      event: {
        select: {
          title: true,
        },
      },
    },
  });

  for (const observation of observations) {
    const price =
      observation.priceMin || observation.priceMax
        ? ` | precio ${observation.priceMin ?? "?"}-${observation.priceMax ?? "?"} ${observation.currency ?? ""}`.trim()
        : "";
    console.log(
      `${observation.createdAt.toISOString()} | ${observation.type} | ${observation.source} | ${observation.title ?? observation.event?.title ?? "sin titulo"} | ${observation.venueName ?? "sin recinto"}${price}`,
    );
  }

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
