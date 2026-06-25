import type { PrismaClient } from "@prisma/client";
import { syncEventSource } from "@/lib/event-sources/sync";
import type { EventSourceAdapter } from "@/lib/event-sources/types";
import { c3StageAdapter } from "@/lib/event-sources/c3-stage";
import { funTicketAdapter } from "@/lib/event-sources/funticket";
import { foroIndependenciaAdapter } from "@/lib/event-sources/foro-independencia";
import { superboletosAdapter } from "@/lib/event-sources/superboletos";
import { visitJaliscoAdapter } from "@/lib/event-sources/visit-jalisco";
import { createTicketmasterAdapter } from "@/lib/ticketmaster";

export function getEventSourceAdapters(): EventSourceAdapter[] {
  return [
    createTicketmasterAdapter(),
    c3StageAdapter,
    foroIndependenciaAdapter,
    funTicketAdapter,
    visitJaliscoAdapter,
    superboletosAdapter,
  ];
}

export async function syncAllEventSources(prisma: PrismaClient) {
  const results = [];

  for (const adapter of getEventSourceAdapters()) {
    results.push(await syncEventSource(prisma, adapter));
  }

  return results;
}
