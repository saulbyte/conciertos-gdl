import Link from "next/link";
import { CalendarDays, MapPin, RotateCcw, Search } from "lucide-react";

type VenueOption = {
  id: string;
  name: string;
};

type SearchFiltersProps = {
  venues: VenueOption[];
  values: {
    q?: string;
    venue?: string;
    from?: string;
    to?: string;
    admission?: string;
    when?: string;
  };
};

export function SearchFilters({ venues, values }: SearchFiltersProps) {
  const hasFilters = Boolean(
    values.q ||
      values.venue ||
      values.from ||
      values.to ||
      values.admission ||
      values.when,
  );

  return (
    <form
      action="/"
      className="hidden scroll-mt-24 overflow-hidden rounded-lg border border-white/20 bg-white shadow-2xl shadow-black/25 md:block"
    >
      {values.admission === "free" ? (
        <input type="hidden" name="admission" value="free" />
      ) : null}
      <div className="flex min-h-14 items-stretch">
        <label className="flex min-w-0 flex-1 items-center gap-3 px-4 sm:px-5">
          <Search className="h-5 w-5 shrink-0 text-slate-400" aria-hidden="true" />
          <span className="sr-only">Buscar artista, evento o recinto</span>
          <input
            name="q"
            defaultValue={values.q}
            placeholder="Buscar artista, evento o recinto..."
            className="h-14 min-w-0 flex-1 border-0 bg-transparent text-base text-slate-950 placeholder:text-slate-400 focus:outline-none"
          />
        </label>
        <button
          type="submit"
          className="m-1.5 inline-flex min-w-12 items-center justify-center gap-2 rounded-md bg-violet-600 px-4 text-sm font-bold text-white transition hover:bg-violet-700 sm:px-6"
        >
          <Search className="h-4 w-4 sm:hidden" aria-hidden="true" />
          <span className="hidden sm:inline">Buscar</span>
        </button>
      </div>

      <div className="grid border-t border-slate-200 bg-slate-50 md:grid-cols-[1.2fr_1fr_1fr_auto]">
        <label className="flex min-w-0 items-center gap-2 border-b border-slate-200 px-4 md:border-b-0 md:border-r">
          <MapPin className="h-4 w-4 shrink-0 text-violet-600" aria-hidden="true" />
          <span className="sr-only">Recinto</span>
          <select
            name="venue"
            defaultValue={values.venue}
            className="h-12 min-w-0 flex-1 bg-transparent text-sm font-semibold text-slate-700 focus:outline-none"
          >
            <option value="">Todos los recintos</option>
            {venues.map((venue) => (
              <option key={venue.id} value={venue.id}>
                {venue.name}
              </option>
            ))}
          </select>
        </label>

        <label className="flex items-center gap-2 border-b border-slate-200 px-4 md:border-b-0 md:border-r">
          <CalendarDays
            className="h-4 w-4 shrink-0 text-violet-600"
            aria-hidden="true"
          />
          <span className="text-xs font-bold text-slate-500">Desde</span>
          <input
            name="from"
            type="date"
            defaultValue={values.from}
            className="h-12 min-w-0 flex-1 bg-transparent text-sm font-semibold text-slate-700 focus:outline-none"
          />
        </label>

        <label className="flex items-center gap-2 border-b border-slate-200 px-4 md:border-b-0 md:border-r">
          <span className="text-xs font-bold text-slate-500">Hasta</span>
          <input
            name="to"
            type="date"
            defaultValue={values.to}
            className="h-12 min-w-0 flex-1 bg-transparent text-sm font-semibold text-slate-700 focus:outline-none"
          />
        </label>

        <div className="flex items-center justify-end px-3">
          {hasFilters ? (
            <Link
              href="/"
              title="Limpiar filtros"
              className="inline-flex h-9 w-9 items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-200 hover:text-slate-950"
            >
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              <span className="sr-only">Limpiar filtros</span>
            </Link>
          ) : (
            <span className="hidden h-9 w-9 md:block" aria-hidden="true" />
          )}
        </div>
      </div>
    </form>
  );
}
