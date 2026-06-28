import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Politica de privacidad",
  description:
    "Conoce como Conciertos GDL maneja informacion, analitica, cookies, avisos por correo y anuncios.",
};

export default function PrivacyPage() {
  return (
    <main className="bg-slate-50">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto w-full max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
          <p className="text-sm font-bold uppercase text-violet-700">
            Privacidad
          </p>
          <h1 className="mt-2 text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">
            Politica de privacidad
          </h1>
          <p className="mt-5 text-sm leading-6 text-slate-500">
            Ultima actualizacion: 28 de junio de 2026.
          </p>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-4xl gap-6 px-4 py-10 text-slate-700 sm:px-6 lg:px-8">
        <PolicySection title="Informacion que podemos recopilar">
          <p>
            Conciertos GDL puede recopilar informacion tecnica y de uso, como
            paginas visitadas, interacciones generales, dispositivo, navegador,
            fecha aproximada de acceso y fuente de trafico. Esto nos ayuda a
            entender si el sitio es util y a mejorar la experiencia.
          </p>
          <p>
            Si decides dejar tu correo para recibir avisos de un artista,
            guardamos ese correo y el artista seleccionado para poder enviarte
            notificaciones relacionadas.
          </p>
        </PolicySection>

        <PolicySection title="Analitica y medicion">
          <p>
            Usamos herramientas de analitica, como Vercel Analytics, para medir
            visitas y rendimiento general del sitio. La informacion se usa de
            forma agregada para mejorar el producto.
          </p>
        </PolicySection>

        <PolicySection title="Anuncios y cookies">
          <p>
            El sitio puede usar Google AdSense u otras herramientas de anuncios.
            Estos servicios pueden utilizar cookies o tecnologias similares para
            mostrar anuncios, medir impresiones, limitar frecuencia y combatir
            trafico invalido.
          </p>
          <p>
            La configuracion y uso de cookies puede depender de tu navegador,
            ubicacion y preferencias de consentimiento.
          </p>
        </PolicySection>

        <PolicySection title="Uso de la informacion">
          <p>
            Usamos la informacion para operar el sitio, mostrar eventos,
            mejorar busquedas, medir interes, enviar avisos solicitados y
            mantener la seguridad y calidad del servicio.
          </p>
        </PolicySection>

        <PolicySection title="Fuentes externas">
          <p>
            Los eventos pueden enlazar a sitios externos, como boleteras,
            recintos o paginas institucionales. Al visitar esos sitios, aplican
            sus propias politicas de privacidad y terminos.
          </p>
        </PolicySection>

        <PolicySection title="Contacto">
          <p>
            Para dudas sobre privacidad o para solicitar correcciones, puedes
            contactarnos en Instagram: @conciertos.gdl.
          </p>
        </PolicySection>
      </section>
    </main>
  );
}

function PolicySection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-6">
      <h2 className="text-xl font-bold text-slate-950">{title}</h2>
      <div className="mt-3 grid gap-3 leading-7 text-slate-600">{children}</div>
    </article>
  );
}
