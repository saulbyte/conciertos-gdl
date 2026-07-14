"use client";

import Link from "next/link";
import { Clock3, MapPin, Sparkles, TicketCheck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { EventArtwork } from "@/components/EventArtwork";
import { EventLikeButton } from "@/components/EventLikeButton";
import { HorizontalScroller } from "@/components/HorizontalScroller";
import {
  getPersonalizedRailSuggestions,
  type PersonalizedRailSuggestion,
  type PersonalizationEvent,
} from "@/lib/personalization-client";

export type PersonalizedRailEvent = PersonalizationEvent & {
  eventDate: string;
  imageUrl: string | null;
  sourceName: string;
  timeLabel: string;
  dateBadge: {
    day: string;
    month: string;
  };
  likeCount: number;
};

type PersonalizedEventRailProps = {
  events: PersonalizedRailEvent[];
};

export function PersonalizedEventRail({ events }: PersonalizedEventRailProps) {
  const [rails, setRails] = useState<PersonalizedRailSuggestion[]>([]);
  const eventsById = useMemo(
    () => new Map(events.map((event) => [event.id, event])),
    [events],
  );

  useEffect(() => {
    function refresh() {
      setRails(getPersonalizedRailSuggestions(events));
    }

    refresh();
    window.addEventListener("revera:profile-updated", refresh);
    window.addEventListener("storage", refresh);

    return () => {
      window.removeEventListener("revera:profile-updated", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, [events]);

  if (rails.length === 0) {
    return null;
  }

  return (
    <>
      {rails.map((rail) => {
        const railEvents = rail.eventIds
          .map((id) => eventsById.get(id))
          .filter((event): event is PersonalizedRailEvent => Boolean(event));

        if (railEvents.length < 3) {
          return null;
        }

        return (
          <PersonalizedRailSection
            key={rail.id}
            rail={rail}
            events={railEvents}
          />
        );
      })}
    </>
  );
}

function PersonalizedRailSection({
  rail,
  events,
}: {
  rail: PersonalizedRailSuggestion;
  events: PersonalizedRailEvent[];
}) {
  return (
    <section className="py-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-lg font-black tracking-tight text-[#f6f3ea]">
            {rail.title}
          </h2>
        </div>
        <Link
          href="/?view=all#eventos"
          className="shrink-0 text-xs font-bold text-[#00c2d1] transition hover:text-white"
        >
          Ver todos
        </Link>
      </div>

      <HorizontalScroller
        label={rail.title}
        className="-mx-4 sm:-mx-6 lg:mx-0"
        contentClassName="flex snap-x snap-mandatory gap-3 px-4 pb-2 sm:px-6 lg:snap-proximity lg:px-10"
      >
        {events.map((event) => (
          <div key={event.id} className="w-64 shrink-0 snap-start snap-always lg:w-72">
            <PersonalizedEventCard event={event} />
          </div>
        ))}
      </HorizontalScroller>
    </section>
  );
}

function PersonalizedEventCard({ event }: { event: PersonalizedRailEvent }) {
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
          <span className="relative z-10 flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-md border border-[#00c2d1]/30 bg-[#071018]/90 text-[#f6f3ea] shadow-lg shadow-black/30">
            <span className="text-xl font-black leading-none">{event.dateBadge.day}</span>
            <span className="mt-0.5 text-[9px] font-black uppercase text-[#00c2d1]">
              {event.dateBadge.month}
            </span>
          </span>
          {event.admissionType === "FREE" ? (
            <span className="inline-flex w-fit items-center gap-1 rounded-full bg-[#00c2d1] px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.02em] text-[#071018] shadow-[0_0_18px_rgba(0,194,209,0.24)]">
              <TicketCheck className="h-3 w-3" aria-hidden="true" />
              Gratis
            </span>
          ) : null}
        </div>
      </Link>
      <div className="absolute right-3 top-3 z-10">
        <EventLikeButton
          eventId={event.id}
          initialCount={event.likeCount}
          variant="darkCard"
          trackingEvent={event}
        />
      </div>

      <div className="flex min-h-40 flex-1 flex-col p-3.5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-md border border-white/10 px-2 py-1 text-[10px] font-black text-slate-300">
            {event.sourceName}
          </span>
          <span className="inline-flex w-fit items-center gap-1 rounded-full bg-[#ff304f] px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.02em] text-white shadow-[0_0_18px_rgba(255,48,79,0.26)]">
            <Sparkles className="h-3 w-3" aria-hidden="true" />
            Para ti
          </span>
        </div>
        <Link href={`/event/${event.id}`} className="mt-2">
          <h3 className="line-clamp-2 text-base font-black leading-5 text-[#f6f3ea] transition group-hover:text-[#00c2d1]">
            {event.title}
          </h3>
        </Link>
        {event.artists.length > 0 ? (
          <p className="mt-1 truncate text-xs font-semibold text-slate-400">
            {event.artists.map((artist) => artist.name).join(", ")}
          </p>
        ) : null}
        <div className="mt-auto grid gap-1.5 pt-3 text-xs font-semibold text-slate-400">
          <p className="flex min-w-0 items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-[#00c2d1]" />
            <span className="truncate">{event.venueName}</span>
          </p>
          <p className="flex items-center gap-1.5">
            <Clock3 className="h-3.5 w-3.5 shrink-0 text-[#00c2d1]" />
            {event.timeLabel}
          </p>
        </div>
      </div>
    </article>
  );
}
