import Link from "next/link";
import { AtSign, Music2 } from "lucide-react";

export function SiteFooter() {
  return (
    <footer data-site-footer id="acerca" className="border-t border-slate-200 bg-white">
      <div className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-10 sm:px-6 md:grid-cols-2 lg:grid-cols-[1.4fr_0.7fr_0.8fr_0.9fr] lg:px-8">
        <div className="max-w-sm">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-violet-600 text-white">
              <Music2 className="h-4 w-4" aria-hidden="true" />
            </span>
            <span className="text-lg font-bold text-slate-950">
              Conciertos GDL
            </span>
          </Link>
          <p className="mt-4 text-sm leading-6 text-slate-600">
            Tu agenda de conciertos y eventos musicales en Guadalajara y su
            zona metropolitana.
          </p>
        </div>

        <div>
          <h2 className="text-sm font-bold text-slate-950">Navegacion</h2>
          <div className="mt-4 grid gap-3 text-sm text-slate-600">
            <Link className="hover:text-violet-700" href="/#eventos">
              Eventos
            </Link>
            <Link className="hover:text-violet-700" href="/artistas">
              Artistas
            </Link>
            <Link className="hover:text-violet-700" href="/#filtros">
              Recintos y fechas
            </Link>
          </div>
        </div>

        <div>
          <h2 className="text-sm font-bold text-slate-950">Redes sociales</h2>
          <a
            href="https://www.instagram.com/conciertos.gdl/"
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-violet-700"
          >
            <AtSign className="h-5 w-5" aria-hidden="true" />
            @conciertos.gdl
          </a>
        </div>

        <div>
          <h2 className="text-sm font-bold text-slate-950">
            Sobre Conciertos GDL
          </h2>
          <p className="mt-4 text-sm leading-6 text-slate-600">
            Agregamos informacion de fuentes publicas y te dirigimos siempre
            al enlace oficial. No vendemos boletos.
          </p>
        </div>
      </div>

      <div className="border-t border-slate-200">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-2 px-4 py-5 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p>{"\u00a9"} 2026 Conciertos GDL.</p>
          <p>Informacion para descubrir musica en vivo.</p>
        </div>
      </div>
    </footer>
  );
}
