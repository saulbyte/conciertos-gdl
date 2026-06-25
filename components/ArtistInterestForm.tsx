"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { Bell, CheckCircle2, Mail } from "lucide-react";

type ArtistInterestFormProps = {
  artistId: string;
  artistName: string;
};

type Status = "idle" | "success" | "error";

export function ArtistInterestForm({
  artistId,
  artistName,
}: ArtistInterestFormProps) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsPending(true);
    setStatus("idle");
    setMessage("");

    try {
      const response = await fetch(`/api/artists/${artistId}/subscriptions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });
      const result = (await response.json()) as { message?: string };

      if (!response.ok) {
        throw new Error(result.message || "No se pudo guardar tu aviso.");
      }

      setStatus("success");
      setMessage(result.message || "Listo, te avisaremos cuando haya fecha nueva.");
      setEmail("");
    } catch (error) {
      setStatus("error");
      setMessage(
        error instanceof Error
          ? error.message
          : "No se pudo guardar tu aviso. Intenta de nuevo.",
      );
    } finally {
      setIsPending(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full min-w-0 rounded-lg border border-violet-200 bg-white p-4 shadow-sm shadow-violet-100/70"
    >
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-violet-600 text-white">
          <Bell className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <h2 className="text-base font-bold text-slate-950">
            Avisame por correo
          </h2>
          <p className="mt-1 text-sm leading-5 text-slate-600">
            Recibe una alerta cuando encontremos un concierto nuevo de{" "}
            {artistName} en Guadalajara.
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]">
        <label className="relative block">
          <span className="sr-only">Correo electronico</span>
          <Mail
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
          <input
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="tu@email.com"
            className="h-12 w-full rounded-md border border-slate-300 bg-white pl-9 pr-3 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
          />
        </label>
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-violet-600 px-5 text-sm font-bold text-white shadow-lg shadow-violet-200 transition hover:bg-violet-700 disabled:cursor-wait disabled:bg-violet-400"
        >
          {isPending ? "Guardando" : "Me interesa"}
        </button>
      </div>

      {message ? (
        <p
          className={`mt-3 flex items-start gap-2 text-sm font-medium ${
            status === "success" ? "text-emerald-700" : "text-rose-700"
          }`}
        >
          {status === "success" ? (
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          ) : null}
          <span>{message}</span>
        </p>
      ) : null}

      <p className="mt-3 text-xs leading-5 text-slate-500">
        Sin login. Solo usaremos tu correo para avisos de este artista.
      </p>
    </form>
  );
}
