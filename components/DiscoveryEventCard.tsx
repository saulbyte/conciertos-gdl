import Link from "next/link";
import { ArrowUpRight, Clock3, MapPin, Sparkles, TicketCheck } from "lucide-react";
import { EventArtwork } from "@/components/EventArtwork";
import { EventLikeButton } from "@/components/EventLikeButton";
import { EventShareButton } from "@/components/EventShareButton";
import type { DiscoveryEvent } from "@/lib/events";
import { formatEventSourceName, formatEventTime } from "@/lib/format";

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
  const recentlyAdded = isRecentlyAdded(event.createdAt);
  const sourceName = formatEventSourceName(event);

  return (
    <article
      data-discovery-card
      className="relative h-full min-h-0 snap-start snap-always overflow-hidden bg-[#071018] text-[#f6f3ea]"
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
      <div className="absolute inset-0 bg-black/10" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,16,24,0.72)_0%,rgba(7,16,24,0.03)_30%,rgba(7,16,24,0.24)_56%,rgba(7,16,24,0.98)_100%)]" />

      <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-3 px-4 pt-4">
        <div className="flex min-w-0 flex-wrap gap-2">
          <span
            className={`inline-flex min-h-8 items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-black shadow-lg shadow-black/20 backdrop-blur ${
              event.discoveryLabel === "Popular"
                ? "border-[#ff304f]/50 bg-[#ff304f]/16 text-[#ffb0bc]"
                : "border-[#00c2d1]/45 bg-[#00c2d1]/14 text-[#9ff6ff]"
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            {event.discoveryLabel}
          </span>
          {recentlyAdded ? (
            <span className="inline-flex min-h-8 items-center gap-1.5 rounded-full bg-[#ff304f] px-3 py-1 text-xs font-black uppercase tracking-[0.02em] text-white shadow-[0_0_20px_rgba(255,48,79,0.3)]">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              Nuevo
            </span>
          ) : null}
          {event.admissionType === "FREE" ? (
            <span className="inline-flex min-h-8 items-center gap-1.5 rounded-full bg-[#00c2d1] px-3 py-1 text-xs font-black uppercase tracking-[0.02em] text-[#071018] shadow-[0_0_20px_rgba(0,194,209,0.3)]">
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
        <p className="text-sm font-black capitalize text-[#9ff6ff]">{date}</p>
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
            <MapPin className="h-4 w-4 shrink-0 text-[#00c2d1]" aria-hidden="true" />
            <span className="truncate">{event.venue.name}</span>
          </p>
          <p className="flex items-center gap-2">
            <Clock3 className="h-4 w-4 shrink-0 text-[#00c2d1]" aria-hidden="true" />
            {formatEventTime(event.eventDate, event.source)}
            <span aria-hidden="true">·</span>
            <span className="truncate">{sourceName}</span>
          </p>
        </div>

        <Link
          href={`/event/${event.id}`}
          className="mt-5 inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-[#ff304f] px-5 text-sm font-black text-white shadow-xl shadow-black/30 transition hover:bg-[#ff5d74]"
        >
          Ver fuente
          <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
}

function isRecentlyAdded(createdAt: Date) {
  const threshold = new Date();
  threshold.setDate(threshold.getDate() - 14);

  return createdAt >= threshold;
}
