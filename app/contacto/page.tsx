import type { Metadata } from "next";
import Link from "next/link";
import { AtSign, Info, ShieldCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "Contacto",
  description:
    "Contacta a Conciertos GDL para correcciones, dudas, colaboraciones o informacion sobre eventos.",
};

export default function ContactPage() {
  return (
    <main className="bg-slate-50">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto w-full max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
          <p className="text-sm font-bold uppercase text-violet-700">
            Contacto
          </p>
          <h1 className="mt-2 text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">
            Hablemos
          </h1>
          <p className="mt-5 text-lg leading-8 text-slate-600">
            Si encontraste un dato incorrecto, quieres sugerir una fuente,
            compartir un evento musical o proponer una colaboracion, puedes
            escribirnos por Instagram.
          </p>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-4xl gap-5 px-4 py-10 sm:px-6 lg:px-8">
        <article className="rounded-lg border border-slate-200 bg-white p-6">
          <div className="flex items-start gap-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-violet-100 text-violet-700">
              <AtSign className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-xl font-bold text-slate-950">Instagram</h2>
              <p className="mt-2 leading-7 text-slate-600">
                Nuestro canal principal de contacto por ahora es Instagram.
              </p>
              <a
                href="https://www.instagram.com/conciertos.gdl/"
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex h-11 items-center rounded-md bg-violet-600 px-4 text-sm font-bold text-white transition hover:bg-violet-700"
              >
                @conciertos.gdl
              </a>
            </div>
          </div>
        </article>

        <div className="grid gap-5 md:grid-cols-2">
          <ContactNote
            icon={Info}
            title="Correcciones"
            text="Si una fecha, recinto, enlace o artista aparece incorrecto, envianos el detalle y la fuente correcta para revisarlo."
          />
          <ContactNote
            icon={ShieldCheck}
            title="Eventos y fuentes"
            text="Podemos revisar nuevas fuentes publicas de eventos musicales en Guadalajara y zona metropolitana."
          />
        </div>

        <p className="text-sm leading-6 text-slate-500">
          Conciertos GDL no vende boletos ni gestiona accesos. Para dudas sobre
          compras, reembolsos, cambios o disponibilidad, consulta directamente
          el sitio oficial del evento.
        </p>

        <Link
          href="/privacidad"
          className="text-sm font-bold text-violet-700 hover:text-violet-900"
        >
          Ver politica de privacidad
        </Link>
      </section>
    </main>
  );
}

type ContactNoteProps = {
  icon: typeof Info;
  title: string;
  text: string;
};

function ContactNote({ icon: Icon, title, text }: ContactNoteProps) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5">
      <Icon className="h-5 w-5 text-violet-700" aria-hidden="true" />
      <h2 className="mt-3 text-lg font-bold text-slate-950">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
    </article>
  );
}
