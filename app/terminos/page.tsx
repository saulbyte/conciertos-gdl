import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terminos de uso",
  description:
    "Terminos generales de uso de Conciertos GDL como agenda informativa de eventos musicales.",
};

export default function TermsPage() {
  return (
    <main className="bg-slate-50">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto w-full max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
          <p className="text-sm font-bold uppercase text-violet-700">
            Terminos
          </p>
          <h1 className="mt-2 text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">
            Terminos de uso
          </h1>
          <p className="mt-5 text-sm leading-6 text-slate-500">
            Ultima actualizacion: 28 de junio de 2026.
          </p>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-4xl gap-6 px-4 py-10 text-slate-700 sm:px-6 lg:px-8">
        <TermsSection title="Servicio informativo">
          <p>
            Conciertos GDL es una agenda informativa de conciertos y eventos
            musicales en Guadalajara y zona metropolitana. No somos boletera,
            promotor, recinto ni vendedor de entradas.
          </p>
        </TermsSection>

        <TermsSection title="Informacion de eventos">
          <p>
            Trabajamos para mantener la informacion actualizada, pero fechas,
            horarios, recintos, precios, disponibilidad y enlaces pueden cambiar
            sin previo aviso. Antes de asistir o comprar boletos, confirma los
            datos directamente en la fuente oficial.
          </p>
        </TermsSection>

        <TermsSection title="Enlaces externos">
          <p>
            El sitio puede incluir enlaces a paginas de terceros. No controlamos
            su contenido, politicas, disponibilidad, procesos de compra ni
            atencion al cliente.
          </p>
        </TermsSection>

        <TermsSection title="Uso aceptable">
          <p>
            No debes usar el sitio para actividades ilegales, automatizaciones
            abusivas, manipulacion de interacciones, intentos de vulnerar la
            seguridad o cualquier uso que afecte la operacion del servicio.
          </p>
        </TermsSection>

        <TermsSection title="Cambios">
          <p>
            Podemos actualizar estos terminos conforme evolucione el proyecto.
            La version vigente se publicara en esta pagina.
          </p>
        </TermsSection>

        <TermsSection title="Contacto">
          <p>
            Para dudas, reportes o correcciones, contactanos en Instagram:
            @conciertos.gdl.
          </p>
        </TermsSection>
      </section>
    </main>
  );
}

function TermsSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-6">
      <h2 className="text-xl font-bold text-slate-950">{title}</h2>
      <div className="mt-3 leading-7 text-slate-600">{children}</div>
    </article>
  );
}
