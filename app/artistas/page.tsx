import Link from "next/link";
import {
  Bell,
  CalendarDays,
  ChevronRight,
  Clock3,
  Flame,
  ListMusic,
  Music2,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";
import { EventArtwork } from "@/components/EventArtwork";
import { HorizontalScroller } from "@/components/HorizontalScroller";
import { MobileMenu } from "@/components/MobileMenu";
import { getArtists, type ArtistSortMode } from "@/lib/artists";
import { formatDateBadge } from "@/lib/format";

export const dynamic = "force-dynamic";

type ArtistsPageProps = {
  searchParams: Promise<{
    q?: string;
    mode?: string;
  }>;
};

export default async function ArtistsPage({ searchParams }: ArtistsPageProps) {
  const filters = await searchParams;
  const query = typeof filters.q === "string" ? filters.q.trim() : "";
  const mode = parseArtistMode(filters.mode);
  const artists = await getArtists(query, mode);
  const hasSearch = query.length > 0;
  const featuredArtists = artists
    .filter((artist) => artist.nextEvent && isWithinNextMonths(artist.nextEvent.eventDate, 2))
    .slice(0, 12);

  return (
    <main data-artists-page className="min-h-dvh bg-[#071018] text-[#f6f3ea]">
      <section className="bg-[#071018] text-[#f6f3ea]">
        <div className="mx-auto w-full max-w-7xl px-4 pb-4 pt-0 sm:px-6 md:pt-5 lg:px-8">
          <div className="relative mb-5 flex h-16 items-center justify-between gap-3 md:hidden">
            <BrandLogo compact />
            <div className="flex items-center gap-2">
              <Link
                href="/?search=open"
                className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-[#ff304f] text-white shadow-[0_0_18px_rgba(255,48,79,0.18)] transition hover:bg-[#ff5d74]"
                aria-label="Buscar artista"
                title="Buscar artista"
              >
                <Search className="h-5 w-5" aria-hidden="true" />
              </Link>
              <MobileMenu />
            </div>
          </div>

          {featuredArtists.length > 0 ? (
            <FeaturedArtists artists={featuredArtists} />
          ) : null}

          <ArtistFilters query={query} mode={mode} />
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 pb-24 pt-3 sm:px-6 md:pt-4 lg:px-8">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-lg font-black tracking-tight text-[#f6f3ea]">
            {hasSearch ? `Resultados para "${query}"` : "Catalogo de artistas"}
          </h2>
          <span className="text-xs font-bold text-slate-400">
            {artists.length}
          </span>
        </div>

        {artists.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-3 md:gap-4 lg:grid-cols-4 xl:grid-cols-5">
            {artists.map((artist) => (
              <ArtistCard key={artist.id} artist={artist} />
            ))}
          </div>
        ) : (
          <div className="border-y border-dashed border-white/12 px-5 py-16 text-center">
            <p className="text-lg font-black text-[#f6f3ea]">
              {hasSearch
                ? "No encontramos artistas con esa busqueda."
                : "Aun no hay artistas en el catalogo."}
            </p>
            <p className="mt-2 text-sm text-slate-400">
              {hasSearch
                ? "Prueba con otro nombre o revisa el catalogo completo."
                : "Corre la sincronizacion para alimentar el catalogo."}
            </p>
          </div>
        )}
      </section>
    </main>
  );
}

function FeaturedArtists({
  artists,
}: {
  artists: Awaited<ReturnType<typeof getArtists>>;
}) {
  return (
    <section className="mt-5 md:mt-0">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-sm font-black text-[#f6f3ea]">Artistas que tocan</h2>
        <Link
          href="/artistas?mode=upcoming"
          className="text-xs font-bold text-[#00c2d1] transition hover:text-white"
        >
          Ver con fechas
        </Link>
      </div>

      <HorizontalScroller
        label="artistas"
        className="-mx-4 sm:-mx-6 lg:mx-0"
        contentClassName="flex gap-4 px-4 pb-2 sm:px-6 lg:px-10"
      >
        {artists.map((artist) => (
          <FeaturedArtist key={artist.id} artist={artist} />
        ))}
      </HorizontalScroller>
    </section>
  );
}

function FeaturedArtist({
  artist,
}: {
  artist: Awaited<ReturnType<typeof getArtists>>[number];
}) {
  const avatarUrl =
    artist.imageUrl ?? artist.nextEvent?.imageUrl ?? artist.fallbackImageUrl ?? null;
  return (
    <Link
      href={`/artistas/${artist.id}`}
      className="group grid w-20 shrink-0 justify-items-center gap-2 text-center"
    >
      <span className="relative h-16 w-16 overflow-hidden rounded-full border border-white/20 bg-[#0b1d26] transition group-hover:border-[#00c2d1]">
        {avatarUrl ? (
          <EventArtwork
            src={avatarUrl}
            alt=""
            className="h-full w-full object-cover"
            iconClassName="h-7 w-7"
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
  );
}

function parseArtistMode(mode?: string): ArtistSortMode {
  if (mode === "upcoming" || mode === "all" || mode === "az") {
    return mode;
  }

  return "popular";
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

function ArtistFilters({
  query,
  mode,
}: {
  query: string;
  mode: ArtistSortMode;
}) {
  const chips: Array<{
    mode: ArtistSortMode;
    label: string;
    icon: typeof Flame;
  }> = [
    { mode: "popular", label: "Populares", icon: Flame },
    { mode: "upcoming", label: "Proximos", icon: Clock3 },
    { mode: "all", label: "Todos", icon: ListMusic },
    { mode: "az", label: "A-Z", icon: SlidersHorizontal },
  ];

  function buildHref(nextMode: ArtistSortMode, nextQuery = query) {
    const params = new URLSearchParams();

    if (nextMode !== "popular") params.set("mode", nextMode);
    if (nextQuery) params.set("q", nextQuery);

    const search = params.toString();
    return search ? `/artistas?${search}` : "/artistas";
  }

  return (
    <div className="mt-4 grid gap-3 md:mt-6">
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 py-2 [scrollbar-width:none] sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden">
        {chips.map(({ mode: chipMode, label, icon: Icon }) => {
          const active = mode === chipMode;
          const redAccent = chipMode === "popular";
          const tone = redAccent ? "red" : "cyan";

          return (
            <Link
              key={chipMode}
              href={buildHref(chipMode)}
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
              {label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function ArtistCard({ artist }: { artist: Awaited<ReturnType<typeof getArtists>>[number] }) {
  const avatarUrl =
    artist.imageUrl ?? artist.nextEvent?.imageUrl ?? artist.fallbackImageUrl ?? null;
  const date = artist.nextEvent ? formatDateBadge(artist.nextEvent.eventDate) : null;

  return (
    <Link
      href={`/artistas/${artist.id}`}
      className="group flex min-w-0 flex-col items-center overflow-hidden rounded-lg bg-white/[0.03] p-3 text-center transition hover:-translate-y-0.5 hover:bg-white/[0.055] md:p-4"
    >
      <div className="flex min-w-0 flex-col items-center">
        <span className="relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-[#0b1d26] text-[#00c2d1] ring-1 ring-white/[0.18] md:h-20 md:w-20">
            {avatarUrl ? (
              <EventArtwork
                src={avatarUrl}
                alt=""
                className="h-full w-full object-cover"
                iconClassName="h-8 w-8"
              />
            ) : (
              <Music2 className="h-8 w-8" aria-hidden="true" />
            )}
          </span>
      </div>

      <div className="mt-2 flex w-full min-w-0 flex-1 flex-col items-center md:mt-4">
        <h3 className="line-clamp-2 min-h-8 w-full max-w-full break-words text-center text-sm font-black leading-[1.15] text-[#f6f3ea] md:min-h-10 md:text-base">
          {artist.name}
        </h3>
        <p className="mt-1 max-w-full truncate text-[11px] font-bold text-slate-500 md:text-xs">
          {date ? `${date.day} ${date.month} - ${artist.nextEvent?.venue.name}` : "Sin fecha proxima"}
        </p>
        <div className="mt-2 flex justify-center gap-1 text-[11px] font-bold text-slate-400 md:mt-3 md:gap-2">
          <span className="inline-flex min-w-0 items-center justify-center gap-1 rounded-full bg-white/[0.06] px-1.5 py-1 text-[#00c2d1] md:px-2.5">
            <CalendarDays className="h-3 w-3 shrink-0" aria-hidden="true" />
            {artist.eventCount}
          </span>
          <span className="inline-flex min-w-0 items-center justify-center gap-1 rounded-full bg-white/[0.06] px-1.5 py-1 text-[#ff8a9b] md:px-2.5">
            <Bell className="h-3 w-3 shrink-0" aria-hidden="true" />
            {artist.subscriberCount}
          </span>
        </div>
        <div className="mt-auto hidden w-full items-center justify-center gap-1 border-t border-white/8 pt-3 text-sm font-bold md:flex">
          <span className="text-slate-400">
            {artist.eventCount > 0 ? "Ver fechas" : "Ver perfil"}
          </span>
          <ChevronRight className="h-4 w-4 text-[#00c2d1] transition group-hover:translate-x-0.5" aria-hidden="true" />
        </div>
      </div>
    </Link>
  );
}
