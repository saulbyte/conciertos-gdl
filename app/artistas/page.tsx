import Link from "next/link";
import {
  Bell,
  ChevronRight,
  Clock3,
  ListMusic,
  Music2,
  Search,
  SlidersHorizontal,
  Sparkles,
  UsersRound,
  X,
} from "lucide-react";
import { EventArtwork } from "@/components/EventArtwork";
import { getArtists, type ArtistSortMode } from "@/lib/artists";

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

  return (
    <main data-artists-page className="min-h-dvh bg-slate-50 md:bg-slate-50">
      <section className="border-b border-white/10 bg-slate-950 text-white md:border-slate-200 md:bg-white md:text-slate-950">
        <div className="mx-auto w-full max-w-7xl px-4 pb-4 pt-[max(0.9rem,env(safe-area-inset-top))] sm:px-6 md:py-8 lg:px-8">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase text-violet-300 md:text-violet-700">
                Conciertos GDL
              </p>
              <h1 className="mt-0.5 text-2xl font-bold md:text-4xl">Artistas</h1>
            </div>
            <p className="pb-1 text-xs font-semibold text-slate-300 md:text-slate-500">
              {artists.length} {artists.length === 1 ? "artista" : "artistas"}
            </p>
          </div>

          <ArtistFilters query={query} mode={mode} />
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-3 pb-24 pt-5 sm:px-6 sm:py-10 lg:px-8">
        <div className="mb-4 hidden items-end justify-between gap-3 md:flex">
          <div>
            <p className="text-sm font-bold uppercase text-violet-700">
              Catalogo
            </p>
            <h2 className="mt-1 text-2xl font-bold text-slate-950">
              {hasSearch
                ? `${artists.length} resultados para "${query}"`
                : `${artists.length} artistas en catalogo`}
            </h2>
          </div>
        </div>

        {artists.length > 0 ? (
          <div className="grid grid-cols-3 gap-x-3 gap-y-6 sm:grid-cols-4 md:grid-cols-3 md:gap-4 lg:grid-cols-4 xl:grid-cols-5">
            {artists.map((artist) => (
              <ArtistCard key={artist.id} artist={artist} />
            ))}
          </div>
        ) : (
          <div className="border-y border-dashed border-slate-300 bg-white px-5 py-16 text-center">
            <p className="text-lg font-bold text-slate-950">
              {hasSearch
                ? "No encontramos artistas con esa busqueda."
                : "Aun no hay artistas en el catalogo."}
            </p>
            <p className="mt-2 text-sm text-slate-600">
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

function parseArtistMode(mode?: string): ArtistSortMode {
  if (mode === "upcoming" || mode === "all" || mode === "az") {
    return mode;
  }

  return "popular";
}

function ArtistFilters({
  query,
  mode,
}: {
  query: string;
  mode: ArtistSortMode;
}) {
  const hasSearch = query.length > 0;
  const chips: Array<{
    mode: ArtistSortMode;
    label: string;
    icon: typeof Sparkles;
  }> = [
    { mode: "popular", label: "Populares", icon: Sparkles },
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
    <div className="mt-4 grid gap-3 md:mt-6 md:grid-cols-[minmax(0,1fr)_minmax(280px,380px)] md:items-center">
      <div className="flex gap-2 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {chips.map(({ mode: chipMode, label, icon: Icon }) => {
          const active = mode === chipMode;

          return (
            <Link
              key={chipMode}
              href={buildHref(chipMode)}
              aria-current={active ? "page" : undefined}
              className={`inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-md border px-3 text-xs font-bold transition md:min-h-10 md:px-4 ${
                active
                  ? "border-violet-400 bg-violet-600 text-white"
                  : "border-white/20 bg-white/10 text-white md:border-slate-200 md:bg-slate-50 md:text-slate-700"
              }`}
            >
              <Icon className="h-3.5 w-3.5" aria-hidden="true" />
              {label}
            </Link>
          );
        })}
      </div>

      <form action="/artistas" className="flex gap-2">
        {mode !== "popular" ? <input type="hidden" name="mode" value={mode} /> : null}
        <label className="relative min-w-0 flex-1">
          <span className="sr-only">Buscar artista</span>
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
          <input
            type="search"
            name="q"
            defaultValue={query}
            placeholder="Buscar artista"
            className="h-10 w-full rounded-md border border-white/20 bg-white/10 pl-9 pr-3 text-sm font-bold text-white outline-none transition placeholder:text-slate-400 focus:border-violet-300 focus:ring-4 focus:ring-violet-500/20 md:border-slate-200 md:bg-slate-50 md:text-slate-950 md:placeholder:text-slate-400"
          />
        </label>
        <button
          type="submit"
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-violet-600 text-white transition hover:bg-violet-700"
          aria-label="Buscar"
          title="Buscar"
        >
          <Search className="h-4 w-4" aria-hidden="true" />
        </button>
        {hasSearch ? (
          <Link
            href={buildHref(mode, "")}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-white/20 bg-white/10 text-white transition hover:border-violet-300 md:border-slate-200 md:bg-slate-50 md:text-slate-600"
            aria-label="Limpiar busqueda"
            title="Limpiar busqueda"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </Link>
        ) : null}
      </form>
    </div>
  );
}

function ArtistCard({ artist }: { artist: Awaited<ReturnType<typeof getArtists>>[number] }) {
  const avatarUrl =
    artist.imageUrl ?? artist.nextEvent?.imageUrl ?? artist.fallbackImageUrl ?? null;

  return (
    <Link
      href={`/artistas/${artist.id}`}
      className="group min-w-0 text-center transition hover:-translate-y-0.5 md:overflow-hidden md:rounded-lg md:border md:border-slate-200 md:bg-white md:p-4 md:text-left md:shadow-sm md:hover:border-violet-200 md:hover:shadow-xl md:hover:shadow-slate-200/70"
    >
      <div className="flex min-w-0 flex-col items-center md:items-start">
        <span className="relative flex aspect-square w-full max-w-[92px] items-center justify-center overflow-hidden rounded-full border-2 border-white bg-violet-600 shadow-md shadow-slate-200 md:h-20 md:w-20 md:max-w-none md:border-violet-100">
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

      <div className="mt-2 min-w-0 md:mt-4">
        <h3 className="line-clamp-2 min-h-9 text-sm font-bold leading-[1.15] text-slate-950 md:min-h-0 md:truncate md:text-lg">
          {artist.name}
        </h3>
        <div className="mt-1.5 grid grid-cols-2 gap-1 text-[11px] font-bold text-slate-500 md:mt-3 md:flex md:flex-wrap md:gap-2">
          <span className="inline-flex min-w-0 items-center justify-center gap-1 rounded-full bg-slate-100 px-1.5 py-1 md:bg-violet-50 md:px-2.5 md:text-violet-800">
            <UsersRound className="h-3 w-3 shrink-0" aria-hidden="true" />
            {artist.eventCount}
          </span>
          <span className="inline-flex min-w-0 items-center justify-center gap-1 rounded-full bg-slate-100 px-1.5 py-1 md:bg-slate-100 md:px-2.5">
            <Bell className="h-3 w-3 shrink-0" aria-hidden="true" />
            {artist.subscriberCount}
          </span>
        </div>
        <div className="mt-3 hidden items-center justify-between border-t border-slate-100 pt-3 text-sm font-bold md:flex">
          <span className="text-slate-500">Ver perfil</span>
          <ChevronRight className="h-4 w-4 text-violet-700 transition group-hover:translate-x-0.5" aria-hidden="true" />
        </div>
      </div>
    </Link>
  );
}
