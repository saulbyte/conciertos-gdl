import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Bell, CalendarDays, Heart, Music2 } from "lucide-react";
import { ArtistInterestForm } from "@/components/ArtistInterestForm";
import { EventCard } from "@/components/EventCard";
import { EventArtwork } from "@/components/EventArtwork";
import { getArtistById } from "@/lib/artists";
import { formatDateBadge } from "@/lib/format";

export const dynamic = "force-dynamic";

type ArtistPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ArtistPage({ params }: ArtistPageProps) {
  const { id } = await params;
  const artist = await getArtistById(id);

  if (!artist) {
    notFound();
  }

  const nextEvent = artist.events[0] ?? null;
  const date = nextEvent ? formatDateBadge(nextEvent.eventDate) : null;
  const avatarUrl = artist.imageUrl ?? nextEvent?.imageUrl ?? null;

  return (
    <main className="bg-slate-50">
      <section className="relative isolate overflow-hidden border-b border-violet-100 bg-slate-950 text-white">
        <div className="absolute inset-0 -z-20 opacity-30">
          <EventArtwork
            src={artist.imageUrl ?? nextEvent?.imageUrl ?? null}
            alt=""
            className="h-full w-full object-cover blur-sm scale-105"
          />
        </div>
        <div className="absolute inset-0 -z-10 bg-slate-950/80" />
        <div className="mx-auto w-full max-w-7xl px-4 py-7 sm:px-6 sm:py-10 lg:px-8">
          <Link
            href="/artistas"
            className="inline-flex items-center gap-2 text-sm font-bold text-slate-300 transition hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Volver a artistas
          </Link>

          <div className="mt-7 grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end">
            <div className="min-w-0">
              <div className="flex min-w-0 items-center gap-4">
                <span className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-white/70 bg-violet-600 shadow-lg shadow-violet-950/30">
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
                <div className="min-w-0">
                  <p className="text-sm font-bold uppercase text-violet-300">
                    Perfil de artista
                  </p>
                  <h1 className="mt-1 truncate text-4xl font-bold leading-tight sm:text-6xl">
                    {artist.name}
                  </h1>
                </div>
              </div>

              <div className="mt-7 grid min-w-0 gap-3 sm:grid-cols-3">
                <Stat
                  icon={CalendarDays}
                  label="Proximas fechas"
                  value={artist.events.length}
                />
                <Stat
                  icon={Bell}
                  label="Interesados"
                  value={artist.subscriberCount}
                />
                <Stat
                  icon={Heart}
                  label="Mas cerca"
                  value={date ? `${date.day} ${date.month}` : "Sin fecha"}
                />
              </div>
            </div>

            <ArtistInterestForm artistId={artist.id} artistName={artist.name} />
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <div className="mb-5">
          <p className="text-sm font-bold uppercase text-violet-700">
            Cartelera
          </p>
          <h2 className="mt-1 text-2xl font-bold text-slate-950">
            {artist.events.length > 0
              ? `Conciertos de ${artist.name}`
              : "Sin proximas fechas"}
          </h2>
        </div>

        {artist.events.length > 0 ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {artist.events.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-slate-300 bg-white px-5 py-12 text-center">
            <p className="text-lg font-bold text-slate-950">
              Todavia no tenemos fechas futuras.
            </p>
            <p className="mt-2 text-sm text-slate-600">
              Puedes dejar tu correo y te avisamos cuando aparezca una.
            </p>
          </div>
        )}
      </section>
    </main>
  );
}

type StatProps = {
  icon: typeof CalendarDays;
  label: string;
  value: number | string;
};

function Stat({ icon: Icon, label, value }: StatProps) {
  return (
    <div className="min-w-0 rounded-lg border border-white/10 bg-white/8 p-4 backdrop-blur">
      <Icon className="h-5 w-5 text-violet-300" aria-hidden="true" />
      <p className="mt-3 text-2xl font-bold">{value}</p>
      <p className="mt-1 text-xs font-semibold uppercase text-slate-300">
        {label}
      </p>
    </div>
  );
}
