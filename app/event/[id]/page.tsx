import Link from "next/link";
import { notFound } from "next/navigation";
import {
  CalendarDays,
  ExternalLink,
  MapPin,
  TicketCheck,
} from "lucide-react";
import { EventCard } from "@/components/EventCard";
import { EventArtwork } from "@/components/EventArtwork";
import { EventLikeButton } from "@/components/EventLikeButton";
import { EventShareButton } from "@/components/EventShareButton";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { SmartBackButton } from "@/components/SmartBackButton";
import { getEventById, getRelatedEvents } from "@/lib/events";
import { formatEventDate, formatSourceName } from "@/lib/format";

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

  return (
    <main className="bg-slate-50">
      <section className="mx-auto w-full max-w-7xl px-4 py-7 sm:px-6 sm:py-10 lg:px-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <SmartBackButton fallbackHref="/#eventos" label="Volver" />
          <Breadcrumbs
            items={[
              { label: "Inicio", href: "/" },
              { label: "Eventos", href: "/#eventos" },
              { label: event.title },
            ]}
          />
        </div>

        <div className="mt-6 grid items-start gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:gap-12">
          <div className="relative aspect-[16/10] overflow-hidden rounded-lg bg-slate-900 shadow-xl shadow-slate-300/50">
            <EventArtwork
              src={event.imageUrl}
              className="h-full w-full object-cover"
              iconClassName="h-20 w-20"
            />
          </div>

          <div className="py-1">
            <div className="flex flex-wrap gap-2">
              <p className="inline-flex rounded-md bg-violet-100 px-3 py-1.5 text-xs font-bold text-violet-800">
                {formatSourceName(event.source)}
              </p>
              {event.admissionType === "FREE" ? (
                <p className="inline-flex items-center gap-1.5 rounded-md bg-emerald-100 px-3 py-1.5 text-xs font-bold text-emerald-800">
                  <TicketCheck className="h-4 w-4" aria-hidden="true" />
                  Entrada gratis
                </p>
              ) : null}
            </div>
            <h1 className="mt-5 text-3xl font-bold leading-[1.12] text-slate-950 sm:text-4xl lg:text-5xl">
              {event.title}
            </h1>

            <div className="mt-7 grid gap-4 border-y border-slate-200 py-6 text-slate-700">
              <p className="flex items-start gap-3">
                <CalendarDays
                  className="mt-0.5 h-5 w-5 shrink-0 text-violet-600"
                  aria-hidden="true"
                />
                <span>{formatEventDate(event.eventDate, event.source)}</span>
              </p>
              <p className="flex items-start gap-3">
                <MapPin
                  className="mt-0.5 h-5 w-5 shrink-0 text-violet-600"
                  aria-hidden="true"
                />
                <span>
                  {event.venue.name}, {event.venue.city}
                </span>
              </p>
              {artists.length > 0 ? (
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex -space-x-2">
                    {artists.slice(0, 3).map((artist) => (
                      <span
                        key={artist.id}
                        className="h-7 w-7 overflow-hidden rounded-full border-2 border-white bg-violet-600 shadow-sm"
                      >
                        <EventArtwork
                          src={artist.imageUrl ?? event.imageUrl}
                          alt=""
                          className="h-full w-full object-cover"
                          iconClassName="h-3.5 w-3.5"
                        />
                      </span>
                    ))}
                  </div>
                  <span className="flex flex-wrap gap-x-2 gap-y-1">
                    {artists.map((artist, index) => (
                      <span key={artist.id}>
                        <Link
                          href={`/artistas/${artist.id}`}
                          className="font-bold text-violet-700 hover:text-violet-900"
                        >
                          {artist.name}
                        </Link>
                        {index < artists.length - 1 ? "," : ""}
                      </span>
                    ))}
                  </span>
                </div>
              ) : null}
            </div>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              {event.sourceUrl ? (
                <a
                  href={event.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-md bg-violet-600 px-5 text-sm font-bold text-white shadow-lg shadow-violet-200 transition hover:bg-violet-700 sm:w-auto"
                >
                  Ir al sitio oficial
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
                variant="detail"
              />
            </div>
            <p className="mt-3 text-xs text-slate-500">
              {event.admissionType === "FREE"
                ? "Confirma requisitos de acceso y disponibilidad en el sitio de origen."
                : "La disponibilidad y venta dependen del sitio de origen."}
            </p>
          </div>
        </div>
      </section>

      {event.description ? (
        <section className="border-t border-slate-200 bg-white">
          <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
            <div className="max-w-3xl">
              <p className="text-sm font-bold uppercase text-violet-700">
                Sobre el evento
              </p>
              <h2 className="mt-1 text-2xl font-bold text-slate-950">
                Informacion
              </h2>
              <p className="mt-4 text-base leading-8 text-slate-600">
                {event.description}
              </p>
            </div>
          </div>
        </section>
      ) : null}

      {relatedEvents.length > 0 ? (
        <section className="border-t border-slate-200 bg-slate-50">
          <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
            <div className="mb-5 flex items-end justify-between gap-3">
              <div>
                <p className="text-sm font-bold uppercase text-violet-700">
                  Sigue descubriendo
                </p>
                <h2 className="mt-1 text-2xl font-bold text-slate-950">
                  Eventos relacionados
                </h2>
              </div>
              <Link
                href="/#eventos"
                className="shrink-0 text-sm font-bold text-violet-700"
              >
                Ver todos
              </Link>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {relatedEvents.map((relatedEvent) => (
                <EventCard
                  key={relatedEvent.id}
                  event={relatedEvent}
                  variant="compact"
                />
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </main>
  );
}
