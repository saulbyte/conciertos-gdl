"use client";

import Link from "next/link";
import {
  AtSign,
  Download,
  Info,
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
  { href: "/acerca-de", label: "Acerca de", icon: Info },
  { href: "/contacto", label: "Contacto", icon: AtSign },
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
        className="flex h-10 w-10 items-center justify-center rounded-md border border-white/12 bg-white/5 text-[#f6f3ea] transition hover:border-[#00c2d1]/60 hover:text-[#00c2d1] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00c2d1]"
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
          className="fixed inset-x-0 top-[calc(4.25rem+env(safe-area-inset-top))] z-[90] border-y border-white/10 bg-[#071018]/98 shadow-2xl shadow-black/40 backdrop-blur"
        >
          <nav
            aria-label="Navegacion movil"
            className="mx-auto grid w-full max-w-7xl gap-1 px-4 py-3"
          >
            {navigation.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="flex min-h-11 items-center gap-3 rounded-md px-3 text-sm font-semibold text-slate-300 transition hover:bg-white/6 hover:text-[#00c2d1]"
                onClick={() => setIsOpen(false)}
              >
                <Icon className="h-5 w-5 text-[#00c2d1]" aria-hidden="true" />
                {label}
              </Link>
            ))}

            <a
              href="https://www.instagram.com/conciertos.gdl/"
              target="_blank"
              rel="noreferrer"
              className="flex min-h-11 items-center gap-3 rounded-md px-3 text-sm font-semibold text-slate-300 transition hover:bg-white/6 hover:text-[#00c2d1]"
              onClick={() => setIsOpen(false)}
            >
              <AtSign className="h-5 w-5 text-[#00c2d1]" aria-hidden="true" />
              Instagram
            </a>

            <div className="my-1 border-t border-white/10" />

            <button
              type="button"
              disabled={isInstalled}
              className="flex min-h-11 items-center gap-3 rounded-md px-3 text-left text-sm font-semibold text-slate-300 transition hover:bg-white/6 hover:text-[#00c2d1] disabled:cursor-default disabled:text-[#00c2d1] disabled:hover:bg-white/6"
              onClick={handleInstall}
            >
              <Download className="h-5 w-5 text-[#00c2d1]" aria-hidden="true" />
              {isInstalled ? "App instalada" : "Instalar app"}
            </button>

            {installHelp ? (
              <div className="mx-3 mb-2 flex gap-3 rounded-md border border-[#00c2d1]/25 bg-[#00c2d1]/10 p-3 text-sm leading-5 text-slate-200">
                <Share
                  className="mt-0.5 h-5 w-5 shrink-0 text-[#00c2d1]"
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
