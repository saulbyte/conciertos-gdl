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
      <div className="mx-auto grid w-full max-w-7xl grid-cols-2 gap-x-6 gap-y-8 px-4 py-8 sm:px-6 md:grid-cols-2 md:gap-10 md:py-10 lg:grid-cols-[1.4fr_0.7fr_0.8fr_0.9fr] lg:px-8">
        <div className="col-span-2 max-w-sm lg:col-span-1">
          <BrandLogo compact />
          <p className="mt-4 text-sm leading-6 text-slate-400">
            Descubre lo proximo que vale la pena vivir en Guadalajara y su
            zona metropolitana.
          </p>
        </div>

        <div>
          <h2 className="text-sm font-bold text-[#f6f3ea]">Navegacion</h2>
          <div className="mt-3 grid gap-2.5 text-sm text-slate-400 md:mt-4 md:gap-3">
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
            className="mt-3 inline-flex min-w-0 items-center gap-2 text-sm font-medium text-slate-400 transition hover:text-[#00c2d1] md:mt-4"
          >
            <AtSign className="h-5 w-5" aria-hidden="true" />
            <span className="truncate">@conciertos.gdl</span>
          </a>
        </div>

        <div>
          <h2 className="text-sm font-bold text-[#f6f3ea]">Legal</h2>
          <div className="mt-3 grid gap-2.5 text-sm text-slate-400 md:mt-4 md:gap-3">
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
          <p>{"\u00a9"} 2026 REVERA.</p>
          <p>REVERA v1.1.0 · Experiencias reunidas desde fuentes de origen.</p>
        </div>
      </div>
    </footer>
  );
}
