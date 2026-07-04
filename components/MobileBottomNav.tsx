"use client";

import Link from "next/link";
import { CalendarDays, Music2, Sparkles } from "lucide-react";
import { usePathname } from "next/navigation";

const items = [
  { href: "/#eventos", label: "Eventos", icon: CalendarDays, path: "/eventos" },
  { href: "/descubrir", label: "Descubrir", icon: Sparkles, path: "/descubrir" },
  { href: "/artistas", label: "Artistas", icon: Music2, path: "/artistas" },
];

export function MobileBottomNav() {
  const pathname = usePathname();
  const isDiscovery = pathname === "/descubrir";

  return (
    <nav
      aria-label="Navegacion principal movil"
      className={`mobile-bottom-nav fixed inset-x-0 bottom-0 z-[60] grid grid-cols-3 border-t px-2 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden ${
        isDiscovery
          ? "border-white/10 bg-[#071018]/96 shadow-[0_-8px_24px_rgba(2,6,23,0.3)]"
          : "border-white/10 bg-[#071018]/96 shadow-[0_-8px_24px_rgba(2,6,23,0.24)]"
      }`}
    >
      {items.map(({ href, label, icon: Icon, path }) => {
        const active = pathname === "/descubrir"
          ? path === "/descubrir"
          : pathname.startsWith("/artistas") && path === "/artistas"
            ? true
            : pathname === "/" && path === "/eventos"
            ? true
            : pathname === "/acerca-de" && path === "/mas"
              ? true
              : false;

        return (
          <Link
            key={label}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`flex min-h-16 flex-col items-center justify-center gap-1 text-[11px] font-bold transition ${
              active
                ? "text-[#ff304f]"
                : isDiscovery
                  ? "text-slate-400 hover:text-white"
                  : "text-slate-400 hover:text-white"
            }`}
          >
            <Icon
              className={`h-5 w-5 ${
                active
                  ? isDiscovery
                    ? "fill-[#ff304f]/20"
                    : "fill-[#ff304f]/15"
                  : ""
              }`}
              aria-hidden="true"
            />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
