import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id: artistId } = await context.params;
  const body = (await request.json().catch(() => null)) as {
    email?: unknown;
  } | null;
  const email =
    typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";

  if (!EMAIL_PATTERN.test(email)) {
    return NextResponse.json(
      { message: "Escribe un correo valido." },
      { status: 400 },
    );
  }

  const artist = await prisma.artist.findUnique({
    where: { id: artistId },
    select: { id: true, name: true },
  });

  if (!artist) {
    return NextResponse.json(
      { message: "No encontramos ese artista." },
      { status: 404 },
    );
  }

  try {
    await prisma.artistSubscription.upsert({
      where: {
        artistId_email: {
          artistId,
          email,
        },
      },
      create: {
        artistId,
        email,
        active: true,
      },
      update: {
        active: true,
      },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json({
        message: `Ya estabas registrado para avisos de ${artist.name}.`,
      });
    }

    throw error;
  }

  return NextResponse.json({
    message: `Listo, te avisaremos cuando haya conciertos nuevos de ${artist.name}.`,
  });
}
