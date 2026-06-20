"use client";

import Link from "next/link";
import { CalendarClock, MapPin, Sparkles, TicketCheck } from "lucide-react";
import { useRouter } from "next/navigation";

type DiscoveryFiltersProps = {
  venues: Array<{ id: string; name: string }>;
  values: {
    venue?: string;
    admission?: string;
    when?: string;
  };
  eventCount: number;
};

export function DiscoveryFilters({
  venues,
  values,
  eventCount,
}: DiscoveryFiltersProps) {
  const router = useRouter();
  const weekendActive = values.when === "weekend";
  const freeActive = values.admission === "free";

  function buildHref(changes: Record<string, string | undefined>) {
    const params = new URLSearchParams();
    const next = { ...values, ...changes };

    if (next.venue) params.set("venue", next.venue);
    if (next.admission) params.set("admission", next.admission);
    if (next.when) params.set("when", next.when);

    const query = params.toString();
    return query ? `/descubrir?${query}` : "/descubrir";
  }

  return (
    <div
      data-discovery-filters
      className="relative z-20 shrink-0 border-b border-white/10 bg-slate-950 px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] text-white"
    >
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase text-violet-300">
            Conciertos GDL
          </p>
          <h1 className="mt-0.5 text-xl font-bold">Descubrir</h1>
        </div>
        <p className="pb-0.5 text-xs font-semibold text-slate-300">
          {eventCount} {eventCount === 1 ? "evento" : "eventos"}
        </p>
      </div>

      <div className="mt-3 flex gap-2 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <Link
          href="/descubrir"
          aria-current={!weekendActive && !freeActive && !values.venue ? "page" : undefined}
          className={`inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-md border px-3 text-xs font-bold ${
            !weekendActive && !freeActive && !values.venue
              ? "border-violet-400 bg-violet-600 text-white"
              : "border-white/20 bg-white/10 text-white"
          }`}
        >
          <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
          Para ti
        </Link>
        <Link
          href={buildHref({ when: weekendActive ? undefined : "weekend" })}
          aria-current={weekendActive ? "page" : undefined}
          className={`inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-md border px-3 text-xs font-bold ${
            weekendActive
              ? "border-violet-400 bg-violet-600 text-white"
              : "border-white/20 bg-white/10 text-white"
          }`}
        >
          <CalendarClock className="h-3.5 w-3.5" aria-hidden="true" />
          Este fin
        </Link>
        <Link
          href={buildHref({ admission: freeActive ? undefined : "free" })}
          aria-current={freeActive ? "page" : undefined}
          className={`inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-md border px-3 text-xs font-bold ${
            freeActive
              ? "border-emerald-300 bg-emerald-500 text-white"
              : "border-white/20 bg-white/10 text-white"
          }`}
        >
          <TicketCheck className="h-3.5 w-3.5" aria-hidden="true" />
          Gratis
        </Link>
        <label className="relative inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-md border border-white/20 bg-white/10 px-3 text-xs font-bold text-white">
          <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
          <span className="sr-only">Filtrar por recinto</span>
          <select
            value={values.venue ?? ""}
            onChange={(event) =>
              router.replace(
                buildHref({ venue: event.target.value || undefined }),
              )
            }
            className="max-w-32 appearance-none bg-transparent pr-3 text-xs font-bold text-white outline-none"
            aria-label="Filtrar por recinto"
          >
            <option value="" className="text-slate-950">Recinto</option>
            {venues.map((venue) => (
              <option key={venue.id} value={venue.id} className="text-slate-950">
                {venue.name}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
}
