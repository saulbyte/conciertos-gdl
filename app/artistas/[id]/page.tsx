import Link from "next/link";
import { notFound } from "next/navigation";
import { Bell, CalendarDays, Heart, Music2 } from "lucide-react";
import { ArtistInterestForm } from "@/components/ArtistInterestForm";
import { EventCard } from "@/components/EventCard";
import { EventArtwork } from "@/components/EventArtwork";
import { EventShareButton } from "@/components/EventShareButton";
import { SmartBackButton } from "@/components/SmartBackButton";
import {
  getArtistById,
  getRecommendedArtists,
  type ArtistListItem,
} from "@/lib/artists";
import { formatDateBadge } from "@/lib/format";

export const dynamic = "force-dynamic";

type ArtistPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ArtistPage({ params }: ArtistPageProps) {
  const { id } = await params;
  const [artist, recommendedArtists] = await Promise.all([
    getArtistById(id),
    getRecommendedArtists(id, 8),
  ]);

  if (!artist) {
    notFound();
  }

  const nextEvent = artist.events[0] ?? null;
  const date = nextEvent ? formatDateBadge(nextEvent.eventDate) : null;
  const avatarUrl =
    artist.imageUrl ?? nextEvent?.imageUrl ?? artist.fallbackImageUrl ?? null;

  return (
    <main className="bg-slate-50">
      <section className="relative isolate overflow-hidden border-b border-violet-100 bg-slate-950 text-white">
        <div className="absolute inset-0 -z-20 opacity-30">
          <EventArtwork
            src={avatarUrl}
            alt=""
            className="h-full w-full object-cover blur-sm scale-105"
          />
        </div>
        <div className="absolute inset-0 -z-10 bg-slate-950/80" />
        <div className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 sm:py-10 lg:px-8">
          <div className="flex items-center justify-between gap-3">
            <SmartBackButton
              fallbackHref="/artistas"
              label="Volver"
              variant="dark"
            />
            <EventShareButton
              title={artist.name}
              path={`/artistas/${artist.id}`}
              variant="compact"
            />
          </div>

          <div className="mt-5 grid min-w-0 gap-5 lg:mt-7 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end">
            <div className="min-w-0">
              <div className="flex min-w-0 items-center gap-3 sm:gap-4">
                <span className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-white/70 bg-violet-600 shadow-lg shadow-violet-950/30 sm:h-20 sm:w-20">
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
                  <p className="text-xs font-bold uppercase text-violet-300 sm:text-sm">
                    Perfil de artista
                  </p>
                  <h1 className="mt-0.5 truncate text-3xl font-bold leading-tight sm:mt-1 sm:text-6xl">
                    {artist.name}
                  </h1>
                </div>
              </div>

              <div className="mt-5 grid min-w-0 grid-cols-3 gap-2 sm:mt-7 sm:gap-3">
                <Stat
                  icon={CalendarDays}
                  label="Fechas"
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
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {artist.events.map((event) => (
              <EventCard key={event.id} event={event} variant="compact" />
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

      {recommendedArtists.length > 0 ? (
        <section className="border-t border-slate-200 bg-white">
          <div className="mx-auto w-full max-w-7xl px-4 py-7 sm:px-6 lg:px-8">
            <div className="mb-4 flex items-end justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase text-violet-700">
                  Sigue descubriendo
                </p>
                <h2 className="mt-1 text-xl font-bold text-slate-950">
                  Artistas con fechas proximas
                </h2>
              </div>
              <Link
                href="/artistas?mode=upcoming"
                className="shrink-0 text-sm font-bold text-violet-700"
              >
                Ver mas
              </Link>
            </div>
            <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
              {recommendedArtists.map((recommendedArtist) => (
                <RecommendedArtistCard
                  key={recommendedArtist.id}
                  artist={recommendedArtist}
                />
              ))}
            </div>
          </div>
        </section>
      ) : null}
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
    <div className="min-w-0 rounded-md border border-white/10 bg-white/8 p-3 backdrop-blur sm:rounded-lg sm:p-4">
      <Icon className="h-4 w-4 text-violet-300 sm:h-5 sm:w-5" aria-hidden="true" />
      <p className="mt-2 truncate text-lg font-bold sm:mt-3 sm:text-2xl">{value}</p>
      <p className="mt-0.5 truncate text-[10px] font-semibold uppercase text-slate-300 sm:mt-1 sm:text-xs">
        {label}
      </p>
    </div>
  );
}

function RecommendedArtistCard({ artist }: { artist: ArtistListItem }) {
  const imageUrl = artist.imageUrl ?? artist.fallbackImageUrl ?? artist.nextEvent?.imageUrl ?? null;
  const date = artist.nextEvent ? formatDateBadge(artist.nextEvent.eventDate) : null;

  return (
    <Link
      href={`/artistas/${artist.id}`}
      className="w-28 shrink-0 text-center sm:w-32"
    >
      <span className="mx-auto flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-violet-600 shadow-sm sm:h-24 sm:w-24">
        {imageUrl ? (
          <EventArtwork
            src={imageUrl}
            alt={artist.name}
            className="h-full w-full object-cover"
            iconClassName="h-8 w-8"
          />
        ) : (
          <Music2 className="h-8 w-8 text-white" aria-hidden="true" />
        )}
      </span>
      <span className="mt-2 block truncate text-sm font-bold text-slate-950">
        {artist.name}
      </span>
      <span className="mt-0.5 block text-xs font-semibold text-slate-500">
        {date ? `${date.day} ${date.month}` : `${artist.eventCount} fechas`}
      </span>
    </Link>
  );
}
