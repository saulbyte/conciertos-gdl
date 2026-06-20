import type { Metadata } from "next";
import Link from "next/link";
import { CalendarDays, RotateCcw, Sparkles } from "lucide-react";
import { DiscoveryEventCard } from "@/components/DiscoveryEventCard";
import { DiscoveryFilters } from "@/components/DiscoveryFilters";
import { getDiscoveryEvents, getVenueOptions } from "@/lib/events";

export const metadata: Metadata = {
  title: "Descubrir conciertos",
  description: "Descubre conciertos populares, próximos y recién anunciados en Guadalajara.",
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
    <main data-discovery-page className="bg-slate-950">
      <section className="relative h-[calc(100dvh-4rem-env(safe-area-inset-bottom))] overflow-hidden md:hidden">
        <DiscoveryFilters
          venues={venues}
          values={values}
          eventCount={events.length}
        />

        {events.length > 0 ? (
          <div className="h-full snap-y snap-mandatory overflow-y-auto overscroll-contain scroll-smooth">
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
          <div className="flex h-full flex-col items-center justify-center px-8 pt-28 text-center text-white">
            <Sparkles className="h-10 w-10 text-violet-300" aria-hidden="true" />
            <h1 className="mt-5 text-2xl font-bold">No hay eventos con estos filtros</h1>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              Prueba con otra combinación para seguir descubriendo conciertos.
            </p>
            <Link
              href="/descubrir"
              className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-md bg-white px-4 text-sm font-bold text-slate-950"
            >
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              Limpiar filtros
            </Link>
          </div>
        )}
      </section>

      <section className="hidden bg-slate-50 md:block">
        <div className="mx-auto w-full max-w-7xl px-6 py-14 lg:px-8">
          <p className="text-sm font-bold uppercase text-violet-700">Descubrir</p>
          <h1 className="mt-2 text-4xl font-bold text-slate-950">
            Una mezcla para encontrar tu próximo concierto
          </h1>
          <p className="mt-3 max-w-2xl text-slate-600">
            Eventos populares, fechas cercanas, novedades y algunas sorpresas de la cartelera.
          </p>
          <Link
            href="/#eventos"
            className="mt-8 inline-flex min-h-12 items-center gap-2 rounded-md bg-violet-600 px-5 text-sm font-bold text-white transition hover:bg-violet-700"
          >
            <CalendarDays className="h-4 w-4" aria-hidden="true" />
            Ver todos los eventos
          </Link>
        </div>
      </section>
    </main>
  );
}

function DiscoveryEndState() {
  return (
    <div className="flex h-full snap-start snap-always flex-col items-center justify-center bg-slate-950 px-8 text-center text-white">
      <span className="flex h-16 w-16 items-center justify-center rounded-full border border-violet-400/40 bg-violet-500/15 text-violet-300">
        <Sparkles className="h-7 w-7" aria-hidden="true" />
      </span>
      <h2 className="mt-6 text-3xl font-bold">Ya descubriste todo por ahora</h2>
      <p className="mt-3 max-w-sm text-sm leading-6 text-slate-300">
        La mezcla cambia con nuevos eventos y con lo que interesa a la comunidad.
      </p>
      <div className="mt-7 grid w-full max-w-xs gap-3">
        <Link
          href="/#eventos"
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-white px-5 text-sm font-bold text-slate-950"
        >
          <CalendarDays className="h-4 w-4" aria-hidden="true" />
          Ver todos los eventos
        </Link>
        <Link
          href="/descubrir"
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md border border-white/25 bg-white/10 px-5 text-sm font-bold text-white"
        >
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          Volver a empezar
        </Link>
      </div>
    </div>
  );
}
