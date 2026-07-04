import Link from "next/link";
import { notFound } from "next/navigation";
import {
  CalendarDays,
  ChevronRight,
  Clock3,
  ExternalLink,
  MapPin,
  Search,
  TicketCheck,
} from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";
import { EventArtwork } from "@/components/EventArtwork";
import { EventLikeButton } from "@/components/EventLikeButton";
import { EventShareButton } from "@/components/EventShareButton";
import { HomeEventCard } from "@/components/HomeEventCard";
import { MobileMenu } from "@/components/MobileMenu";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { SmartBackButton } from "@/components/SmartBackButton";
import { getEventById, getRelatedEvents } from "@/lib/events";
import {
  formatDateBadge,
  formatEventDate,
  formatEventTime,
  formatSourceName,
} from "@/lib/format";

type EventPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EventPage({ params }: EventPageProps) {
  const { id } = await params;
  const [event, relatedEvents] = await Promise.all([
    getEventById(id),
    getRelatedEvents(id, 4),
  ]);

  if (!event) {
    notFound();
  }

  const artists = event.artists.map(({ artist }) => artist);
  const date = formatDateBadge(event.eventDate);
  const eventTime = formatEventTime(event.eventDate, event.source);

  return (
    <main data-event-detail-page className="bg-[#071018] text-[#f6f3ea]">
      <section className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 sm:py-8 lg:px-8">
        <div className="mb-5 flex items-center justify-between gap-3 md:hidden">
          <BrandLogo compact />
          <div className="flex items-center gap-2">
            <Link
              href="/?search=open"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#ff304f] text-white shadow-[0_0_18px_rgba(255,48,79,0.18)] transition hover:bg-[#ff5d74]"
              aria-label="Buscar"
              title="Buscar"
            >
              <Search className="h-5 w-5" aria-hidden="true" />
            </Link>
            <MobileMenu />
          </div>
        </div>

        <div className="grid justify-start gap-2">
          <SmartBackButton
            fallbackHref="/#eventos"
            label="Volver"
            variant="dark"
          />
          <Breadcrumbs
            variant="dark"
            items={[
              { label: "Eventos", href: "/#eventos" },
              { label: event.title },
            ]}
          />
        </div>

        <div className="mt-5 grid items-start gap-5 lg:grid-cols-[minmax(0,1.05fr)_minmax(360px,0.95fr)]">
          <div className="relative aspect-[16/11] overflow-hidden rounded-lg bg-[#0b1d26] shadow-xl shadow-black/30 sm:aspect-[16/10]">
            <EventArtwork
              src={event.imageUrl}
              className="h-full w-full object-cover"
              iconClassName="h-20 w-20"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#071018]/75 via-transparent to-[#071018]/25" />
            <div className="absolute left-3 top-3 flex flex-col gap-2">
              <DateBadge day={date.day} month={date.month} />
              {event.admissionType === "FREE" ? (
                <span className="inline-flex w-fit items-center gap-1 rounded-md border border-[#00c2d1]/45 bg-[#00c2d1]/15 px-2 py-1 text-[10px] font-black text-[#00c2d1] backdrop-blur">
                  <TicketCheck className="h-3 w-3" aria-hidden="true" />
                  Gratis
                </span>
              ) : null}
            </div>
            <div className="absolute right-3 top-3 flex items-center gap-3 md:hidden">
              <EventLikeButton
                eventId={event.id}
                initialCount={event.likeCount}
                variant="darkCard"
              />
              <EventShareButton
                title={event.title}
                path={`/event/${event.id}`}
                variant="compact"
              />
            </div>
          </div>

          <div className="min-w-0 py-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="inline-flex rounded-md bg-white/[0.08] px-3 py-1.5 text-xs font-black text-slate-300">
                {formatSourceName(event.source)}
              </p>
              {event.admissionType === "FREE" ? (
                <p className="inline-flex items-center gap-1.5 rounded-md bg-[#00c2d1]/10 px-3 py-1.5 text-xs font-black text-[#00c2d1]">
                  <TicketCheck className="h-4 w-4" aria-hidden="true" />
                  Entrada gratis
                </p>
              ) : null}
            </div>
            <h1 className="mt-4 text-3xl font-black leading-[1.08] text-[#f6f3ea] sm:text-4xl lg:text-5xl">
              {event.title}
            </h1>

            <div className="mt-5 border-y border-white/8 py-5">
              <p className="mb-3 text-xs font-black uppercase tracking-[0.18em] text-[#00c2d1]">
                Datos rapidos
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <QuickFact
                  icon={CalendarDays}
                  label="Fecha"
                  value={formatEventDate(event.eventDate, event.source)}
                />
                <QuickFact icon={Clock3} label="Hora" value={eventTime} />
                <QuickFact
                  icon={MapPin}
                  label="Recinto"
                  value={`${event.venue.name}, ${event.venue.city}`}
                />
                <QuickFact
                  icon={TicketCheck}
                  label="Fuente"
                  value={formatSourceName(event.source)}
                />
              </div>
            </div>

            {artists.length > 0 ? (
              <div className="mt-5 grid gap-2">
                {artists.map((artist) => (
                  <Link
                    key={artist.id}
                    href={`/artistas/${artist.id}`}
                    className="group flex items-center gap-3 rounded-lg bg-white/[0.035] p-2.5 transition hover:bg-white/[0.055]"
                  >
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/[0.16] bg-[#0b1d26] text-[#00c2d1]">
                      <EventArtwork
                        src={artist.imageUrl ?? event.imageUrl}
                        alt={artist.name}
                        className="h-full w-full object-cover"
                        iconClassName="h-5 w-5"
                      />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-black text-[#f6f3ea] transition group-hover:text-[#00c2d1]">
                        {artist.name}
                      </span>
                      <span className="mt-0.5 block text-xs font-semibold text-slate-400">
                        Perfil del artista
                      </span>
                    </span>
                    <ChevronRight
                      className="ml-auto h-5 w-5 shrink-0 text-[#00c2d1] transition group-hover:translate-x-0.5"
                      aria-hidden="true"
                    />
                  </Link>
                ))}
              </div>
            ) : null}

            <div className="mt-5 flex flex-wrap items-center gap-3">
              {event.sourceUrl ? (
                <a
                  href={event.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-md bg-[#00c2d1] px-5 text-sm font-black text-[#071018] shadow-lg shadow-black/30 transition hover:bg-[#33d4de] sm:w-auto"
                >
                  Ver evento oficial
                  <ExternalLink className="h-4 w-4" aria-hidden="true" />
                </a>
              ) : null}
              <EventLikeButton
                eventId={event.id}
                initialCount={event.likeCount}
                variant="detail"
              />
              <EventShareButton
                title={event.title}
                path={`/event/${event.id}`}
                variant="compact"
              />
            </div>
            <p className="mt-3 text-xs leading-5 text-slate-500">
              {event.admissionType === "FREE"
                ? "Confirma requisitos de acceso y disponibilidad en el sitio de origen."
                : "La disponibilidad y venta dependen del sitio de origen."}
            </p>
          </div>
        </div>
      </section>

      {event.description ? (
        <section className="border-t border-white/8">
          <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <div className="max-w-3xl">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#00c2d1]">
                Sobre el evento
              </p>
              <h2 className="mt-1 text-xl font-black text-[#f6f3ea]">
                Informacion
              </h2>
              <p className="mt-3 text-sm leading-7 text-slate-400 sm:text-base">
                {event.description}
              </p>
            </div>
          </div>
        </section>
      ) : null}

      {relatedEvents.length > 0 ? (
        <section className="border-t border-white/8">
          <div className="mx-auto w-full max-w-7xl px-4 py-7 sm:px-6 lg:px-8">
            <div className="mb-4 flex items-end justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[#00c2d1]">
                  Sigue descubriendo
                </p>
                <h2 className="mt-1 text-xl font-black text-[#f6f3ea]">
                  Eventos relacionados
                </h2>
              </div>
              <Link
                href="/#eventos"
                className="shrink-0 text-sm font-bold text-[#00c2d1] hover:text-white"
              >
                Ver todos
              </Link>
            </div>
            <div className="grid gap-2 lg:grid-cols-2 xl:grid-cols-4">
              {relatedEvents.map((relatedEvent) => (
                <HomeEventCard
                  key={relatedEvent.id}
                  event={relatedEvent}
                  compact
                />
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </main>
  );
}

function DateBadge({ day, month }: { day: string; month: string }) {
  return (
    <span className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-md border border-[#00c2d1]/30 bg-[#071018]/90 text-[#f6f3ea] shadow-lg shadow-black/30">
      <span className="text-xl font-black leading-none">{day}</span>
      <span className="mt-0.5 text-[9px] font-black uppercase text-[#00c2d1]">
        {month}
      </span>
    </span>
  );
}

function QuickFact({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof CalendarDays;
  label: string;
  value: string;
}) {
  return (
    <div className="flex min-w-0 items-start gap-2.5">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-[#00c2d1]" aria-hidden="true" />
      <span className="min-w-0">
        <span className="block text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">
          {label}
        </span>
        <span className="mt-0.5 block truncate text-sm font-bold text-slate-200">
          {value}
        </span>
      </span>
    </div>
  );
}
