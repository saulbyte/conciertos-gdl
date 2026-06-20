"use client";

import Link from "next/link";
import {
  CalendarDays,
  MapPin,
  Search,
  SlidersHorizontal,
  TicketCheck,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";

type VenueOption = {
  id: string;
  name: string;
};

type FilterValues = {
  q?: string;
  venue?: string;
  from?: string;
  to?: string;
  admission?: string;
};

type MobileDiscoveryFiltersProps = {
  venues: VenueOption[];
  values: FilterValues;
  freeEventCount: number;
};

export function MobileDiscoveryFilters({
  venues,
  values,
  freeEventCount,
}: MobileDiscoveryFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);
  const freeActive = values.admission === "free";
  const advancedFilterCount = [values.venue, values.from, values.to].filter(
    Boolean,
  ).length;

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div className="md:hidden">
      <form
        action="/#eventos"
        className="overflow-hidden rounded-lg border border-white/20 bg-white shadow-2xl shadow-black/25"
      >
        {values.venue ? (
          <input type="hidden" name="venue" value={values.venue} />
        ) : null}
        {values.from ? (
          <input type="hidden" name="from" value={values.from} />
        ) : null}
        {values.to ? <input type="hidden" name="to" value={values.to} /> : null}
        {freeActive ? (
          <input type="hidden" name="admission" value="free" />
        ) : null}

        <div className="flex min-h-14 items-stretch">
          <label className="flex min-w-0 flex-1 items-center gap-3 px-4">
            <Search
              className="h-5 w-5 shrink-0 text-slate-400"
              aria-hidden="true"
            />
            <span className="sr-only">Buscar artista, evento o recinto</span>
            <input
              name="q"
              defaultValue={values.q}
              placeholder="Artista, evento o recinto..."
              className="h-14 min-w-0 flex-1 border-0 bg-transparent text-base text-slate-950 placeholder:text-slate-400 focus:outline-none"
            />
          </label>
          <button
            type="submit"
            aria-label="Buscar"
            title="Buscar"
            className="m-1.5 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-violet-600 text-white transition hover:bg-violet-700"
          >
            <Search className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      </form>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <Link
          href={buildAdmissionHref(values, freeActive ? undefined : "free")}
          aria-current={freeActive ? "page" : undefined}
          className={`flex min-h-11 items-center justify-center gap-2 rounded-md border px-3 text-sm font-bold transition ${
            freeActive
              ? "border-emerald-400 bg-emerald-500 text-white shadow-lg shadow-emerald-950/20"
              : "border-white/25 bg-white/10 text-white backdrop-blur hover:bg-white/20"
          }`}
        >
          <TicketCheck className="h-4 w-4" aria-hidden="true" />
          Gratis
          <span
            className={`rounded px-1.5 py-0.5 text-[11px] ${
              freeActive ? "bg-white/20" : "bg-white/15"
            }`}
          >
            {freeEventCount}
          </span>
        </Link>

        <button
          type="button"
          className="flex min-h-11 items-center justify-center gap-2 rounded-md border border-white/25 bg-white/10 px-3 text-sm font-bold text-white backdrop-blur transition hover:bg-white/20"
          aria-haspopup="dialog"
          onClick={() => setIsOpen(true)}
        >
          <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
          Mas filtros
          {advancedFilterCount > 0 ? (
            <span className="flex h-5 min-w-5 items-center justify-center rounded bg-violet-500 px-1 text-[11px]">
              {advancedFilterCount}
            </span>
          ) : null}
        </button>
      </div>

      {isOpen ? (
        <div className="fixed inset-0 z-[70] md:hidden">
          <button
            type="button"
            className="absolute inset-0 h-full w-full bg-slate-950/65 backdrop-blur-sm"
            aria-label="Cerrar filtros"
            onClick={() => setIsOpen(false)}
          />

          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="mobile-filters-title"
            className="absolute inset-x-0 bottom-0 max-h-[85dvh] overflow-y-auto rounded-t-lg bg-white shadow-2xl"
          >
            <div className="sticky top-0 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-4">
              <div>
                <p className="text-xs font-bold uppercase text-violet-700">
                  Descubrir
                </p>
                <h2
                  id="mobile-filters-title"
                  className="text-xl font-bold text-slate-950"
                >
                  Filtrar conciertos
                </h2>
              </div>
              <button
                type="button"
                className="flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 text-slate-600"
                aria-label="Cerrar filtros"
                title="Cerrar filtros"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            <form
              action="/#eventos"
              className="grid gap-5 px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-5"
            >
              {values.q ? <input type="hidden" name="q" value={values.q} /> : null}
              {freeActive ? (
                <input type="hidden" name="admission" value="free" />
              ) : null}

              <label className="grid gap-2">
                <span className="flex items-center gap-2 text-sm font-bold text-slate-800">
                  <MapPin className="h-4 w-4 text-violet-600" aria-hidden="true" />
                  Recinto
                </span>
                <select
                  name="venue"
                  defaultValue={values.venue}
                  className="h-12 w-full rounded-md border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 focus:border-violet-500 focus:outline-none"
                >
                  <option value="">Todos los recintos</option>
                  {venues.map((venue) => (
                    <option key={venue.id} value={venue.id}>
                      {venue.name}
                    </option>
                  ))}
                </select>
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="grid min-w-0 gap-2">
                  <span className="flex items-center gap-2 text-sm font-bold text-slate-800">
                    <CalendarDays
                      className="h-4 w-4 text-violet-600"
                      aria-hidden="true"
                    />
                    Desde
                  </span>
                  <input
                    name="from"
                    type="date"
                    defaultValue={values.from}
                    className="h-12 min-w-0 rounded-md border border-slate-300 bg-white px-2 text-sm text-slate-700 focus:border-violet-500 focus:outline-none"
                  />
                </label>

                <label className="grid min-w-0 gap-2">
                  <span className="text-sm font-bold text-slate-800">Hasta</span>
                  <input
                    name="to"
                    type="date"
                    defaultValue={values.to}
                    className="h-12 min-w-0 rounded-md border border-slate-300 bg-white px-2 text-sm text-slate-700 focus:border-violet-500 focus:outline-none"
                  />
                </label>
              </div>

              <div className="grid grid-cols-[auto_1fr] gap-3 border-t border-slate-200 pt-4">
                <Link
                  href="/#eventos"
                  className="inline-flex h-12 items-center justify-center rounded-md border border-slate-300 px-4 text-sm font-bold text-slate-700"
                  onClick={() => setIsOpen(false)}
                >
                  Limpiar
                </Link>
                <button
                  type="submit"
                  className="h-12 rounded-md bg-violet-600 px-5 text-sm font-bold text-white transition hover:bg-violet-700"
                >
                  Ver resultados
                </button>
              </div>
            </form>
          </section>
        </div>
      ) : null}
    </div>
  );
}

function buildAdmissionHref(values: FilterValues, admission?: "free") {
  const params = new URLSearchParams();

  if (values.q) params.set("q", values.q);
  if (values.venue) params.set("venue", values.venue);
  if (values.from) params.set("from", values.from);
  if (values.to) params.set("to", values.to);
  if (admission) params.set("admission", admission);

  const query = params.toString();
  return `${query ? `/?${query}` : "/"}#eventos`;
}
