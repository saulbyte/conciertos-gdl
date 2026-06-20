import Image from "next/image";
import { Suspense } from "react";
import { CalendarCheck2, Link2, ShieldCheck } from "lucide-react";
import { EventCard } from "@/components/EventCard";
import { EventListSkeleton } from "@/components/EventListSkeleton";
import { MobileDiscoveryFilters } from "@/components/MobileDiscoveryFilters";
import { SearchFilters } from "@/components/SearchFilters";
import { getEvents, getFreeEventCount, getVenueOptions } from "@/lib/events";

type SearchParams = {
  q?: string;
  venue?: string;
  from?: string;
  to?: string;
  admission?: string;
};

type HomeProps = {
  searchParams: Promise<SearchParams>;
};

export default async function Home({ searchParams }: HomeProps) {
  const filters = await searchParams;
  const [venues, freeEventCount] = await Promise.all([
    getVenueOptions(),
    getFreeEventCount(),
  ]);

  return (
    <main>
      <section className="relative isolate overflow-hidden bg-slate-950 text-white">
        <Image
          src="/images/concert-hero.png"
          alt="Publico disfrutando un concierto en vivo"
          fill
          priority
          sizes="100vw"
          className="-z-20 object-cover object-[68%_55%]"
        />
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(2,6,23,0.96)_0%,rgba(2,6,23,0.86)_38%,rgba(2,6,23,0.35)_72%,rgba(2,6,23,0.12)_100%)]" />
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(0deg,rgba(2,6,23,0.82)_0%,transparent_48%)]" />

        <div className="mx-auto flex min-h-[430px] w-full max-w-7xl flex-col justify-center px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          <div className="max-w-2xl">
            <p className="mb-4 text-sm font-bold uppercase text-violet-300">
              Tu agenda de musica en vivo
            </p>
            <h1 className="max-w-xl text-4xl font-bold leading-[1.08] sm:text-5xl lg:text-6xl">
              Conciertos en Guadalajara
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-slate-200 sm:text-lg">
              Encuentra artistas, fechas y recintos en un solo lugar. Nosotros
              reunimos la informacion; tu eliges la proxima noche.
            </p>
          </div>

          <div id="filtros" className="mt-8 max-w-4xl scroll-mt-24">
            <SearchFilters venues={venues} values={filters} />
            <MobileDiscoveryFilters
              venues={venues}
              values={filters}
              freeEventCount={freeEventCount}
            />
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-semibold text-slate-300">
            <span className="text-white">Fuentes verificadas:</span>
            <span>Ticketmaster</span>
            <span>C3 Stage</span>
            <span>Visit Jalisco</span>
            <span>Superboletos</span>
          </div>
        </div>
      </section>

      <section
        id="eventos"
        className="mx-auto w-full max-w-7xl scroll-mt-24 px-4 py-10 sm:px-6 sm:py-14 lg:px-8"
      >
        <Suspense fallback={<EventListSkeleton />}>
          <EventResults filters={filters} />
        </Suspense>
      </section>

      <section className="border-y border-violet-100 bg-violet-50/70">
        <div className="mx-auto grid w-full max-w-7xl gap-7 px-4 py-8 sm:px-6 md:grid-cols-3 lg:px-8">
          <TrustItem
            icon={ShieldCheck}
            title="Informacion confiable"
            text="Datos reunidos desde fuentes publicas y oficiales."
          />
          <TrustItem
            icon={Link2}
            title="Enlaces oficiales"
            text="Cada evento te lleva directamente a su pagina de origen."
          />
          <TrustItem
            icon={CalendarCheck2}
            title="Agenda actualizada"
            text="Nuevas fuentes y eventos se agregan continuamente."
          />
        </div>
      </section>
    </main>
  );
}

async function EventResults({ filters }: { filters: SearchParams }) {
  const events = await getEvents({
    query: filters.q,
    venue: filters.venue,
    from: filters.from,
    to: filters.to,
    admission: filters.admission === "free" ? "free" : undefined,
  });

  const hasFilters = Boolean(
    filters.q ||
      filters.venue ||
      filters.from ||
      filters.to ||
      filters.admission === "free",
  );

  return (
    <section>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-bold uppercase text-violet-700">
            Cartelera
          </p>
          <h2 className="mt-1 text-2xl font-bold text-slate-950 sm:text-3xl">
            {filters.admission === "free"
              ? "Conciertos gratis"
              : hasFilters
                ? "Resultados"
                : "Proximos eventos"}
          </h2>
        </div>
        <p className="text-sm font-medium text-slate-500">
          {events.length} {events.length === 1 ? "evento" : "eventos"}
        </p>
      </div>

      {events.length > 0 ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      ) : (
        <div className="border-y border-dashed border-slate-300 bg-white px-5 py-16 text-center">
          <p className="text-lg font-bold text-slate-950">
            No encontramos eventos con esos filtros.
          </p>
          <p className="mt-2 text-sm text-slate-600">
            Prueba con otra fecha, artista o recinto.
          </p>
        </div>
      )}
    </section>
  );
}

type TrustItemProps = {
  icon: typeof ShieldCheck;
  title: string;
  text: string;
};

function TrustItem({ icon: Icon, title, text }: TrustItemProps) {
  return (
    <div className="flex items-start gap-4">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-violet-200 bg-white text-violet-700">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <div>
        <h2 className="text-sm font-bold text-slate-950">{title}</h2>
        <p className="mt-1 text-sm leading-5 text-slate-600">{text}</p>
      </div>
    </div>
  );
}
