import { getEvents } from "@/lib/events";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const events = await getEvents({
    query: searchParams.get("q") ?? undefined,
    venue: searchParams.get("venue") ?? undefined,
    from: searchParams.get("from") ?? undefined,
    to: searchParams.get("to") ?? undefined,
    admission: searchParams.get("admission") === "free" ? "free" : undefined,
    when: searchParams.get("when") === "weekend" ? "weekend" : undefined,
  });

  return Response.json({ events });
}
