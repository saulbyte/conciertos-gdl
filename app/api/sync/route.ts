import { syncAllEventSources } from "@/lib/event-sources";
import { prisma } from "@/lib/prisma";
import { authorizeSyncRequest } from "@/lib/sync-auth";

export async function POST(request: Request) {
  const unauthorizedResponse = authorizeSyncRequest(request);

  if (unauthorizedResponse) {
    return unauthorizedResponse;
  }

  const results = await syncAllEventSources(prisma);

  return Response.json({ results });
}
