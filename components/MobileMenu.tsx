"use client";

import Link from "next/link";
import {
  AtSign,
  CalendarDays,
  Download,
  Info,
  MapPin,
  Menu,
  Share,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const navigation = [
  { href: "/#eventos", label: "Eventos", icon: CalendarDays },
  { href: "/#filtros", label: "Recintos", icon: MapPin },
  { href: "/#acerca", label: "Acerca de", icon: Info },
];

export function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [installPrompt, setInstallPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [installHelp, setInstallHelp] = useState<"ios" | "browser" | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      Boolean((navigator as Navigator & { standalone?: boolean }).standalone);

    const standaloneCheck = window.setTimeout(
      () => setIsInstalled(standalone),
      0,
    );

    const handleInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };

    const handleInstalled = () => {
      setIsInstalled(true);
      setInstallPrompt(null);
      setInstallHelp(null);
    };

    window.addEventListener("beforeinstallprompt", handleInstallPrompt);
    window.addEventListener("appinstalled", handleInstalled);

    return () => {
      window.clearTimeout(standaloneCheck);
      window.removeEventListener("beforeinstallprompt", handleInstallPrompt);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  async function handleInstall() {
    if (installPrompt) {
      await installPrompt.prompt();
      const choice = await installPrompt.userChoice;
      setInstallPrompt(null);

      if (choice.outcome === "accepted") {
        setIsOpen(false);
      }
      return;
    }

    const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setInstallHelp(isIos ? "ios" : "browser");
  }

  return (
    <div className="md:hidden">
      <button
        type="button"
        className="flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 text-slate-700 transition hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600"
        aria-expanded={isOpen}
        aria-controls="mobile-navigation"
        aria-label={isOpen ? "Cerrar menu" : "Abrir menu"}
        title={isOpen ? "Cerrar menu" : "Abrir menu"}
        onClick={() => {
          setIsOpen((current) => !current);
          setInstallHelp(null);
        }}
      >
        {isOpen ? (
          <X className="h-5 w-5" aria-hidden="true" />
        ) : (
          <Menu className="h-5 w-5" aria-hidden="true" />
        )}
      </button>

      {isOpen ? (
        <div
          id="mobile-navigation"
          className="absolute inset-x-0 top-full border-b border-slate-200 bg-white shadow-lg shadow-slate-950/8"
        >
          <nav
            aria-label="Navegacion movil"
            className="mx-auto grid w-full max-w-7xl gap-1 px-4 py-3"
          >
            {navigation.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="flex min-h-11 items-center gap-3 rounded-md px-3 text-sm font-semibold text-slate-700 transition hover:bg-violet-50 hover:text-violet-700"
                onClick={() => setIsOpen(false)}
              >
                <Icon className="h-5 w-5 text-violet-600" aria-hidden="true" />
                {label}
              </Link>
            ))}

            <a
              href="https://www.instagram.com/conciertos.gdl/"
              target="_blank"
              rel="noreferrer"
              className="flex min-h-11 items-center gap-3 rounded-md px-3 text-sm font-semibold text-slate-700 transition hover:bg-violet-50 hover:text-violet-700"
              onClick={() => setIsOpen(false)}
            >
              <AtSign className="h-5 w-5 text-violet-600" aria-hidden="true" />
              Instagram
            </a>

            <div className="my-1 border-t border-slate-100" />

            <button
              type="button"
              disabled={isInstalled}
              className="flex min-h-11 items-center gap-3 rounded-md px-3 text-left text-sm font-semibold text-slate-700 transition hover:bg-violet-50 hover:text-violet-700 disabled:cursor-default disabled:text-emerald-700 disabled:hover:bg-emerald-50"
              onClick={handleInstall}
            >
              <Download className="h-5 w-5 text-violet-600" aria-hidden="true" />
              {isInstalled ? "App instalada" : "Instalar app"}
            </button>

            {installHelp ? (
              <div className="mx-3 mb-2 flex gap-3 rounded-md border border-violet-200 bg-violet-50 p-3 text-sm leading-5 text-slate-700">
                <Share
                  className="mt-0.5 h-5 w-5 shrink-0 text-violet-700"
                  aria-hidden="true"
                />
                <p>
                  {installHelp === "ios"
                    ? "En Safari, toca Compartir y despues Agregar a pantalla de inicio."
                    : "Abre el menu de tu navegador y elige Instalar aplicacion o Agregar a pantalla de inicio."}
                </p>
              </div>
            ) : null}
          </nav>
        </div>
      ) : null}
    </div>
  );
}
