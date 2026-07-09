import Link from "next/link";
import { CalendarDays, Clock3, MapPin, Sparkles, TicketCheck } from "lucide-react";
import { EventArtwork } from "@/components/EventArtwork";
import { EventLikeButton } from "@/components/EventLikeButton";
import type { EventListItem } from "@/lib/events";
import {
  formatDateBadge,
  formatEventTime,
  formatSourceName,
} from "@/lib/format";

type HomeEventCardProps = {
  event: EventListItem;
  compact?: boolean;
};

export function HomeEventCard({ event, compact = false }: HomeEventCardProps) {
  const date = formatDateBadge(event.eventDate);
  const artists = event.artists.map(({ artist }) => artist.name).join(", ");
  const recentlyAdded = isRecentlyAdded(event.createdAt);

  if (compact) {
    return (
      <article className="group relative overflow-hidden rounded-lg bg-white/[0.035] transition hover:bg-white/[0.055]">
        <Link
          href={`/event/${event.id}`}
          className="grid grid-cols-[96px_minmax(0,1fr)] gap-3 p-2 pr-14"
        >
          <div className="relative h-20 overflow-hidden rounded-md bg-[#0b1d26]">
            <EventArtwork
              src={event.imageUrl}
              className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
              iconClassName="h-7 w-7"
            />
            <div className="absolute left-2 top-2">
              <DateBadge day={date.day} month={date.month} small />
            </div>
          </div>
          <div className="min-w-0 py-1">
            <h3 className="line-clamp-1 text-sm font-black text-[#f6f3ea] transition group-hover:text-[#00c2d1]">
              {event.title}
            </h3>
            {artists ? (
              <p className="mt-0.5 truncate text-xs font-semibold text-slate-400">
                {artists}
              </p>
            ) : null}
            <p className="mt-1.5 flex min-w-0 items-center gap-1.5 text-xs text-slate-400">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-[#00c2d1]" />
              <span className="truncate">{event.venue.name}</span>
            </p>
            <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-400">
              <Clock3 className="h-3.5 w-3.5 shrink-0 text-[#00c2d1]" />
              {formatEventTime(event.eventDate, event.source)}
            </p>
          </div>
        </Link>
        <div className="absolute right-2 top-2 z-10">
          <EventLikeButton
            eventId={event.id}
            initialCount={event.likeCount}
            variant="darkCard"
          />
        </div>
        <div className="absolute bottom-2 right-2 flex max-w-[calc(100%-7rem)] items-center gap-1">
          {recentlyAdded ? <NewPill small /> : null}
          {event.admissionType === "FREE" ? (
            <FreePill />
          ) : (
            <span className="rounded-md border border-white/10 bg-[#071018]/60 px-2 py-1 text-[10px] font-black text-slate-300">
              {formatSourceName(event.source)}
            </span>
          )}
        </div>
      </article>
    );
  }

  return (
    <article className="group relative flex min-w-0 flex-col overflow-hidden rounded-lg bg-[#0b1d26]/70 transition duration-200 hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-[#00c2d1]/10">
      <Link href={`/event/${event.id}`} className="relative block aspect-[4/3] overflow-hidden bg-[#071018]">
        <EventArtwork
          src={event.imageUrl}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          iconClassName="h-10 w-10"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#071018]/80 via-transparent to-[#071018]/20" />
        <div className="absolute left-3 top-3 flex flex-col gap-2">
          <DateBadge day={date.day} month={date.month} />
          {event.admissionType === "FREE" ? <FreePill /> : null}
          {event.isPopular ? <PopularPill /> : null}
        </div>
      </Link>
      <div className="absolute right-3 top-3 z-10">
        <EventLikeButton
          eventId={event.id}
          initialCount={event.likeCount}
          variant="darkCard"
        />
      </div>

      <div className="flex min-h-40 flex-1 flex-col p-3.5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-md border border-white/10 px-2 py-1 text-[10px] font-black text-slate-300">
            {formatSourceName(event.source)}
          </span>
          {recentlyAdded ? <NewPill /> : null}
        </div>
        <Link href={`/event/${event.id}`} className="mt-2">
          <h3 className="line-clamp-2 text-base font-black leading-5 text-[#f6f3ea] transition group-hover:text-[#00c2d1]">
            {event.title}
          </h3>
        </Link>
        {artists ? (
          <p className="mt-1 truncate text-xs font-semibold text-slate-400">
            {artists}
          </p>
        ) : null}
        <div className="mt-auto grid gap-1.5 pt-3 text-xs font-semibold text-slate-400">
          <p className="flex min-w-0 items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-[#00c2d1]" />
            <span className="truncate">{event.venue.name}</span>
          </p>
          <p className="flex items-center gap-1.5">
            <Clock3 className="h-3.5 w-3.5 shrink-0 text-[#00c2d1]" />
            {formatEventTime(event.eventDate, event.source)}
          </p>
        </div>
      </div>
    </article>
  );
}

function DateBadge({
  day,
  month,
  small = false,
}: {
  day: string;
  month: string;
  small?: boolean;
}) {
  return (
    <span
      className={`relative z-10 flex shrink-0 flex-col items-center justify-center rounded-md border border-[#00c2d1]/30 bg-[#071018]/90 text-[#f6f3ea] shadow-lg shadow-black/30 ${
        small ? "h-10 w-10" : "h-14 w-14"
      }`}
    >
      <span className={small ? "text-sm font-black leading-none" : "text-xl font-black leading-none"}>
        {day}
      </span>
      <span className="mt-0.5 text-[9px] font-black uppercase text-[#00c2d1]">
        {month}
      </span>
    </span>
  );
}

function FreePill() {
  return (
    <span className="inline-flex w-fit items-center gap-1 rounded-full bg-[#00c2d1] px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.02em] text-[#071018] shadow-[0_0_18px_rgba(0,194,209,0.24)]">
      <TicketCheck className="h-3 w-3" aria-hidden="true" />
      Gratis
    </span>
  );
}

function PopularPill() {
  return (
    <span className="inline-flex w-fit items-center gap-1 rounded-full bg-[#ff304f] px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.02em] text-white shadow-[0_0_18px_rgba(255,48,79,0.24)]">
      <CalendarDays className="h-3 w-3" aria-hidden="true" />
      Popular
    </span>
  );
}

function NewPill({ small = false }: { small?: boolean }) {
  return (
    <span
      className={`inline-flex w-fit items-center gap-1 rounded-full bg-[#ff304f] font-black uppercase tracking-[0.02em] text-white shadow-[0_0_18px_rgba(255,48,79,0.26)] ${
        small ? "px-2 py-0.5 text-[9px]" : "px-2.5 py-1 text-[10px]"
      }`}
    >
      <Sparkles
        className={small ? "h-2.5 w-2.5" : "h-3 w-3"}
        aria-hidden="true"
      />
      Nuevo
    </span>
  );
}

function isRecentlyAdded(createdAt: Date) {
  const threshold = new Date();
  threshold.setDate(threshold.getDate() - 14);

  return createdAt >= threshold;
}
