import { createHash, randomUUID } from "node:crypto";
import { InteractionAction, Prisma } from "@prisma/client";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const VISITOR_COOKIE = "conciertos_visitor";
const ONE_YEAR_IN_SECONDS = 60 * 60 * 24 * 365;

type InteractionPayload = {
  action?: string;
  eventId?: string;
  artistId?: string;
  metadata?: unknown;
};

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => null)) as InteractionPayload | null;
  const action = parseAction(payload?.action);

  if (!payload || !action) {
    return NextResponse.json({ error: "Invalid interaction" }, { status: 400 });
  }

  if (!payload.eventId && !payload.artistId) {
    return NextResponse.json({ error: "Missing interaction target" }, { status: 400 });
  }

  const cookieStore = await cookies();
  const existingVisitorId = cookieStore.get(VISITOR_COOKIE)?.value;
  const visitorId = existingVisitorId || randomUUID();
  const visitorHash = createHash("sha256").update(visitorId).digest("hex");

  await prisma.eventInteraction.create({
    data: {
      visitorHash,
      action,
      eventId: payload.eventId,
      artistId: payload.artistId,
      metadata: sanitizeMetadata(payload.metadata),
    },
  });

  const response = NextResponse.json({ ok: true });

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

function parseAction(value?: string) {
  if (!value) return null;

  return Object.values(InteractionAction).includes(value as InteractionAction)
    ? (value as InteractionAction)
    : null;
}

function sanitizeMetadata(value: unknown): Prisma.InputJsonValue | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return undefined;
  }

  const record = value as Record<string, unknown>;
  const metadata: Record<string, Prisma.InputJsonValue> = {};

  for (const [key, rawValue] of Object.entries(record).slice(0, 20)) {
    if (!/^[a-zA-Z0-9_-]{1,40}$/u.test(key)) {
      continue;
    }

    if (
      typeof rawValue === "string" &&
      rawValue.length > 0 &&
      rawValue.length <= 120
    ) {
      metadata[key] = rawValue;
    }

    if (typeof rawValue === "number" && Number.isFinite(rawValue)) {
      metadata[key] = rawValue;
    }

    if (typeof rawValue === "boolean") {
      metadata[key] = rawValue;
    }
  }

  return Object.keys(metadata).length > 0 ? metadata : undefined;
}
