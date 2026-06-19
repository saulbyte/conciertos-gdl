import { getEventById } from "@/lib/events";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const event = await getEventById(id);

  if (!event) {
    return Response.json({ error: "Event not found" }, { status: 404 });
  }

  return Response.json({ event });
}
