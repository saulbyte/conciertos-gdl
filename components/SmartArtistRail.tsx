"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { HorizontalScroller } from "@/components/HorizontalScroller";
import { EventArtwork } from "@/components/EventArtwork";
import {
  getPersonalizedArtistRail,
  type PersonalizationRailArtist,
} from "@/lib/personalization-client";

type SmartArtistRailProps = {
  artists: PersonalizationRailArtist[];
};

export function SmartArtistRail({ artists }: SmartArtistRailProps) {
  const [, setVersion] = useState(0);
  const { title, artists: visibleArtists } = getPersonalizedArtistRail(artists);

  useEffect(() => {
    function refresh() {
      setVersion((current) => current + 1);
    }

    window.addEventListener("revera:profile-updated", refresh);
    window.addEventListener("storage", refresh);

    return () => {
      window.removeEventListener("revera:profile-updated", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  if (visibleArtists.length === 0) {
    return null;
  }

  return (
    <section>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-black text-[#f6f3ea]">{title}</h2>
        <Link
          href="/artistas"
          className="text-xs font-bold text-[#00c2d1] transition hover:text-white"
        >
          Ver todos
        </Link>
      </div>
      <HorizontalScroller
        label="artistas"
        className="-mx-4 mt-3 sm:-mx-6 lg:mx-0"
        contentClassName="flex gap-4 px-4 pb-2 sm:px-6 lg:px-10"
      >
        {visibleArtists.map((artist) => {
          const highlighted = Boolean(artist.nextEvent);

          return (
          <Link
            key={artist.id}
            href={`/artistas/${artist.id}`}
            className="group grid w-20 shrink-0 justify-items-center gap-2 text-center"
          >
            <span
              className={[
                "relative grid h-[70px] w-[70px] place-items-center rounded-full transition group-hover:scale-[1.03]",
                highlighted
                  ? "bg-[conic-gradient(from_210deg,#38ef7d,#b8ff3d,#00e5ff,#38ef7d)] p-[3px] shadow-[0_0_18px_rgba(56,239,125,0.26)]"
                  : "p-[2px]",
              ].join(" ")}
              title={highlighted ? "Destacado para descubrir" : "Artista recomendado"}
            >
              <span className="relative h-16 w-16 overflow-hidden rounded-full bg-[#0b1d26]">
                <EventArtwork
                  src={artist.imageUrl ?? artist.fallbackImageUrl}
                  alt=""
                  className="h-full w-full object-cover"
                  iconClassName="h-7 w-7"
                />
              </span>
            </span>
            <span className="line-clamp-1 w-full text-xs font-bold text-slate-300 transition group-hover:text-white">
              {artist.name}
            </span>
          </Link>
          );
        })}
      </HorizontalScroller>
    </section>
  );
}
