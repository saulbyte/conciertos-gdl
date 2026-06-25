import Link from "next/link";
import {
  Bell,
  CalendarDays,
  ChevronRight,
  Music2,
  Search,
  Sparkles,
  UsersRound,
  X,
} from "lucide-react";
import { EventArtwork } from "@/components/EventArtwork";
import { getArtists } from "@/lib/artists";
import { formatEventDate } from "@/lib/format";

export const dynamic = "force-dynamic";

type ArtistsPageProps = {
  searchParams: Promise<{
    q?: string;
  }>;
};

export default async function ArtistsPage({ searchParams }: ArtistsPageProps) {
  const filters = await searchParams;
  const query = typeof filters.q === "string" ? filters.q.trim() : "";
  const artists = await getArtists(query);
  const hasSearch = query.length > 0;

  return (
    <main className="bg-slate-50">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-7 sm:px-6 sm:py-10 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-end lg:px-8">
          <div className="min-w-0">
            <p className="text-sm font-bold uppercase text-violet-700">Artistas</p>
            <h1 className="mt-2 max-w-3xl text-3xl font-bold leading-tight text-slate-950 sm:text-5xl">
              Busca artistas y recibe alertas de conciertos
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
              Encuentra perfiles de artistas con fechas en Guadalajara y deja tu
              correo para que te avisemos cuando aparezcan nuevos eventos.
            </p>
          </div>

          <form action="/artistas" className="w-full rounded-lg border border-slate-200 bg-slate-50 p-3 shadow-sm">
            <label className="relative block">
              <span className="sr-only">Buscar artista</span>
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
                aria-hidden="true"
              />
              <input
                type="search"
                name="q"
                defaultValue={query}
                placeholder="Buscar artista..."
                className="h-12 w-full rounded-md border border-slate-300 bg-white pl-10 pr-3 text-sm font-semibold text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
              />
            </label>
            <div className="mt-3 flex items-center gap-2">
              <button
                type="submit"
                className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-md bg-violet-600 px-4 text-sm font-bold text-white shadow-lg shadow-violet-100 transition hover:bg-violet-700"
              >
                <Search className="h-4 w-4" aria-hidden="true" />
                Buscar
              </button>
              {hasSearch ? (
                <Link
                  href="/artistas"
                  className="inline-flex h-11 w-11 items-center justify-center rounded-md border border-slate-300 bg-white text-slate-600 transition hover:border-violet-300 hover:text-violet-700"
                  aria-label="Limpiar busqueda"
                  title="Limpiar busqueda"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </Link>
              ) : null}
            </div>
          </form>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <div className="mb-5 flex items-end justify-between gap-3">
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
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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

function ArtistCard({ artist }: { artist: Awaited<ReturnType<typeof getArtists>>[number] }) {
  const avatarUrl =
    artist.imageUrl ?? artist.nextEvent?.imageUrl ?? artist.fallbackImageUrl ?? null;

  return (
    <Link
      href={`/artistas/${artist.id}`}
      className="group grid min-h-64 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:border-violet-200 hover:shadow-xl hover:shadow-slate-200/70"
    >
      <div className="relative overflow-hidden bg-[linear-gradient(135deg,#0f172a,#312e81)] px-4 pb-5 pt-4 text-white">
        <div className="absolute inset-0 opacity-25">
          <EventArtwork
            src={avatarUrl}
            alt=""
            className="h-full w-full object-cover blur-sm scale-110"
          />
        </div>
        <div className="absolute inset-0 bg-slate-950/70" />

        <div className="relative flex items-start justify-between gap-3">
          <span className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-white/70 bg-violet-600 shadow-lg shadow-slate-950/25">
            {avatarUrl ? (
              <EventArtwork
                src={avatarUrl}
                alt={artist.name}
                className="h-full w-full object-cover"
                iconClassName="h-8 w-8"
              />
            ) : (
              <Music2 className="h-8 w-8" aria-hidden="true" />
            )}
          </span>

          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/12 px-3 py-1 text-[11px] font-bold uppercase text-violet-100 backdrop-blur">
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            Perfil
          </span>
        </div>

        <div className="relative mt-4 min-w-0">
          <h3 className="truncate text-xl font-bold leading-7">{artist.name}</h3>
          <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/12 px-3 py-1.5 text-white">
              <Bell className="h-3.5 w-3.5" aria-hidden="true" />
              {artist.subscriberCount} interesados
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/12 px-3 py-1.5 text-white">
              <UsersRound className="h-3.5 w-3.5" aria-hidden="true" />
              {artist.eventCount} proximos
            </span>
          </div>
        </div>
      </div>

      <div className="grid gap-4 p-4">
        {artist.nextEvent ? (
          <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs font-bold uppercase text-slate-500">
              Proxima fecha
            </p>
            <p className="mt-1 line-clamp-1 text-sm font-bold leading-5 text-slate-950">
              {formatEventDate(artist.nextEvent.eventDate, artist.nextEvent.source)}
            </p>
            <p className="mt-2 flex items-center gap-2 text-sm text-slate-600">
              <CalendarDays className="h-4 w-4 text-violet-600" aria-hidden="true" />
              <span className="line-clamp-1">{artist.nextEvent.title}</span>
            </p>
          </div>
        ) : (
          <p className="text-sm leading-6 text-slate-600">
            Este artista queda listo para avisos cuando aparezca una fecha.
          </p>
        )}

        <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-4 text-sm font-bold">
          <span className="text-slate-500">
            Avisos y conciertos del artista
          </span>
          <span className="inline-flex items-center gap-1 text-violet-700">
            Ver perfil
            <ChevronRight className="h-4 w-4 transition group-hover:translate-x-0.5" aria-hidden="true" />
          </span>
        </div>
      </div>
    </Link>
  );
}
