import type { Metadata } from "next";
import Link from "next/link";
import { CalendarDays, RotateCcw, Sparkles } from "lucide-react";
import { DesktopDiscoverRedirect } from "@/components/DesktopDiscoverRedirect";
import { DiscoveryEventCard } from "@/components/DiscoveryEventCard";
import { DiscoveryFilters } from "@/components/DiscoveryFilters";
import { getDiscoveryEvents, getVenueOptions } from "@/lib/events";

export const metadata: Metadata = {
  title: "Descubrir conciertos",
  description:
    "Descubre conciertos populares, proximos y recien anunciados en Guadalajara.",
};

type DiscoverSearchParams = {
  venue?: string;
  admission?: string;
  when?: string;
};

export default async function DiscoverPage({
  searchParams,
}: {
  searchParams: Promise<DiscoverSearchParams>;
}) {
  const values = await searchParams;
  const filters = {
    venue: values.venue,
    admission: values.admission === "free" ? ("free" as const) : undefined,
    when: values.when === "weekend" ? ("weekend" as const) : undefined,
  };
  const [events, venues] = await Promise.all([
    getDiscoveryEvents(filters),
    getVenueOptions(),
  ]);

  return (
    <main data-discovery-page className="bg-[#071018]">
      <DesktopDiscoverRedirect />
      <section className="relative flex h-[calc(100dvh-4rem-env(safe-area-inset-bottom))] min-h-0 flex-col overflow-hidden bg-[#071018] md:hidden">
        <DiscoveryFilters
          venues={venues}
          values={values}
          eventCount={events.length}
        />

        {events.length > 0 ? (
          <div
            data-discovery-feed
            className="min-h-0 flex-1 snap-y snap-mandatory overflow-y-auto overscroll-contain scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {events.map((event, index) => (
              <DiscoveryEventCard
                key={event.id}
                event={event}
                position={index + 1}
                total={events.length}
              />
            ))}
            <DiscoveryEndState />
          </div>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-8 text-center text-[#f6f3ea]">
            <Sparkles className="h-10 w-10 text-[#00c2d1]" aria-hidden="true" />
            <h1 className="mt-5 text-2xl font-bold">
              No hay eventos con estos filtros
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              Prueba con otra combinacion para seguir descubriendo conciertos.
            </p>
            <Link
              href="/descubrir"
              className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-md bg-[#00c2d1] px-4 text-sm font-black text-[#071018]"
            >
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              Limpiar filtros
            </Link>
          </div>
        )}
      </section>

      <section
        className="hidden min-h-screen bg-[#071018] md:block"
        aria-hidden="true"
      />
    </main>
  );
}

function DiscoveryEndState() {
  return (
    <div className="flex h-full snap-start snap-always flex-col items-center justify-center bg-[#071018] px-8 text-center text-[#f6f3ea]">
      <span className="flex h-16 w-16 items-center justify-center rounded-full border border-[#00c2d1]/40 bg-[#00c2d1]/15 text-[#00c2d1]">
        <Sparkles className="h-7 w-7" aria-hidden="true" />
      </span>
      <h2 className="mt-6 text-3xl font-bold">
        Ya descubriste todo por ahora
      </h2>
      <p className="mt-3 max-w-sm text-sm leading-6 text-slate-300">
        La mezcla cambia con nuevos eventos y con lo que interesa a la
        comunidad.
      </p>
      <div className="mt-7 grid w-full max-w-xs gap-3">
        <Link
          href="/#eventos"
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-[#00c2d1] px-5 text-sm font-black text-[#071018]"
        >
          <CalendarDays className="h-4 w-4" aria-hidden="true" />
          Ver todos los eventos
        </Link>
        <Link
          href="/descubrir"
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md border border-white/20 bg-white/5 px-5 text-sm font-black text-[#f6f3ea]"
        >
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          Volver a empezar
        </Link>
      </div>
    </div>
  );
}
