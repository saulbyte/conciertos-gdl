"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { Bell, CheckCircle2, Mail } from "lucide-react";

type ArtistInterestFormProps = {
  artistId: string;
  artistName: string;
  compact?: boolean;
};

type Status = "idle" | "success" | "error";

export function ArtistInterestForm({
  artistId,
  artistName,
  compact = false,
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
      id="avisos"
      className="w-full min-w-0 rounded-lg bg-white/[0.045] p-4 shadow-sm shadow-black/20"
    >
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#ff304f] text-white">
          <Bell className="h-4 w-4" aria-hidden="true" />
        </span>
        <div>
          <h2 className="text-sm font-black text-[#f6f3ea] sm:text-base">
            Avisame por correo
          </h2>
          <p className="mt-1 text-xs leading-5 text-slate-400 sm:text-sm">
            Recibe una alerta cuando encontremos una nueva fecha de{" "}
            {artistName} en Guadalajara.
          </p>
        </div>
      </div>

      <div
        className={`mt-4 grid gap-3 ${
          compact ? "" : "sm:grid-cols-[1fr_auto]"
        }`}
      >
        <label className="relative block">
          <span className="sr-only">Correo electronico</span>
          <Mail
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#00c2d1]"
            aria-hidden="true"
          />
          <input
            data-artist-alert-input
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="tu@email.com"
            className="h-11 w-full rounded-md border border-white/10 bg-[#071018]/70 pl-9 pr-3 text-sm font-medium text-[#f6f3ea] outline-none transition placeholder:text-slate-500 focus:border-[#00c2d1]/70 focus:ring-4 focus:ring-[#00c2d1]/10"
          />
        </label>
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-[#ff304f] px-5 text-sm font-black text-white shadow-lg shadow-black/30 transition hover:bg-[#ff5d74] disabled:cursor-wait disabled:bg-[#ff304f]/60"
        >
          {isPending ? "Guardando" : "Me interesa"}
        </button>
      </div>

      {message ? (
        <p
          className={`mt-3 flex items-start gap-2 text-sm font-medium ${
            status === "success" ? "text-[#00c2d1]" : "text-[#ff8a9b]"
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
