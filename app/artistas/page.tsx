import Link from "next/link";
import {
  Bell,
  CalendarDays,
  ChevronRight,
  Music2,
  Sparkles,
  UsersRound,
} from "lucide-react";
import { EventArtwork } from "@/components/EventArtwork";
import { getArtists } from "@/lib/artists";
import { formatEventDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function ArtistsPage() {
  const artists = await getArtists();
  const highlighted = artists.slice(0, 3);

  return (
    <main className="bg-slate-50">
      <section className="border-b border-violet-100 bg-white">
        <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-sm font-bold uppercase text-violet-700">
              Artistas
            </p>
            <h1 className="mt-2 text-3xl font-bold leading-tight text-slate-950 sm:text-5xl">
              Sigue a quien no te quieres perder
            </h1>
            <p className="mt-4 text-base leading-7 text-slate-600 sm:text-lg">
              Explora artistas con fechas proximas en Guadalajara y activa avisos
              por correo cuando aparezcan conciertos nuevos.
            </p>
          </div>

          {highlighted.length > 0 ? (
            <div className="mt-7 grid gap-3 sm:grid-cols-3">
              {highlighted.map((artist, index) => (
                <Link
                  key={artist.id}
                  href={`/artistas/${artist.id}`}
                  className="group flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 transition hover:border-violet-200 hover:bg-violet-50"
                >
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-slate-950 text-sm font-bold text-white">
                    {index + 1}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-bold text-slate-950 group-hover:text-violet-700">
                      {artist.name}
                    </span>
                    <span className="mt-0.5 block text-xs font-medium text-slate-500">
                      {artist.nextEvent ? "Proxima fecha" : "En observacion"}
                    </span>
                  </span>
                </Link>
              ))}
            </div>
          ) : null}
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <div className="mb-5 flex items-end justify-between gap-3">
          <div>
            <p className="text-sm font-bold uppercase text-violet-700">
              Catalogo
            </p>
            <h2 className="mt-1 text-2xl font-bold text-slate-950">
              {artists.length} artistas con eventos
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
              Aun no hay artistas con proximas fechas.
            </p>
            <p className="mt-2 text-sm text-slate-600">
              Corre la sincronizacion para alimentar el catalogo.
            </p>
          </div>
        )}
      </section>
    </main>
  );
}

function ArtistCard({ artist }: { artist: Awaited<ReturnType<typeof getArtists>>[number] }) {
  return (
    <Link
      href={`/artistas/${artist.id}`}
      className="group grid min-h-64 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:border-violet-200 hover:shadow-xl hover:shadow-slate-200/70"
    >
      <div className="relative overflow-hidden bg-[linear-gradient(135deg,#0f172a,#312e81)] px-4 pb-5 pt-4 text-white">
        <div className="absolute inset-0 opacity-25">
          <EventArtwork
            src={artist.imageUrl ?? artist.nextEvent?.imageUrl ?? null}
            alt=""
            className="h-full w-full object-cover blur-sm scale-110"
          />
        </div>
        <div className="absolute inset-0 bg-slate-950/70" />

        <div className="relative flex items-start justify-between gap-3">
          <span className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-white/70 bg-violet-600 shadow-lg shadow-slate-950/25">
            {artist.imageUrl ? (
              <EventArtwork
                src={artist.imageUrl}
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
              {artist.eventCount} eventos
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
