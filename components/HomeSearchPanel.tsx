"use client";

import Link from "next/link";
import {
  ArrowLeft,
  ChevronRight,
  MapPin,
  Search,
  X,
} from "lucide-react";
import { useState } from "react";
import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

type SearchArtist = {
  id: string;
  name: string;
  imageUrl: string | null;
  subscriberCount: number;
};

type SearchEvent = {
  id: string;
  title: string;
  imageUrl: string | null;
  dateLabel: string;
  venueName: string;
  timeLabel: string;
  admissionType: string;
};

type SearchVenue = {
  id: string;
  name: string;
  city: string;
};

type HomeSearchPanelProps = {
  artists: SearchArtist[];
  events: SearchEvent[];
  venues: SearchVenue[];
  hideTrigger?: boolean;
};

export function HomeSearchPanel({
  artists,
  events,
  venues,
  hideTrigger = false,
}: HomeSearchPanelProps) {
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = useState(
    () => searchParams.get("search") === "open",
  );

  useEffect(() => {
    const openSearch = () => setIsOpen(true);

    window.addEventListener("open-home-search", openSearch);
    document.addEventListener("open-home-search", openSearch);
    return () => {
      window.removeEventListener("open-home-search", openSearch);
      document.removeEventListener("open-home-search", openSearch);
    };
  }, []);

  return (
    <>
      {hideTrigger ? null : (
        <button
          type="button"
          className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-white/12 bg-white/5 text-[#f6f3ea] transition hover:border-[#00c2d1]/60 hover:text-[#00c2d1]"
          aria-label="Abrir busqueda"
          title="Buscar"
          onClick={() => setIsOpen(true)}
        >
          <Search className="h-5 w-5" aria-hidden="true" />
        </button>
      )}

      {isOpen ? (
        <div className="fixed inset-0 z-[80] bg-[#071018]/75 p-3 backdrop-blur-sm md:p-6">
          <div className="mx-auto max-h-[calc(100vh-1.5rem)] w-full max-w-3xl overflow-y-auto rounded-xl border border-white/10 bg-[#09131b] shadow-2xl shadow-black/50 md:max-h-[calc(100vh-3rem)]">
            <div className="sticky top-0 z-10 border-b border-white/10 bg-[#09131b]/96 p-3 backdrop-blur md:p-4">
              <form action="/" className="flex items-center gap-3">
                <button
                  type="button"
                  className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-slate-300 transition hover:bg-white/[0.08] hover:text-white"
                  aria-label="Cerrar busqueda"
                  title="Cerrar"
                  onClick={() => setIsOpen(false)}
                >
                  <ArrowLeft className="h-5 w-5" aria-hidden="true" />
                </button>
                <label className="flex min-w-0 flex-1 items-center gap-3 rounded-lg border border-white/10 bg-white/5 px-3">
                  <Search
                    className="h-4 w-4 shrink-0 text-[#00c2d1]"
                    aria-hidden="true"
                  />
                  <span className="sr-only">Buscar artista, evento o recinto</span>
                  <input
                    name="q"
                    autoFocus
                    placeholder="Buscar artista, evento o recinto..."
                    className="h-11 min-w-0 flex-1 bg-transparent text-sm font-semibold text-[#f6f3ea] placeholder:text-slate-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    className="text-slate-500 transition hover:text-white"
                    aria-label="Limpiar"
                    title="Limpiar"
                  >
                    <X className="h-4 w-4" aria-hidden="true" />
                  </button>
                </label>
                <button
                  type="submit"
                  className="hidden h-11 rounded-lg bg-[#ff304f] px-4 text-sm font-black text-white transition hover:bg-[#ff5d74] sm:inline-flex sm:items-center"
                >
                  Buscar
                </button>
              </form>
            </div>

            <div className="space-y-7 p-4 md:p-5">
              <ResultSection title="Artistas" href="/artistas">
                {artists.slice(0, 5).map((artist) => (
                  <ResultRow
                    key={artist.id}
                    href={`/artistas/${artist.id}`}
                    imageUrl={artist.imageUrl}
                    title={artist.name}
                    subtitle={`${artist.subscriberCount} interesados`}
                  />
                ))}
              </ResultSection>

              <ResultSection title="Eventos" href="/#eventos">
                {events.slice(0, 4).map((event) => (
                  <ResultRow
                    key={event.id}
                    href={`/event/${event.id}`}
                    imageUrl={event.imageUrl}
                    title={event.title}
                    subtitle={`${event.venueName} · ${event.timeLabel}`}
                    meta={event.admissionType === "FREE" ? "Gratis" : event.dateLabel}
                  />
                ))}
              </ResultSection>

              <ResultSection title="Recintos" href="/#eventos">
                {venues.slice(0, 4).map((venue) => (
                  <ResultRow
                    key={venue.id}
                    href={`/?venue=${venue.id}#eventos`}
                    title={venue.name}
                    subtitle={venue.city}
                    venue
                  />
                ))}
              </ResultSection>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function ResultSection({
  title,
  href,
  children,
}: {
  title: string;
  href: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-sm font-black text-[#f6f3ea]">{title}</h2>
        <Link
          href={href}
          className="text-xs font-bold text-[#00c2d1] transition hover:text-white"
        >
          Ver todos
        </Link>
      </div>
      <div className="overflow-hidden rounded-lg border border-white/10">
        {children}
      </div>
    </section>
  );
}

function ResultRow({
  href,
  imageUrl,
  title,
  subtitle,
  meta,
  venue = false,
}: {
  href: string;
  imageUrl?: string | null;
  title: string;
  subtitle: string;
  meta?: string;
  venue?: boolean;
}) {
  return (
    <Link
      href={href}
      className="grid min-h-16 grid-cols-[44px_minmax(0,1fr)_auto] items-center gap-3 border-b border-white/[0.08] px-3 py-2.5 last:border-b-0 transition hover:bg-white/5"
    >
      {venue ? (
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/6 text-[#00c2d1]">
          <MapPin className="h-5 w-5" aria-hidden="true" />
        </span>
      ) : imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageUrl}
          alt=""
          className="h-11 w-11 rounded-full object-cover"
          loading="lazy"
        />
      ) : (
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/[0.08] text-sm font-black text-[#f6f3ea]">
          {title.slice(0, 1)}
        </span>
      )}
      <div className="min-w-0">
        <p className="truncate text-sm font-black text-[#f6f3ea]">{title}</p>
        <p className="truncate text-xs font-semibold text-slate-400">
          {subtitle}
        </p>
      </div>
      <span className="flex items-center gap-2 text-xs font-bold text-slate-400">
        {meta ? (
          <span
            className={`rounded-md border px-2 py-1 ${
              meta === "Gratis"
                ? "border-[#00c2d1]/50 text-[#00c2d1]"
                : "border-white/10 text-slate-300"
            }`}
          >
            {meta}
          </span>
        ) : null}
        <ChevronRight className="h-4 w-4" aria-hidden="true" />
      </span>
    </Link>
  );
}
