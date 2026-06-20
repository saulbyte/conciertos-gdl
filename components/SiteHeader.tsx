import Link from "next/link";
import { Music2 } from "lucide-react";
import { MobileMenu } from "@/components/MobileMenu";

export function SiteHeader() {
  return (
    <header data-site-header className="sticky top-0 z-50 border-b border-black/8 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:h-[72px] sm:px-6 lg:px-8">
        <Link href="/" className="flex min-w-0 items-center gap-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-violet-600 text-white shadow-sm shadow-violet-200">
            <Music2 className="h-5 w-5" aria-hidden="true" />
          </span>
          <span className="truncate text-lg font-bold text-slate-950 sm:text-xl">
            Conciertos GDL
          </span>
        </Link>

        <nav
          aria-label="Navegacion principal"
          className="hidden items-center gap-7 text-sm font-semibold text-slate-600 md:flex"
        >
          <Link className="transition hover:text-violet-700" href="/#eventos">
            Eventos
          </Link>
          <Link className="transition hover:text-violet-700" href="/#filtros">
            Recintos
          </Link>
          <Link className="transition hover:text-violet-700" href="/#acerca">
            Acerca de
          </Link>
        </nav>

        <MobileMenu />
      </div>
    </header>
  );
}
