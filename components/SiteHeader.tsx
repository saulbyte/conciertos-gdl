"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { MapPin, Search } from "lucide-react";
import { usePathname } from "next/navigation";
import { BrandLogo } from "@/components/BrandLogo";
import { MobileMenu } from "@/components/MobileMenu";

export function SiteHeader() {
  const pathname = usePathname();
  const immersiveMobilePage =
    pathname === "/descubrir" || pathname.startsWith("/artistas");
  const openHomeSearch = () => {
    const event = new Event("open-home-search");
    window.dispatchEvent(event);
    document.dispatchEvent(new Event("open-home-search"));
  };

  return (
    <header
      data-site-header
      className={`sticky top-0 z-50 bg-[#071018] text-[#f6f3ea] ${
        immersiveMobilePage ? "max-md:hidden" : ""
      }`}
    >
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:h-[72px] sm:px-6 lg:px-8">
        <BrandLogo compact />

        <nav
          aria-label="Navegacion principal"
          className="hidden items-center gap-7 text-sm font-bold text-slate-300 md:flex"
        >
          <NavLink href="/#eventos" active={pathname === "/"}>
            Eventos
          </NavLink>
          <NavLink href="/artistas" active={pathname.startsWith("/artistas")}>
            Artistas
          </NavLink>
          <NavLink href="/acerca-de" active={pathname === "/acerca-de"}>
            Acerca de
          </NavLink>
          <NavLink href="/contacto" active={pathname === "/contacto"}>
            Contacto
          </NavLink>
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {pathname === "/" ? (
            <button
              type="button"
              className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-[#ff304f] text-white shadow-[0_0_18px_rgba(255,48,79,0.18)] transition hover:bg-[#ff5d74]"
              aria-label="Buscar"
              title="Buscar"
              onClick={openHomeSearch}
            >
              <Search className="h-5 w-5" aria-hidden="true" />
            </button>
          ) : (
            <Link
              href="/?search=open"
              className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-[#ff304f] text-white shadow-[0_0_18px_rgba(255,48,79,0.18)] transition hover:bg-[#ff5d74]"
              aria-label="Buscar"
              title="Buscar"
            >
              <Search className="h-5 w-5" aria-hidden="true" />
            </Link>
          )}
          <span className="inline-flex h-10 items-center gap-2 rounded-full border border-white/12 bg-white/5 px-3 text-sm font-bold text-slate-200">
            <MapPin className="h-4 w-4 text-[#00c2d1]" aria-hidden="true" />
            Guadalajara
          </span>
        </div>

        <div className="flex items-center gap-2 md:hidden">
          {pathname === "/" ? (
            <button
              type="button"
              className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-[#ff304f] text-white shadow-[0_0_18px_rgba(255,48,79,0.18)] transition hover:bg-[#ff5d74]"
              aria-label="Buscar"
              title="Buscar"
              onClick={openHomeSearch}
            >
              <Search className="h-5 w-5" aria-hidden="true" />
            </button>
          ) : (
            <Link
              href="/?search=open"
              className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-[#ff304f] text-white shadow-[0_0_18px_rgba(255,48,79,0.18)] transition hover:bg-[#ff5d74]"
              aria-label="Buscar"
              title="Buscar"
            >
              <Search className="h-5 w-5" aria-hidden="true" />
            </Link>
          )}
          <MobileMenu />
        </div>
      </div>
    </header>
  );
}

function NavLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`relative py-2 transition hover:text-[#ff304f] ${
        active ? "text-[#f6f3ea]" : ""
      }`}
    >
      {children}
      {active ? (
        <span className="absolute inset-x-0 -bottom-1 h-0.5 rounded-full bg-[#ff304f]" />
      ) : null}
    </Link>
  );
}
