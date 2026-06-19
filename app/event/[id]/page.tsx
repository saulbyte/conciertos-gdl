import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  ExternalLink,
  MapPin,
  Music2,
} from "lucide-react";
import { EventArtwork } from "@/components/EventArtwork";
import { getEventById } from "@/lib/events";
import { formatEventDate, formatSourceName } from "@/lib/format";

type EventPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EventPage({ params }: EventPageProps) {
  const { id } = await params;
  const event = await getEventById(id);

  if (!event) {
    notFound();
  }

  const artists = event.artists.map(({ artist }) => artist.name);

  return (
    <main className="bg-slate-50">
      <section className="mx-auto w-full max-w-7xl px-4 py-7 sm:px-6 sm:py-10 lg:px-8">
        <Link
          href="/#eventos"
          className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 transition hover:text-violet-700"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Volver a eventos
        </Link>

        <div className="mt-6 grid items-start gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:gap-12">
          <div className="relative aspect-[16/10] overflow-hidden rounded-lg bg-slate-900 shadow-xl shadow-slate-300/50">
            <EventArtwork
              src={event.imageUrl}
              className="h-full w-full object-cover"
              iconClassName="h-20 w-20"
            />
          </div>

          <div className="py-1">
            <p className="inline-flex rounded-md bg-violet-100 px-3 py-1.5 text-xs font-bold text-violet-800">
              {formatSourceName(event.source)}
            </p>
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
                <p className="flex items-start gap-3">
                  <Music2
                    className="mt-0.5 h-5 w-5 shrink-0 text-violet-600"
                    aria-hidden="true"
                  />
                  <span>{artists.join(", ")}</span>
                </p>
              ) : null}
            </div>

            {event.sourceUrl ? (
              <a
                href={event.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-7 inline-flex h-12 w-full items-center justify-center gap-2 rounded-md bg-violet-600 px-5 text-sm font-bold text-white shadow-lg shadow-violet-200 transition hover:bg-violet-700 sm:w-auto"
              >
                Ir al sitio oficial
                <ExternalLink className="h-4 w-4" aria-hidden="true" />
              </a>
            ) : null}
            <p className="mt-3 text-xs text-slate-500">
              La disponibilidad y venta dependen del sitio de origen.
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
    </main>
  );
}
