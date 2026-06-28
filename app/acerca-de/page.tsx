import type { Metadata } from "next";
import Link from "next/link";
import { CalendarCheck2, ExternalLink, ShieldCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "Acerca de",
  description:
    "Conoce que es Conciertos GDL y como reunimos informacion de eventos musicales en Guadalajara.",
};

export default function AboutPage() {
  return (
    <main className="bg-slate-50">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto w-full max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
          <p className="text-sm font-bold uppercase text-violet-700">
            Acerca de
          </p>
          <h1 className="mt-2 text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">
            Conciertos GDL
          </h1>
          <p className="mt-5 text-lg leading-8 text-slate-600">
            Conciertos GDL es una agenda independiente para descubrir conciertos
            y eventos musicales en Guadalajara y su zona metropolitana.
            Reunimos informacion publica de distintas fuentes para que sea mas
            facil encontrar fechas, artistas, recintos y enlaces oficiales.
          </p>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-4xl gap-5 px-4 py-10 sm:px-6 lg:px-8">
        <InfoBlock
          icon={ShieldCheck}
          title="No vendemos boletos"
          text="El sitio funciona como agregador informativo. Cuando un evento tiene enlace disponible, te dirigimos a la fuente de origen para consultar detalles, disponibilidad y compra."
        />
        <InfoBlock
          icon={ExternalLink}
          title="Fuentes publicas y verificables"
          text="La informacion puede venir de plataformas de boletaje, recintos, fuentes institucionales o paginas publicas de eventos. Siempre buscamos mantener enlaces claros hacia el origen."
        />
        <InfoBlock
          icon={CalendarCheck2}
          title="Actualizacion constante"
          text="El catalogo se actualiza periodicamente para sumar nuevos eventos, corregir informacion disponible y mejorar la experiencia de descubrimiento."
        />

        <div className="rounded-lg border border-slate-200 bg-white p-6">
          <h2 className="text-xl font-bold text-slate-950">
            Para quien es este sitio
          </h2>
          <p className="mt-3 leading-7 text-slate-600">
            Para personas que quieren encontrar musica en vivo en la ciudad sin
            revisar muchas paginas por separado. La idea es que puedas descubrir
            eventos por artista, fecha, recinto o tipo de entrada, y despues
            confirmar la informacion directamente en la fuente oficial.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/#eventos"
              className="inline-flex h-11 items-center rounded-md bg-violet-600 px-4 text-sm font-bold text-white transition hover:bg-violet-700"
            >
              Ver eventos
            </Link>
            <Link
              href="/contacto"
              className="inline-flex h-11 items-center rounded-md border border-slate-300 bg-white px-4 text-sm font-bold text-slate-700 transition hover:border-violet-300 hover:text-violet-700"
            >
              Contacto
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

type InfoBlockProps = {
  icon: typeof ShieldCheck;
  title: string;
  text: string;
};

function InfoBlock({ icon: Icon, title, text }: InfoBlockProps) {
  return (
    <article className="flex gap-4 rounded-lg border border-slate-200 bg-white p-5">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-violet-100 text-violet-700">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <div>
        <h2 className="text-lg font-bold text-slate-950">{title}</h2>
        <p className="mt-2 leading-7 text-slate-600">{text}</p>
      </div>
    </article>
  );
}
