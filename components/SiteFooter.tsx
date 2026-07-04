import Link from "next/link";
import { AtSign } from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";

export function SiteFooter() {
  return (
    <footer
      data-site-footer
      id="acerca"
      className="border-t border-white/10 bg-[#071018] text-[#f6f3ea]"
    >
      <div className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-10 sm:px-6 md:grid-cols-2 lg:grid-cols-[1.4fr_0.7fr_0.8fr_0.9fr] lg:px-8">
        <div className="max-w-sm">
          <BrandLogo compact />
          <p className="mt-4 text-sm leading-6 text-slate-400">
            Tu agenda de conciertos y eventos musicales en Guadalajara y su
            zona metropolitana.
          </p>
        </div>

        <div>
          <h2 className="text-sm font-bold text-[#f6f3ea]">Navegacion</h2>
          <div className="mt-4 grid gap-3 text-sm text-slate-400">
            <Link className="hover:text-[#00c2d1]" href="/#eventos">
              Eventos
            </Link>
            <Link className="hover:text-[#00c2d1]" href="/artistas">
              Artistas
            </Link>
            <Link className="hover:text-[#00c2d1]" href="/acerca-de">
              Acerca de
            </Link>
            <Link className="hover:text-[#00c2d1]" href="/contacto">
              Contacto
            </Link>
          </div>
        </div>

        <div>
          <h2 className="text-sm font-bold text-[#f6f3ea]">Redes sociales</h2>
          <a
            href="https://www.instagram.com/conciertos.gdl/"
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-slate-400 transition hover:text-[#00c2d1]"
          >
            <AtSign className="h-5 w-5" aria-hidden="true" />
            @conciertos.gdl
          </a>
        </div>

        <div>
          <h2 className="text-sm font-bold text-[#f6f3ea]">Legal</h2>
          <div className="mt-4 grid gap-3 text-sm text-slate-400">
            <Link className="hover:text-[#00c2d1]" href="/privacidad">
              Privacidad
            </Link>
            <Link className="hover:text-[#00c2d1]" href="/terminos">
              Terminos de uso
            </Link>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-2 px-4 py-5 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p>{"\u00a9"} 2026 Donde Toca.</p>
          <p>No vendemos boletos. Solo informacion.</p>
        </div>
      </div>
    </footer>
  );
}
