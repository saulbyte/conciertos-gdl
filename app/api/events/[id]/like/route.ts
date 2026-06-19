import { createHash, randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const VISITOR_COOKIE = "conciertos_visitor";
const ONE_YEAR_IN_SECONDS = 60 * 60 * 24 * 365;

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id: eventId } = await context.params;
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { id: true },
  });

  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  const cookieStore = await cookies();
  const existingVisitorId = cookieStore.get(VISITOR_COOKIE)?.value;
  const visitorId = existingVisitorId || randomUUID();
  const visitorHash = createHash("sha256").update(visitorId).digest("hex");
  let created = false;

  try {
    await prisma.eventLike.create({
      data: { eventId, visitorHash },
    });
    created = true;
  } catch (error) {
    if (
      !(error instanceof Prisma.PrismaClientKnownRequestError) ||
      error.code !== "P2002"
    ) {
      throw error;
    }
  }

  const count = await prisma.eventLike.count({ where: { eventId } });
  const response = NextResponse.json({ count, created });

  if (!existingVisitorId) {
    response.cookies.set(VISITOR_COOKIE, visitorId, {
      httpOnly: true,
      maxAge: ONE_YEAR_IN_SECONDS,
      path: "/",
      sameSite: "lax",
      secure: new URL(request.url).protocol === "https:",
    });
  }

  return response;
}
