import Link from "next/link";
import { ArrowUpRight, Clock3, MapPin, Sparkles, TicketCheck } from "lucide-react";
import { EventArtwork } from "@/components/EventArtwork";
import { EventLikeButton } from "@/components/EventLikeButton";
import { EventShareButton } from "@/components/EventShareButton";
import type { DiscoveryEvent } from "@/lib/events";
import { formatEventTime, formatSourceName } from "@/lib/format";

type DiscoveryEventCardProps = {
  event: DiscoveryEvent;
  position: number;
  total: number;
};

export function DiscoveryEventCard({
  event,
  position,
  total,
}: DiscoveryEventCardProps) {
  const artists = event.artists.map(({ artist }) => artist.name).join(", ");
  const date = new Intl.DateTimeFormat("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "America/Mexico_City",
  }).format(event.eventDate);

  return (
    <article
      data-discovery-card
      className="relative h-full min-h-0 snap-start snap-always overflow-hidden bg-slate-950 text-white"
    >
      <div className="absolute inset-0">
        <EventArtwork
          src={event.imageUrl}
          alt={event.title}
          className="h-full w-full object-cover"
          iconClassName="h-20 w-20"
          loading={position === 1 ? "eager" : "lazy"}
        />
      </div>
      <div className="absolute inset-0 bg-black/15" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(2,6,23,0.62)_0%,rgba(2,6,23,0.04)_32%,rgba(2,6,23,0.22)_55%,rgba(2,6,23,0.96)_100%)]" />

      <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-3 px-4 pt-4">
        <div className="flex min-w-0 flex-wrap gap-2">
          <span className="inline-flex min-h-8 items-center gap-1.5 rounded-md bg-violet-600 px-2.5 py-1 text-xs font-bold shadow-lg shadow-black/20">
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            {event.discoveryLabel}
          </span>
          {event.admissionType === "FREE" ? (
            <span className="inline-flex min-h-8 items-center gap-1.5 rounded-md bg-emerald-500 px-2.5 py-1 text-xs font-bold shadow-lg shadow-black/20">
              <TicketCheck className="h-3.5 w-3.5" aria-hidden="true" />
              Gratis
            </span>
          ) : null}
        </div>
        <span className="shrink-0 rounded-md bg-black/35 px-2.5 py-1.5 text-xs font-semibold backdrop-blur">
          {position} de {total}
        </span>
      </div>

      <div className="absolute right-4 bottom-48 z-10 grid gap-3">
        <EventLikeButton
          eventId={event.id}
          initialCount={event.likeCount}
          variant="discovery"
        />
        <EventShareButton title={event.title} path={`/event/${event.id}`} />
      </div>

      <div className="absolute inset-x-0 bottom-0 px-5 pb-6 pr-20">
        <p className="text-sm font-bold capitalize text-violet-200">{date}</p>
        <h2 className="mt-2 line-clamp-3 text-3xl font-bold leading-tight">
          {event.title}
        </h2>
        {artists ? (
          <p className="mt-2 line-clamp-1 text-sm font-medium text-slate-200">
            {artists}
          </p>
        ) : null}

        <div className="mt-4 grid gap-2 text-sm text-slate-200">
          <p className="flex min-w-0 items-center gap-2">
            <MapPin className="h-4 w-4 shrink-0 text-violet-300" aria-hidden="true" />
            <span className="truncate">{event.venue.name}</span>
          </p>
          <p className="flex items-center gap-2">
            <Clock3 className="h-4 w-4 shrink-0 text-violet-300" aria-hidden="true" />
            {formatEventTime(event.eventDate, event.source)}
            <span aria-hidden="true">·</span>
            <span className="truncate">{formatSourceName(event.source)}</span>
          </p>
        </div>

        <Link
          href={`/event/${event.id}`}
          className="mt-5 inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-white px-5 text-sm font-bold text-slate-950 shadow-xl transition hover:bg-violet-50"
        >
          Ver evento
          <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
}
