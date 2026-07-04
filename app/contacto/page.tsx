import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { AtSign, ExternalLink, Info, Link2, MapPin, ShieldCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "Contacto",
  description:
    "Contacta a Dónde Toca por Instagram para sugerir eventos, corregir información o proponer fuentes.",
};

const instagramUrl = "https://www.instagram.com/conciertos.gdl/";
const imageSrc = "/images/about-concert-scene.png";

export default function ContactPage() {
  return (
    <main className="bg-[#071018] text-[#f6f3ea]">
      <section className="mx-auto w-full max-w-7xl px-4 py-7 sm:px-6 sm:py-10 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,0.88fr)_minmax(420px,0.86fr)] lg:items-center">
          <div className="max-w-2xl">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#00c2d1]">
              Contacto
            </p>
            <h1 className="mt-2 text-4xl font-black leading-[1.04] tracking-tight sm:text-5xl lg:text-6xl">
              Escríbenos por Instagram
            </h1>
            <p className="mt-5 text-base leading-8 text-slate-300 sm:text-lg">
              Para sugerir eventos, corregir información o proponer fuentes,
              escríbenos por Instagram. Es el canal más rápido para revisar
              links oficiales y actualizar la agenda.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <a
                href={instagramUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-11 items-center gap-2 rounded-md bg-[#00c2d1] px-4 text-sm font-black text-[#071018] transition hover:bg-[#33d4de]"
              >
                Abrir Instagram
                <ExternalLink className="h-4 w-4" aria-hidden="true" />
              </a>
              <Link
                href="/acerca-de"
                className="inline-flex h-11 items-center rounded-md bg-white/[0.045] px-4 text-sm font-black text-[#f6f3ea] transition hover:bg-white/[0.07] hover:text-[#00c2d1]"
              >
                Acerca de Dónde Toca
              </Link>
            </div>
          </div>

          <ContactVisual />
        </div>
      </section>

      <section className="border-t border-white/8">
        <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-5">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#00c2d1]">
              Qué mandar
            </p>
            <h2 className="mt-1 text-2xl font-black text-[#f6f3ea]">
              Ayuda a mantener la agenda viva
            </h2>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <ContactRow
              icon={Link2}
              title="Link oficial del evento"
              text="La fuente de origen ayuda a validar rápido."
            />
            <ContactRow
              icon={MapPin}
              title="Artista, fecha y recinto"
              text="Con esos datos ubicamos y comparamos el evento."
            />
            <ContactRow
              icon={Info}
              title="Corrección o fuente"
              text="Mándanos el dato correcto y dónde se publicó."
            />
          </div>
        </div>
      </section>

      <section className="border-t border-white/8">
        <div className="mx-auto grid w-full max-w-7xl gap-4 px-4 py-8 sm:px-6 md:grid-cols-[minmax(0,1fr)_auto] md:items-center lg:px-8">
          <p className="max-w-3xl text-sm leading-7 text-slate-400">
            Dónde Toca no vende boletos ni gestiona accesos. Para compras,
            reembolsos, cambios o disponibilidad, consulta directamente la
            fuente oficial del evento.
          </p>
          <Link
            href="/terminos"
            className="inline-flex h-11 w-fit items-center rounded-md bg-white/[0.045] px-4 text-sm font-black text-[#f6f3ea] transition hover:bg-white/[0.07] hover:text-[#00c2d1]"
          >
            Términos de uso
          </Link>
        </div>
      </section>
    </main>
  );
}

function ContactVisual() {
  return (
    <div className="relative min-h-[330px] overflow-hidden rounded-lg bg-[#0b1d26] shadow-2xl shadow-black/30 sm:min-h-[430px]">
      <Image
        src={imageSrc}
        alt="Concierto nocturno en Guadalajara"
        width={1600}
        height={1000}
        priority
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#071018] via-[#071018]/45 to-[#071018]/10" />

      <div className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full bg-[#071018]/70 px-3 py-2 text-xs font-black text-[#f6f3ea] backdrop-blur">
        <ShieldCheck className="h-4 w-4 text-[#00c2d1]" aria-hidden="true" />
        Fuentes oficiales y públicas
      </div>

      <div className="absolute bottom-4 left-4 right-4 rounded-lg bg-[#071018]/88 p-4 backdrop-blur">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#ff304f]/12 text-[#ff8a9b]">
            <AtSign className="h-5 w-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-[#00c2d1]">
              Instagram
            </p>
            <h2 className="mt-1 truncate text-2xl font-black text-[#f6f3ea]">
              @conciertos.gdl
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Para publicaciones, correcciones y fuentes nuevas.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

type ContactRowProps = {
  icon: typeof Link2;
  title: string;
  text: string;
};

function ContactRow({ icon: Icon, title, text }: ContactRowProps) {
  return (
    <article className="flex gap-3 rounded-lg bg-white/[0.03] p-4">
      <Icon className="mt-0.5 h-5 w-5 shrink-0 text-[#00c2d1]" aria-hidden="true" />
      <div>
        <h3 className="text-base font-black text-[#f6f3ea]">{title}</h3>
        <p className="mt-1 text-sm leading-6 text-slate-400">{text}</p>
      </div>
    </article>
  );
}
