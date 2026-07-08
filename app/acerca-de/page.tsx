import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  CalendarSearch,
  ExternalLink,
  MapPin,
  ShieldCheck,
  Sparkles,
  TicketX,
} from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";

export const metadata: Metadata = {
  title: "Acerca de",
  description:
    "Conoce por que REVERA existe para ayudarte a descubrir experiencias que vale la pena vivir.",
};

const imageSrc = "/images/about-concert-scene.png";

export default function AboutPage() {
  return (
    <main className="bg-[#071018] text-[#f6f3ea]">
      <section className="mx-auto w-full max-w-7xl px-4 py-7 sm:px-6 sm:py-10 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,0.86fr)_minmax(480px,1fr)] lg:items-center">
          <div className="max-w-2xl">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#00c2d1]">
              Acerca de
            </p>
            <div className="mt-3">
              <Image
                src="/brand/revera-lockup.png"
                alt="REVERA"
                width={1210}
                height={300}
                priority
                className="h-auto w-60 sm:w-72"
              />
            </div>
            <h1 className="mt-5 max-w-xl text-4xl font-black leading-[1.04] tracking-tight sm:text-5xl lg:text-6xl">
              Descubre lo proximo que vale la pena vivir
            </h1>
            <p className="mt-5 text-base leading-8 text-slate-300 sm:text-lg">
              REVERA existe para que no vuelvas a enterarte tarde de algo que
              habrias amado vivir. Reunimos informacion publica de fuentes de
              origen para que encuentres fechas, artistas, recintos y
              experiencias sin brincar entre tantas paginas.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <Link
                href="/#eventos"
                className="inline-flex h-11 items-center gap-2 rounded-md bg-[#00c2d1] px-4 text-sm font-black text-[#071018] transition hover:bg-[#33d4de]"
              >
                Descubrir experiencias
                <CalendarSearch className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link
                href="/contacto"
                className="inline-flex h-11 items-center gap-2 rounded-md bg-white/[0.045] px-4 text-sm font-black text-[#f6f3ea] transition hover:bg-white/[0.07] hover:text-[#00c2d1]"
              >
                Contacto
                <ExternalLink className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </div>

          <AboutCollage />
        </div>
      </section>

      <section className="border-y border-white/8">
        <div className="mx-auto grid w-full max-w-7xl gap-3 px-4 py-6 sm:px-6 md:grid-cols-4 lg:px-8">
          <TrustPill icon={ShieldCheck} label="Fuentes verificadas" />
          <TrustPill icon={TicketX} label="Sin venta de boletos" tone="red" />
          <TrustPill icon={Sparkles} label="Oportunidades visibles" tone="red" />
          <TrustPill icon={MapPin} label="Zona metropolitana" />
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-5">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[#00c2d1]">
            Como funciona
          </p>
          <h2 className="mt-1 text-2xl font-black text-[#f6f3ea]">
            Descubrir sin perderte lo importante
          </h2>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          <Step
            number="01"
            title="Encontramos"
            text="Revisamos fuentes publicas, recintos, artistas, boleteras y sitios institucionales."
          />
          <Step
            number="02"
            title="Organizamos"
            text="Ordenamos lo disperso por fecha, artista, recinto, costo y senales de interes."
          />
          <Step
            number="03"
            title="Te acercamos al momento"
            text="Cada experiencia apunta a su fuente de origen para confirmar disponibilidad, requisitos y detalles."
          />
        </div>
      </section>
    </main>
  );
}

function AboutCollage() {
  return (
    <div className="relative min-h-[340px] sm:min-h-[420px]">
      <div className="absolute left-0 top-4 w-[78%] overflow-hidden rounded-lg bg-[#0b1d26] shadow-2xl shadow-black/30">
        <Image
          src={imageSrc}
          alt="Concierto nocturno en Guadalajara"
          width={1600}
          height={1000}
          priority
          className="aspect-[4/3] h-auto w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#071018]/90 via-[#071018]/10 to-transparent" />
      </div>

      <div className="absolute right-0 top-0 w-[48%] overflow-hidden rounded-lg bg-[#0b1d26] shadow-xl shadow-black/30">
        <Image
          src={imageSrc}
          alt=""
          width={900}
          height={900}
          className="aspect-square h-auto w-full object-cover object-right"
        />
        <div className="absolute inset-0 bg-[#00c2d1]/10" />
      </div>

      <div className="absolute bottom-0 right-3 w-[58%] rounded-lg bg-[#0b1d26]/92 p-4 shadow-2xl shadow-black/40 backdrop-blur">
        <BrandLogo compact markOnly />
        <p className="mt-3 text-lg font-black leading-tight text-[#f6f3ea]">
          Lo proximo que vale la pena vivir
        </p>
        <p className="mt-2 text-xs leading-5 text-slate-400">
          Que pasa, cuando es y donde confirmarlo.
        </p>
      </div>
    </div>
  );
}

type TrustPillProps = {
  icon: typeof ShieldCheck;
  label: string;
  tone?: "cyan" | "red";
};

function TrustPill({ icon: Icon, label, tone = "cyan" }: TrustPillProps) {
  const color = tone === "red" ? "text-[#ff8a9b]" : "text-[#00c2d1]";

  return (
    <div className="flex min-h-16 items-center gap-3 rounded-lg bg-white/[0.03] px-4">
      <Icon className={`h-5 w-5 shrink-0 ${color}`} aria-hidden="true" />
      <span className="text-sm font-black text-[#f6f3ea]">{label}</span>
    </div>
  );
}

function Step({
  number,
  title,
  text,
}: {
  number: string;
  title: string;
  text: string;
}) {
  return (
    <article className="border-t border-white/10 pt-4">
      <p className="text-sm font-black text-[#ff8a9b]">{number}</p>
      <h3 className="mt-2 text-xl font-black text-[#f6f3ea]">{title}</h3>
      <p className="mt-2 text-sm leading-7 text-slate-400">{text}</p>
    </article>
  );
}
