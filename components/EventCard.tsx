import Link from "next/link";
import { ArrowUpRight, Clock3, MapPin, TicketCheck } from "lucide-react";
import { EventArtwork } from "@/components/EventArtwork";
import { EventLikeButton } from "@/components/EventLikeButton";
import type { EventListItem } from "@/lib/events";
import {
  formatDateBadge,
  formatEventTime,
  formatSourceName,
} from "@/lib/format";

type EventCardProps = {
  event: EventListItem;
  variant?: "default" | "compact";
};

export function EventCard({ event, variant = "default" }: EventCardProps) {
  const artists = event.artists.map(({ artist }) => artist.name).join(", ");
  const date = formatDateBadge(event.eventDate);

  if (variant === "compact") {
    return (
      <article className="group min-w-0 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition hover:border-violet-200 hover:shadow-md">
        <Link href={`/event/${event.id}`} className="grid grid-cols-[84px_minmax(0,1fr)]">
          <div className="relative min-h-24 overflow-hidden bg-slate-900">
            <EventArtwork
              src={event.imageUrl}
              className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            />
            <span className="absolute left-2 top-2 flex h-10 w-10 flex-col items-center justify-center rounded-md bg-violet-600 text-white shadow-sm">
              <span className="text-sm font-bold leading-none">{date.day}</span>
              <span className="mt-0.5 text-[8px] font-bold uppercase">
                {date.month}
              </span>
            </span>
          </div>

          <div className="min-w-0 p-3">
            <div className="flex min-w-0 items-center gap-1.5">
              <span className="truncate rounded bg-violet-50 px-2 py-0.5 text-[10px] font-bold text-violet-800">
                {formatSourceName(event.source)}
              </span>
              {event.admissionType === "FREE" ? (
                <span className="inline-flex shrink-0 items-center gap-1 rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700">
                  <TicketCheck className="h-3 w-3" aria-hidden="true" />
                  Gratis
                </span>
              ) : null}
            </div>
            <h2 className="mt-1.5 line-clamp-2 text-sm font-bold leading-5 text-slate-950 transition group-hover:text-violet-700">
              {event.title}
            </h2>
            {artists ? (
              <p className="mt-0.5 truncate text-xs font-semibold text-slate-500">
                {artists}
              </p>
            ) : null}
            <div className="mt-2 grid gap-1 text-xs text-slate-600">
              <p className="flex min-w-0 items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 shrink-0 text-violet-600" aria-hidden="true" />
                <span className="truncate">{event.venue.name}</span>
              </p>
              <p className="flex items-center gap-1.5">
                <Clock3 className="h-3.5 w-3.5 shrink-0 text-violet-600" aria-hidden="true" />
                <span className="truncate">
                  {formatEventTime(event.eventDate, event.source)}
                </span>
              </p>
            </div>
          </div>
        </Link>
      </article>
    );
  }

  return (
    <article
      className="group flex min-w-0 flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition duration-200 hover:-translate-y-1 hover:border-violet-200 hover:shadow-xl hover:shadow-slate-200/70"
    >
      <Link
        href={`/event/${event.id}`}
        className="relative block aspect-[4/3] overflow-hidden bg-slate-900"
      >
        <EventArtwork
          src={event.imageUrl}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />

        <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-3">
          <div className="flex flex-col items-start gap-2">
            <span className="rounded-md bg-white/95 px-2.5 py-1 text-[11px] font-bold text-slate-700 shadow-sm backdrop-blur">
              {formatSourceName(event.source)}
            </span>
            {event.admissionType === "FREE" ? (
              <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-500 px-2.5 py-1 text-[11px] font-bold text-white shadow-sm">
                <TicketCheck className="h-3.5 w-3.5" aria-hidden="true" />
                Entrada gratis
              </span>
            ) : null}
            {event.isPopular ? (
              <span className="rounded-md bg-rose-600 px-2.5 py-1 text-[11px] font-bold text-white shadow-sm">
                Popular
              </span>
            ) : null}
          </div>
          <span className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-md bg-violet-600 text-white shadow-lg shadow-violet-950/25">
            <span className="text-xl font-bold leading-none">{date.day}</span>
            <span className="mt-1 text-[10px] font-bold uppercase">
              {date.month}
            </span>
          </span>
        </div>
      </Link>

      <div className="flex min-h-48 flex-1 flex-col p-4">
        <div className="min-h-16">
          <Link href={`/event/${event.id}`}>
            <h2 className="line-clamp-2 text-lg font-bold leading-6 text-slate-950 transition group-hover:text-violet-700">
              {event.title}
            </h2>
          </Link>
          {artists ? (
            <p className="mt-1 line-clamp-1 text-sm text-slate-500">
              {artists}
            </p>
          ) : null}
        </div>

        <div className="mt-4 grid gap-2 text-sm text-slate-600">
          <p className="flex min-w-0 items-center gap-2">
            <MapPin className="h-4 w-4 shrink-0 text-violet-600" aria-hidden="true" />
            <span className="truncate">{event.venue.name}</span>
          </p>
          <p className="flex items-center gap-2">
            <Clock3 className="h-4 w-4 shrink-0 text-violet-600" aria-hidden="true" />
            {formatEventTime(event.eventDate, event.source)}
          </p>
        </div>

        <div className="mt-auto flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
          <Link
            href={`/event/${event.id}`}
            className="flex items-center gap-1 text-xs font-bold text-violet-700"
          >
            Ver evento
            <ArrowUpRight
              className="h-4 w-4 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </Link>
          <EventLikeButton eventId={event.id} initialCount={event.likeCount} />
        </div>
      </div>
    </article>
  );
}
