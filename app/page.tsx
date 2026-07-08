import Link from "next/link";
import {
  CalendarDays,
  Flame,
  Sparkles,
  TicketCheck,
} from "lucide-react";
import { HorizontalScroller } from "@/components/HorizontalScroller";
import { HomeEventCard } from "@/components/HomeEventCard";
import { HomeSearchPanel } from "@/components/HomeSearchPanel";
import { getArtists } from "@/lib/artists";
import {
  getEvents,
  getFreeEventCount,
  getRecentlyAddedEvents,
  getVenueOptions,
  getWeekendEventCount,
} from "@/lib/events";
import {
  formatDateBadge,
  formatEventTime,
} from "@/lib/format";

type SearchParams = {
  q?: string;
  venue?: string;
  from?: string;
  to?: string;
  admission?: string;
  when?: string;
  view?: string;
  sort?: string;
};

type HomeProps = {
  searchParams: Promise<SearchParams>;
};

export default async function Home({ searchParams }: HomeProps) {
  const filters = await searchParams;
  const [
    events,
    allEvents,
    freeEvents,
    weekendEvents,
    artists,
    venues,
    freeEventCount,
    weekendEventCount,
    recentlyAddedEvents,
  ] = await Promise.all([
    getEvents({
      query: filters.q,
      venue: filters.venue,
      from: filters.from,
      to: filters.to,
      admission: filters.admission === "free" ? "free" : undefined,
      when: filters.when === "weekend" ? "weekend" : undefined,
    }),
    getEvents(),
    getEvents({ admission: "free" }),
    getEvents({ when: "weekend" }),
    getArtists(undefined, "popular"),
    getVenueOptions(),
    getFreeEventCount(),
    getWeekendEventCount(),
    getRecentlyAddedEvents(10),
  ]);
  const hasFilters = Boolean(
    filters.q ||
      filters.venue ||
      filters.from ||
      filters.to ||
      filters.admission === "free" ||
      filters.when === "weekend",
  );
  const isAllView = filters.view === "all" || hasFilters;
  const popularEvents = [...allEvents]
    .sort(
      (left, right) =>
        right.likeCount - left.likeCount ||
        left.eventDate.getTime() - right.eventDate.getTime(),
    )
    .slice(0, 8);
  const featuredEvents = popularEvents.some((event) => event.likeCount > 0)
    ? popularEvents
    : allEvents.slice(4, 12);
  const activeEvents = applyEventSort(hasFilters ? events : allEvents, filters.sort);
  const artistsPlayingThisMonth = artists
    .filter((artist) => artist.nextEvent && isWithinNextMonths(artist.nextEvent.eventDate, 2))
    .slice(0, 12);
  const todayEvents = allEvents.filter((event) => isToday(event.eventDate));
  const monthEvents = allEvents
    .filter((event) => isThisMonth(event.eventDate) && !isToday(event.eventDate))
    .slice(0, 8);
  const venueSections = getTopVenueSections(allEvents);

  return (
    <main
      id="inicio"
      className="min-h-screen bg-[#071018] text-[#f6f3ea]"
    >
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[#071018]" />
        <div className="relative mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
          <HomeSearchPanel
            hideTrigger
            artists={artists.slice(0, 8).map(toSearchArtist)}
            events={allEvents.slice(0, 8).map(toSearchEvent)}
            venues={venues.map((venue) => ({
              ...venue,
              city: "Guadalajara",
            }))}
          />

          <section>
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-black text-[#f6f3ea]">
                Artistas que tocan
              </h2>
              <Link
                href="/artistas"
                className="text-xs font-bold text-[#00c2d1] transition hover:text-white"
              >
                Ver todos
              </Link>
            </div>
            <HorizontalScroller
              label="artistas"
              className="-mx-4 mt-3 sm:-mx-6 lg:mx-0"
              contentClassName="flex gap-4 px-4 pb-2 sm:px-6 lg:px-10"
            >
              {artistsPlayingThisMonth.map((artist) => (
                  <Link
                    key={artist.id}
                    href={`/artistas/${artist.id}`}
                    className="group grid w-20 shrink-0 justify-items-center gap-2 text-center"
                  >
                    <span className="relative h-16 w-16 overflow-hidden rounded-full border border-white/20 bg-[#0b1d26] transition group-hover:border-[#00c2d1]">
                      {artist.imageUrl || artist.fallbackImageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={artist.imageUrl ?? artist.fallbackImageUrl ?? ""}
                          alt=""
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <span className="flex h-full w-full items-center justify-center text-xl font-black text-[#00c2d1]">
                          {artist.name.slice(0, 1)}
                        </span>
                      )}
                    </span>
                    <span className="line-clamp-1 w-full text-xs font-bold text-slate-300 transition group-hover:text-white">
                      {artist.name}
                    </span>
                  </Link>
                ))}
            </HorizontalScroller>
          </section>

          <section id="filtros" className="mt-2 scroll-mt-24">
            <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 py-2 sm:mx-0 sm:px-0">
              <FilterChip href="/#eventos" active={!isAllView} icon={Sparkles}>
                Descubrir
              </FilterChip>
              <FilterChip
                href="/?view=all#eventos"
                active={isAllView}
                icon={CalendarDays}
              >
                Todos
              </FilterChip>
              <FilterChip
                href="/?view=all&admission=free#eventos"
                active={filters.admission === "free"}
                icon={TicketCheck}
              >
                Gratis
                <span className="filter-chip-count">
                  {freeEventCount}
                </span>
              </FilterChip>
              <FilterChip
                href="/?view=all&when=weekend#eventos"
                active={filters.when === "weekend"}
                icon={CalendarDays}
              >
                Este fin
                <span className="filter-chip-count">
                  {weekendEventCount}
                </span>
              </FilterChip>
              <FilterChip
                href="/?view=all&sort=popular#eventos"
                active={filters.sort === "popular"}
                icon={Flame}
                redAccent
              >
                Populares
              </FilterChip>
            </div>
          </section>

        </div>
      </section>

      <section
        id="eventos"
        className="mx-auto w-full max-w-7xl scroll-mt-24 px-4 pb-12 pt-4 sm:px-6 lg:px-8"
      >
        {isAllView ? (
          <AllEventsSection
            title={hasFilters ? getResultsTitle(filters) : "Todos los eventos"}
            events={activeEvents}
          />
        ) : (
          <>
            <EventRail
              title="Hoy toca"
              href="/?view=all#eventos"
              events={todayEvents}
              compactOnMobile
            />

            <EventRail
              title="Este mes"
              href="/?view=all#eventos"
              events={monthEvents}
              compactOnMobile
            />

            <EventRail
              title="Recien añadidos"
              href="/?view=all#eventos"
              events={recentlyAddedEvents}
              itemLimit={10}
            />

            <EventRail
              title="Eventos destacados"
              href="/descubrir"
              events={featuredEvents}
            />

            {venueSections.map((section) => (
              <EventRail
                key={section.venue.id}
                title={section.venue.name}
                href={`/?view=all&venue=${section.venue.id}#eventos`}
                events={section.events}
              />
            ))}

            <EventRail
              title="Gratis esta semana"
              href="/?view=all&admission=free#eventos"
              events={freeEvents.slice(0, 8)}
            />

            <EventRail
              title="Este fin"
              href="/?view=all&when=weekend#eventos"
              events={weekendEvents.slice(0, 8)}
            />
          </>
        )}
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 pb-10 pt-2 sm:px-6 lg:px-8">
        <div className="space-y-5">
          <div className="-mx-4 overflow-hidden sm:mx-0">
            <div className="no-scrollbar flex items-center gap-2 overflow-x-auto px-4 pb-1 text-xs font-bold text-slate-400 sm:flex-wrap sm:overflow-visible sm:px-0">
              <span className="inline-flex h-8 shrink-0 items-center gap-2 rounded-full bg-white/[0.045] px-3 text-[#f6f3ea]">
              <BrandTrustIcon variant="verified" tone="cyan" />
              Fuentes verificadas
            </span>
              {[
                "Ticketmaster",
                "Arena Guadalajara",
                "C3 Stage",
                "eTicket",
                "Foro Independencia",
                "FunTicket",
                "KingTicket",
                "Visit Jalisco",
                "Vibra Jalisco",
                "Superboletos",
              ].map((source) => (
                <span
                  key={source}
                  className="inline-flex h-8 shrink-0 items-center rounded-full bg-white/[0.03] px-3 text-slate-300"
                >
                  {source}
                </span>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-x-4 gap-y-5 border-t border-white/[0.08] pt-5 sm:grid-cols-2 sm:gap-x-8 lg:grid-cols-4">
            <TrustItem
              variant="verified"
              tone="cyan"
              title="Fuentes confiables"
              text="Informacion reunida desde sitios oficiales y publicos."
            />
            <TrustItem
              variant="free"
              tone="red"
              title="Gratis visible"
              text="Marcamos conciertos sin costo cuando la fuente lo indica."
            />
            <TrustItem
              variant="artist"
              tone="red"
              title="Artistas primero"
              text="Perfiles, avisos y proximas fechas desde el inicio."
            />
            <TrustItem
              variant="metro"
              tone="cyan"
              title="Zona metropolitana"
              text="Guadalajara, Zapopan, Tlaquepaque y recintos cercanos."
            />
          </div>
        </div>
      </section>
    </main>
  );
}

function EventRail({
  title,
  href,
  events,
  compactOnMobile = false,
  itemLimit = 8,
}: {
  title: string;
  href: string;
  events: Awaited<ReturnType<typeof getEvents>>;
  compactOnMobile?: boolean;
  itemLimit?: number;
}) {
  if (events.length === 0) {
    return null;
  }

  return (
    <section className="py-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-lg font-black tracking-tight text-[#f6f3ea]">
          {title}
        </h2>
        <Link
          href={href}
          className="text-xs font-bold text-[#00c2d1] transition hover:text-white"
        >
          Ver todos
        </Link>
      </div>

      <>
        {compactOnMobile ? (
          <div className="grid gap-2 md:hidden">
            {events.slice(0, itemLimit).map((event) => (
              <HomeEventCard key={event.id} event={event} compact />
            ))}
          </div>
        ) : null}
        <div className={compactOnMobile ? "max-md:hidden" : ""}>
          <HorizontalScroller
            label={title}
            className="-mx-4 sm:-mx-6 lg:mx-0"
            contentClassName="flex snap-x gap-3 px-4 pb-2 sm:px-6 lg:px-10"
          >
            {events.slice(0, itemLimit).map((event) => (
              <div key={event.id} className="w-64 shrink-0 snap-start lg:w-72">
                <HomeEventCard event={event} />
              </div>
            ))}
          </HorizontalScroller>
        </div>
      </>
    </section>
  );
}

function AllEventsSection({
  title,
  events,
}: {
  title: string;
  events: Awaited<ReturnType<typeof getEvents>>;
}) {
  return (
    <section className="py-5">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-black tracking-tight text-[#f6f3ea]">
            {title}
          </h2>
          <p className="mt-1 text-sm font-semibold text-slate-400">
            {events.length} {events.length === 1 ? "evento" : "eventos"} por fecha mas cercana
          </p>
        </div>
        {events.length > 0 ? (
          <Link
            href="/#eventos"
            className="text-xs font-bold text-[#00c2d1] transition hover:text-white"
          >
            Ver por secciones
          </Link>
        ) : null}
      </div>

      {events.length > 0 ? (
        <>
          <div className="grid gap-2 md:hidden">
            {events.map((event) => (
              <HomeEventCard key={event.id} event={event} compact />
            ))}
          </div>
          <div className="hidden grid-cols-2 gap-4 md:grid lg:grid-cols-3 xl:grid-cols-4">
            {events.map((event) => (
              <HomeEventCard key={event.id} event={event} />
            ))}
          </div>
        </>
      ) : (
        <div className="rounded-lg border border-dashed border-white/12 bg-white/[0.035] px-5 py-12 text-center">
          <p className="text-lg font-black text-[#f6f3ea]">
            No encontramos eventos con esos filtros.
          </p>
          <p className="mt-2 text-sm text-slate-400">
            Prueba con otra fecha, artista o recinto.
          </p>
        </div>
      )}
    </section>
  );
}

function FilterChip({
  href,
  active = false,
  redAccent = false,
  icon: Icon,
  children,
}: {
  href: string;
  active?: boolean;
  redAccent?: boolean;
  icon: typeof Sparkles;
  children: React.ReactNode;
}) {
  const tone = redAccent ? "red" : "cyan";

  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      data-tone={tone}
      className={`filter-chip group relative isolate inline-flex h-11 shrink-0 select-none items-center gap-2 overflow-hidden rounded-full px-3.5 text-sm font-black transition duration-200 active:scale-95 ${
        active
          ? redAccent
            ? "bg-[#ff304f] text-white shadow-[0_12px_28px_rgba(255,48,79,0.26)] ring-1 ring-[#ff304f]"
            : "bg-[#00c2d1] text-[#071018] shadow-[0_12px_28px_rgba(0,194,209,0.22)] ring-1 ring-[#00c2d1]"
          : redAccent
            ? "bg-[#071018]/78 text-[#f6f3ea] ring-1 ring-[#ff304f]/38 hover:bg-[#ff304f]/12 hover:ring-[#ff304f]/75"
            : "bg-[#071018]/78 text-[#f6f3ea] ring-1 ring-white/12 hover:bg-white/[0.075] hover:ring-[#00c2d1]/62"
      }`}
    >
      <span
        className={`filter-chip-icon grid h-6 w-6 place-items-center rounded-full ${
          active
            ? redAccent
              ? "bg-white/16 text-white"
              : "bg-[#071018]/12 text-[#071018]"
            : redAccent
              ? "bg-[#ff304f]/13 text-[#ff4964] group-hover:bg-[#ff304f]/20"
              : "bg-[#00c2d1]/12 text-[#00c2d1] group-hover:bg-[#00c2d1]/18"
        }`}
      >
        <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      </span>
      {children}
    </Link>
  );
}

function TrustItem({
  variant,
  tone,
  title,
  text,
}: {
  variant: BrandTrustIconVariant;
  tone: BrandTrustIconTone;
  title: string;
  text: string;
}) {
  return (
    <div className="min-w-0">
      <BrandTrustIcon variant={variant} tone={tone} large />
      <h2 className="mt-2 text-sm font-black leading-tight text-[#f6f3ea]">
        {title}
      </h2>
      <p className="mt-1 text-xs leading-5 text-slate-400 sm:text-sm">
        {text}
      </p>
    </div>
  );
}

type BrandTrustIconVariant = "verified" | "free" | "artist" | "metro";
type BrandTrustIconTone = "cyan" | "red";

function BrandTrustIcon({
  variant,
  tone,
  large = false,
}: {
  variant: BrandTrustIconVariant;
  tone: BrandTrustIconTone;
  large?: boolean;
}) {
  const color = tone === "red" ? "#ff304f" : "#00c2d1";
  const sizeClass = large ? "h-7 w-7 sm:h-8 sm:w-8" : "h-4 w-4";

  return (
    <svg
      viewBox="0 0 32 32"
      className={`${sizeClass} shrink-0`}
      fill="none"
      aria-hidden="true"
    >
      {variant === "verified" ? (
        <>
          <path
            d="M16 4.5 25 8v7.2c0 5.7-3.5 9.8-9 12.3-5.5-2.5-9-6.6-9-12.3V8l9-3.5Z"
            stroke={color}
            strokeWidth="2.2"
            strokeLinejoin="round"
          />
          <path
            d="m11.5 16.2 3 3 6-7"
            stroke={color}
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </>
      ) : null}
      {variant === "free" ? (
        <>
          <path
            d="M16 5.5v21"
            stroke={color}
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          <path
            d="M21.5 10.5c-1.2-1.7-3-2.5-5.2-2.5-3 0-5.1 1.4-5.1 3.8 0 5.3 10.1 2.7 10.1 8.2 0 2.5-2.1 4-5.2 4-2.5 0-4.4-.9-5.7-2.7"
            stroke={color}
            strokeWidth="2.2"
            strokeLinecap="round"
          />
        </>
      ) : null}
      {variant === "artist" ? (
        <>
          <path
            d="M10 23.5V8.5l12-2.7v14.8"
            stroke={color}
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M10 23.5c0 1.8-1.7 3-3.6 3S3 25.4 3 23.9s1.5-2.8 3.5-2.8c1.3 0 2.5.5 3.5 1.4M22 20.6c0 1.8-1.7 3-3.6 3S15 22.5 15 21s1.5-2.8 3.5-2.8c1.3 0 2.5.5 3.5 1.4"
            stroke={color}
            strokeWidth="2.2"
            strokeLinecap="round"
          />
        </>
      ) : null}
      {variant === "metro" ? (
        <>
          <path
            d="M16 28s8-7.2 8-14a8 8 0 1 0-16 0c0 6.8 8 14 8 14Z"
            stroke={color}
            strokeWidth="2.2"
            strokeLinejoin="round"
          />
          <path
            d="M13 14h6M16 11v6"
            stroke={color}
            strokeWidth="2.2"
            strokeLinecap="round"
          />
        </>
      ) : null}
    </svg>
  );
}

function getResultsTitle(filters: SearchParams) {
  if (filters.sort === "popular") return "Eventos populares";
  if (filters.admission === "free" && filters.when === "weekend") {
    return "Gratis este fin";
  }
  if (filters.admission === "free") return "Conciertos gratis";
  if (filters.when === "weekend") return "Este fin";
  if (filters.q) return `Resultados para "${filters.q}"`;
  return "Resultados";
}

function applyEventSort(
  events: Awaited<ReturnType<typeof getEvents>>,
  sort?: string,
) {
  if (sort === "popular" || sort === "interested") {
    return [...events].sort(
      (left, right) =>
        right.likeCount - left.likeCount ||
        left.eventDate.getTime() - right.eventDate.getTime(),
    );
  }

  return events;
}

function getTopVenueSections(events: Awaited<ReturnType<typeof getEvents>>) {
  const now = new Date();
  const todayKey = getMexicoCityDateKey(now);
  const rangeEnd = new Date(now);
  rangeEnd.setDate(now.getDate() + 60);
  const rangeEndKey = getMexicoCityDateKey(rangeEnd);
  const byVenue = new Map<
    string,
    {
      venue: { id: string; name: string };
      events: Awaited<ReturnType<typeof getEvents>>;
    }
  >();

  for (const event of events) {
    const eventDay = getMexicoCityDateKey(event.eventDate);

    if (eventDay < todayKey || eventDay > rangeEndKey) {
      continue;
    }

    const current = byVenue.get(event.venue.id) ?? {
      venue: {
        id: event.venue.id,
        name: event.venue.name,
      },
      events: [],
    };

    current.events.push(event);
    byVenue.set(event.venue.id, current);
  }

  const sections = [...byVenue.values()]
    .filter((section) => section.events.length >= 2)
    .sort(
      (left, right) =>
        right.events.length - left.events.length ||
        left.events[0].eventDate.getTime() - right.events[0].eventDate.getTime(),
    )
    .slice(0, 3);
  const c3Section = [...byVenue.values()].find((section) =>
    section.venue.name.toLowerCase().includes("c3"),
  );

  if (c3Section && !sections.some((section) => section.venue.id === c3Section.venue.id)) {
    sections.splice(1, 0, c3Section);
  }

  return sections
    .map((section) => ({
      ...section,
      events: section.events
        .sort((left, right) => left.eventDate.getTime() - right.eventDate.getTime())
        .slice(0, 8),
    }));
}

function isThisMonth(date: Date) {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat("en-US", {
    month: "2-digit",
    year: "numeric",
    timeZone: "America/Mexico_City",
  });

  return formatter.format(date) === formatter.format(now);
}

function isWithinNextMonths(date: Date, months: number) {
  const now = new Date();
  const start = getMexicoCityDateKey(now);
  const end = new Date(now);
  end.setMonth(end.getMonth() + months);

  const eventDay = getMexicoCityDateKey(date);
  return eventDay >= start && eventDay < getMexicoCityDateKey(end);
}

function getMexicoCityDateKey(date: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "America/Mexico_City",
  }).format(date);
}

function isToday(date: Date) {
  return getMexicoCityDateKey(date) === getMexicoCityDateKey(new Date());
}

function toSearchArtist(artist: Awaited<ReturnType<typeof getArtists>>[number]) {
  return {
    id: artist.id,
    name: artist.name,
    imageUrl: artist.imageUrl ?? artist.fallbackImageUrl,
    subscriberCount: artist.subscriberCount,
  };
}

function toSearchEvent(event: Awaited<ReturnType<typeof getEvents>>[number]) {
  const date = formatDateBadge(event.eventDate);

  return {
    id: event.id,
    title: event.title,
    imageUrl: event.imageUrl,
    dateLabel: `${date.day} ${date.month}`,
    venueName: event.venue.name,
    timeLabel: formatEventTime(event.eventDate, event.source),
    admissionType: event.admissionType,
  };
}
