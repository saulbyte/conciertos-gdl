"use client";

import Link from "next/link";
import { CalendarDays, House, Music2, Sparkles } from "lucide-react";
import { usePathname } from "next/navigation";
import { useSyncExternalStore } from "react";

const items = [
  { href: "/#inicio", label: "Inicio", icon: House, path: "/" },
  { href: "/descubrir", label: "Descubrir", icon: Sparkles, path: "/descubrir" },
  { href: "/artistas", label: "Artistas", icon: Music2, path: "/artistas" },
  { href: "/#eventos", label: "Eventos", icon: CalendarDays, path: "/eventos" },
];

function subscribeToHash(callback: () => void) {
  const notifyAfterNavigation = () => window.setTimeout(callback, 0);

  window.addEventListener("hashchange", callback);
  window.addEventListener("popstate", callback);
  document.addEventListener("click", notifyAfterNavigation);

  return () => {
    window.removeEventListener("hashchange", callback);
    window.removeEventListener("popstate", callback);
    document.removeEventListener("click", notifyAfterNavigation);
  };
}

function getHashSnapshot() {
  return window.location.hash;
}

function getServerHashSnapshot() {
  return "";
}

export function MobileBottomNav() {
  const pathname = usePathname();
  const isDiscovery = pathname === "/descubrir";
  const hash = useSyncExternalStore(
    subscribeToHash,
    getHashSnapshot,
    getServerHashSnapshot,
  );

  return (
    <nav
      aria-label="Navegacion principal movil"
      className={`mobile-bottom-nav fixed inset-x-0 bottom-0 z-[60] grid grid-cols-4 border-t px-2 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden ${
        isDiscovery
          ? "border-white/10 bg-slate-950/96 shadow-[0_-8px_24px_rgba(2,6,23,0.3)]"
          : "border-slate-200 bg-white/96 shadow-[0_-8px_24px_rgba(15,23,42,0.08)]"
      }`}
    >
      {items.map(({ href, label, icon: Icon, path }) => {
        const active = pathname === "/descubrir"
          ? path === "/descubrir"
          : pathname.startsWith("/artistas") && path === "/artistas"
            ? true
            : pathname === "/" && path === "/eventos"
            ? hash === "#eventos"
            : pathname === "/" && path === "/"
              ? hash !== "#eventos"
              : false;

        return (
          <Link
            key={label}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`flex min-h-16 flex-col items-center justify-center gap-1 text-[11px] font-bold transition ${
              active
                ? isDiscovery
                  ? "text-violet-300"
                  : "text-violet-700"
                : isDiscovery
                  ? "text-slate-400 hover:text-white"
                  : "text-slate-500 hover:text-violet-700"
            }`}
          >
            <Icon
              className={`h-5 w-5 ${
                active
                  ? isDiscovery
                    ? "fill-violet-400/20"
                    : "fill-violet-100"
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
