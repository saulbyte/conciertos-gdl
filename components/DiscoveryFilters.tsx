"use client";

import Link from "next/link";
import {
  CalendarClock,
  Flame,
  MapPin,
  Search,
  Sparkles,
  TicketCheck,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { BrandLogo } from "@/components/BrandLogo";
import { MobileMenu } from "@/components/MobileMenu";

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
      className="relative z-20 shrink-0 bg-[#071018] px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] text-[#f6f3ea]"
    >
      <div className="flex items-center justify-between gap-3">
        <BrandLogo compact />
        <div className="flex items-center gap-2">
          <Link
            href="/?search=open"
            className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-[#ff304f] text-white shadow-[0_0_18px_rgba(255,48,79,0.18)] transition hover:bg-[#ff5d74]"
            aria-label="Buscar"
            title="Buscar"
          >
            <Search className="h-5 w-5" aria-hidden="true" />
          </Link>
          <MobileMenu />
        </div>
      </div>

      <div className="mt-3 flex items-end justify-between gap-3">
        <h1 className="text-lg font-black text-[#f6f3ea]">Descubrir</h1>
        <p className="pb-0.5 text-xs font-semibold text-slate-400">
          {eventCount} {eventCount === 1 ? "evento" : "eventos"}
        </p>
      </div>

      <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto pb-0.5">
        <Link
          href="/descubrir"
          aria-current={!weekendActive && !freeActive && !values.venue ? "page" : undefined}
          className={`inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-md border px-3 text-xs font-bold ${
            !weekendActive && !freeActive && !values.venue
              ? "border-[#ff304f] bg-[#ff304f] text-white"
              : "border-white/10 bg-white/[0.04] text-[#f6f3ea] hover:border-[#ff304f]/65"
          }`}
        >
          <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
          Para ti
        </Link>
        <Link
          href="/descubrir"
          className="inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-md border border-[#ff304f]/35 bg-[#ff304f]/10 px-3 text-xs font-bold text-[#f6f3ea] hover:border-[#ff304f]/65"
        >
          <Flame className="h-3.5 w-3.5 text-[#ff8a9b]" aria-hidden="true" />
          Populares
        </Link>
        <Link
          href={buildHref({ when: weekendActive ? undefined : "weekend" })}
          aria-current={weekendActive ? "page" : undefined}
          className={`inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-md border px-3 text-xs font-bold ${
            weekendActive
              ? "border-[#ff304f] bg-[#ff304f] text-white"
              : "border-white/10 bg-white/[0.04] text-[#f6f3ea] hover:border-[#ff304f]/65"
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
              ? "border-[#ff304f] bg-[#ff304f] text-white"
              : "border-white/10 bg-white/[0.04] text-[#f6f3ea] hover:border-[#ff304f]/65"
          }`}
        >
          <TicketCheck className="h-3.5 w-3.5" aria-hidden="true" />
          Gratis
        </Link>
        <label className="relative inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-md border border-white/10 bg-white/[0.04] px-3 text-xs font-bold text-[#f6f3ea] hover:border-[#00c2d1]/65">
          <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
          <span className="sr-only">Filtrar por recinto</span>
          <select
            value={values.venue ?? ""}
            onChange={(event) =>
              router.replace(
                buildHref({ venue: event.target.value || undefined }),
              )
            }
            className="max-w-32 appearance-none bg-transparent pr-3 text-xs font-bold text-[#f6f3ea] outline-none"
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
