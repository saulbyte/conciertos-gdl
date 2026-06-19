import { prisma } from "@/lib/prisma";
import { authorizeSyncRequest } from "@/lib/sync-auth";
import { syncTicketmasterEvents } from "@/lib/ticketmaster";

export async function POST(request: Request) {
  const unauthorizedResponse = authorizeSyncRequest(request);

  if (unauthorizedResponse) {
    return unauthorizedResponse;
  }

  const result = await syncTicketmasterEvents(prisma);

  return Response.json(result);
}
