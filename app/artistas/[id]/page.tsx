import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Bell,
  CalendarDays,
  Heart,
  Search,
} from "lucide-react";
import { ArtistInterestForm } from "@/components/ArtistInterestForm";
import { ArtistInteractionTracker } from "@/components/ArtistInteractionTracker";
import { ArtistNoticeButton } from "@/components/ArtistNoticeButton";
import { BrandLogo } from "@/components/BrandLogo";
import { EventArtwork } from "@/components/EventArtwork";
import { EventShareButton } from "@/components/EventShareButton";
import { HomeEventCard } from "@/components/HomeEventCard";
import { MobileMenu } from "@/components/MobileMenu";
import { Breadcrumbs } from "@/components/Breadcrumbs";
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
    <main data-artists-page className="bg-[#071018] text-[#f6f3ea]">
      <ArtistInteractionTracker artistId={artist.id} />
      <section className="bg-[#071018] text-[#f6f3ea]">
        <div className="mx-auto w-full max-w-7xl px-4 pb-5 pt-0 sm:px-6 sm:py-7 lg:px-8">
          <div className="mb-5 flex h-16 items-center justify-between gap-3 md:hidden">
            <BrandLogo compact />
            <div className="flex items-center gap-2">
              <Link
                href="/?search=open"
                className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-[#ff304f] text-white shadow-[0_0_18px_rgba(255,48,79,0.18)] transition hover:bg-[#ff5d74]"
                aria-label="Buscar"
                title="Buscar"
              >
                <Search className="h-5 w-5" aria-hidden="true" />
              </Link>
              <MobileMenu />
            </div>
          </div>

          <div className="mb-3 md:hidden">
            <SmartBackButton
              fallbackHref="/artistas"
              label="Volver"
              variant="dark"
            />
          </div>

          <div className="hidden min-w-0 md:block">
            <div className="grid justify-start gap-2">
              <SmartBackButton
                fallbackHref="/artistas"
                label="Volver"
                variant="dark"
              />
              <Breadcrumbs
                variant="dark"
                items={[
                  { label: "Artistas", href: "/artistas" },
                  { label: artist.name },
                ]}
              />
            </div>
          </div>

          <div className="mt-4 grid min-w-0 gap-5 md:grid-cols-[220px_minmax(0,1fr)_320px] lg:grid-cols-[240px_minmax(0,1fr)_360px] lg:items-start">
            <div className="relative mx-auto md:mx-0">
              <span className="flex h-40 w-40 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/[0.28] bg-[#0b1d26] text-[#00c2d1] shadow-lg shadow-black/30 md:h-48 md:w-48">
                  <EventArtwork
                    src={avatarUrl}
                    alt={artist.name}
                    className="h-full w-full object-cover"
                    iconClassName="h-12 w-12"
                  />
                </span>
              <div className="absolute right-0 top-5 md:hidden">
                <EventShareButton
                  title={artist.name}
                  path={`/artistas/${artist.id}`}
                  variant="compact"
                />
              </div>
            </div>

            <div className="min-w-0 text-center md:text-left">
              <div className="hidden md:flex md:justify-end">
                <EventShareButton
                  title={artist.name}
                  path={`/artistas/${artist.id}`}
                  variant="compact"
                />
              </div>
              <p className="mt-1 text-xs font-black uppercase tracking-[0.18em] text-[#00c2d1] md:mt-6">
                Perfil de artista
              </p>
              <h1 className="mx-auto mt-1 max-w-lg text-3xl font-black leading-tight md:mx-0 md:text-5xl">
                {artist.name}
              </h1>

              <div className="mx-auto mt-5 grid max-w-md grid-cols-3 divide-x divide-white/[0.12] md:mx-0">
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

              <div className="mt-5 flex flex-wrap justify-center gap-3 md:justify-start">
                <ArtistNoticeButton />
                <span className="hidden md:inline-flex">
                  <EventShareButton
                    title={artist.name}
                    path={`/artistas/${artist.id}`}
                    variant="detail"
                  />
                </span>
              </div>
            </div>

            <div className="hidden md:block">
              <ArtistInterestForm
                artistId={artist.id}
                artistName={artist.name}
                compact
              />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="min-w-0">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-xl font-black text-[#f6f3ea]">
              Proximas fechas
            </h2>
            <Link
              href="/#eventos"
              className="text-xs font-bold text-[#00c2d1] transition hover:text-white"
            >
              Ver todas
            </Link>
          </div>

          {artist.events.length > 0 ? (
            <div className="grid gap-2 lg:grid-cols-2">
              {artist.events.map((event) => (
                <HomeEventCard key={event.id} event={event} compact />
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-white/12 px-5 py-12 text-center">
              <p className="text-lg font-black text-[#f6f3ea]">
                Todavia no encontramos fechas futuras.
              </p>
              <p className="mt-2 text-sm text-slate-400">
                Puedes dejar tu correo y te avisamos cuando aparezca algo que valga la pena vivir.
              </p>
            </div>
          )}
          <p className="mt-4 text-xs text-slate-500">
            Fechas y horarios sujetos a cambios.
          </p>
          <div className="mt-4 md:hidden">
            <ArtistInterestForm
              artistId={artist.id}
              artistName={artist.name}
              compact
            />
          </div>
        </div>

      </section>

      {recommendedArtists.length > 0 ? (
        <section className="border-t border-white/8">
          <div className="mx-auto w-full max-w-7xl px-4 py-7 sm:px-6 lg:px-8">
            <div className="mb-4 flex items-end justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[#00c2d1]">
                  Sigue descubriendo
                </p>
                <h2 className="mt-1 text-xl font-black text-[#f6f3ea]">
                  Artistas que podrias descubrir despues
                </h2>
              </div>
              <Link
                href="/artistas?mode=upcoming"
                className="shrink-0 text-sm font-bold text-[#00c2d1] hover:text-white"
              >
                Ver mas
              </Link>
            </div>
            <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
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
    <div className="grid min-w-0 justify-items-center gap-1 px-3 text-center md:justify-items-start md:text-left">
      <Icon className="h-5 w-5 shrink-0 text-[#00c2d1]" aria-hidden="true" />
      <p className="truncate text-base font-black leading-none text-[#f6f3ea]">
        {value}
      </p>
      <p className="truncate text-[10px] font-semibold leading-none text-slate-400">
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
      <span className="mx-auto flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border border-white/[0.18] bg-[#0b1d26] text-[#00c2d1] sm:h-24 sm:w-24">
        <EventArtwork
          src={imageUrl}
          alt={artist.name}
          className="h-full w-full object-cover"
          iconClassName="h-8 w-8"
        />
      </span>
      <span className="mt-2 block truncate text-sm font-bold text-[#f6f3ea]">
        {artist.name}
      </span>
      <span className="mt-0.5 block text-xs font-semibold text-slate-400">
        {date ? `${date.day} ${date.month}` : `${artist.eventCount} fechas`}
      </span>
    </Link>
  );
}
