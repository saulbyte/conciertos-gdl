import type { Metadata } from "next";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  AlertTriangle,
  CalendarDays,
  Check,
  ExternalLink,
  Eye,
  MapPin,
  ShieldCheck,
  Sparkles,
  Ticket,
  Trash2,
} from "lucide-react";
import { AdmissionType, EventCandidateStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  importEventCandidate,
  rejectEventCandidate,
  startOfMexicoCityDay,
} from "@/lib/discovery/candidates";
import { formatEventDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Candidatos",
  robots: {
    index: false,
    follow: false,
  },
};

type CandidatesPageProps = {
  searchParams: Promise<{
    key?: string;
    status?: string;
    filter?: string;
  }>;
};

type CandidateWithEvent = Awaited<ReturnType<typeof getCandidates>>[number];

export default async function CandidatesPage({
  searchParams,
}: CandidatesPageProps) {
  const params = await searchParams;
  const key = typeof params.key === "string" ? params.key : "";
  const status = parseStatus(params.status);
  const filter = parseFilter(params.filter);

  if (!isAuthorized(key)) {
    return <UnauthorizedPanel />;
  }

  const [candidates, counts] = await Promise.all([
    getCandidates(status, filter),
    getCounts(),
  ]);

  return (
    <main className="min-h-dvh bg-[#071018] px-4 py-8 text-[#f6f3ea] sm:px-6 lg:px-8">
      <div className="mx-auto grid w-full max-w-7xl gap-6">
        <header className="grid gap-4 border-b border-white/10 pb-5 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[#00c2d1]">
              Radar interno
            </p>
            <h1 className="mt-2 text-3xl font-black tracking-tight md:text-5xl">
              Candidatos encontrados
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400 md:text-base">
              Revisa lo que REVERA descubrio fuera de las fuentes fijas.
              Aprueba solo lo que tenga sentido; lo demas se descarta rapido.
            </p>
          </div>

          <div className="grid grid-cols-3 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] text-center">
            <Metric label="Pendientes" value={counts.PENDING ?? 0} />
            <Metric label="Importados" value={counts.IMPORTED ?? 0} />
            <Metric label="Rechazados" value={counts.REJECTED ?? 0} />
          </div>
        </header>

        <nav className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <FilterLink href={buildHref(key, "PENDING", filter)} active={status === "PENDING"}>
            Pendientes
          </FilterLink>
          <FilterLink href={buildHref(key, "PENDING", "high")} active={filter === "high"}>
            Alta confianza
          </FilterLink>
          <FilterLink href={buildHref(key, "PENDING", "free")} active={filter === "free"}>
            Gratis
          </FilterLink>
          <FilterLink href={buildHref(key, "PENDING", "complete")} active={filter === "complete"}>
            Listos
          </FilterLink>
          <FilterLink href={buildHref(key, "PENDING", "missing")} active={filter === "missing"}>
            Incompletos
          </FilterLink>
          <FilterLink href={buildHref(key, "IMPORTED", "all")} active={status === "IMPORTED"}>
            Importados
          </FilterLink>
          <FilterLink href={buildHref(key, "REJECTED", "all")} active={status === "REJECTED"}>
            Rechazados
          </FilterLink>
        </nav>

        {candidates.length > 0 ? (
          <section className="grid gap-3">
            {candidates.map((candidate) => (
              <CandidateCard
                key={candidate.id}
                candidate={candidate}
                reviewKey={key}
                status={status}
                filter={filter}
              />
            ))}
          </section>
        ) : (
          <section className="rounded-3xl border border-dashed border-white/15 bg-white/[0.03] px-6 py-16 text-center">
            <Sparkles className="mx-auto h-8 w-8 text-[#00c2d1]" aria-hidden="true" />
            <h2 className="mt-4 text-xl font-black">No hay candidatos aqui</h2>
            <p className="mt-2 text-sm text-slate-400">
              Corre `npm run discover:events` para alimentar esta bandeja.
            </p>
          </section>
        )}
      </div>
    </main>
  );
}

async function approveCandidate(formData: FormData) {
  "use server";

  const id = getFormValue(formData, "id");
  const key = getFormValue(formData, "key");
  const status = getFormValue(formData, "status") || "PENDING";
  const filter = getFormValue(formData, "filter") || "all";

  assertAuthorized(key);
  await importEventCandidate(prisma, id);
  revalidatePath("/admin/candidatos");
  redirect(buildHref(key, status, filter));
}

async function rejectCandidate(formData: FormData) {
  "use server";

  const id = getFormValue(formData, "id");
  const key = getFormValue(formData, "key");
  const status = getFormValue(formData, "status") || "PENDING";
  const filter = getFormValue(formData, "filter") || "all";

  assertAuthorized(key);
  await rejectEventCandidate(prisma, id);
  revalidatePath("/admin/candidatos");
  redirect(buildHref(key, status, filter));
}

async function getCandidates(
  status: EventCandidateStatus,
  filter: ReviewFilter,
) {
  const today = startOfMexicoCityDay(new Date());
  const pendingDateGuard =
    status === EventCandidateStatus.PENDING
      ? [{ OR: [{ eventDate: null }, { eventDate: { gte: today } }] }]
      : [];
  const filterGuards =
    filter === "missing"
      ? [{ OR: [{ eventDate: null }, { venueName: null }] }]
      : [];
  const where = {
    status,
    ...(pendingDateGuard.length || filterGuards.length
      ? { AND: [...pendingDateGuard, ...filterGuards] }
      : {}),
    ...(filter === "high" ? { confidence: { gte: 85 } } : {}),
    ...(filter === "free" ? { admissionType: AdmissionType.FREE } : {}),
    ...(filter === "complete"
      ? {
          eventDate: { gte: today },
          venueName: { not: null },
        }
      : {}),
  };

  return prisma.eventCandidate.findMany({
    where,
    orderBy: [{ confidence: "desc" }, { createdAt: "desc" }],
    take: 60,
  });
}

async function getCounts() {
  const grouped = await prisma.eventCandidate.groupBy({
    by: ["status"],
    _count: { status: true },
  });

  return grouped.reduce<Partial<Record<EventCandidateStatus, number>>>(
    (counts, item) => ({
      ...counts,
      [item.status]: item._count.status,
    }),
    {},
  );
}

function CandidateCard({
  candidate,
  reviewKey,
  status,
  filter,
}: {
  candidate: CandidateWithEvent;
  reviewKey: string;
  status: EventCandidateStatus;
  filter: ReviewFilter;
}) {
  const ready = Boolean(candidate.eventDate && candidate.venueName);
  const sourceHost = safeHost(candidate.sourceUrl);

  return (
    <article className="grid gap-4 rounded-3xl border border-white/10 bg-white/[0.035] p-4 shadow-[0_18px_60px_rgba(0,0,0,0.18)] md:grid-cols-[1fr_auto] md:p-5">
      <div className="min-w-0">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <Badge tone={candidate.confidence >= 85 ? "cyan" : "muted"}>
            {candidate.confidence}% confianza
          </Badge>
          {candidate.admissionType === AdmissionType.FREE ? (
            <Badge tone="red">Gratis</Badge>
          ) : null}
          {!ready ? <Badge tone="warning">Falta dato</Badge> : null}
          <Badge tone="muted">{candidate.status}</Badge>
        </div>

        <h2 className="text-lg font-black leading-tight md:text-xl">
          {candidate.title}
        </h2>

        {candidate.description ? (
          <p className="mt-2 line-clamp-2 max-w-3xl text-sm leading-6 text-slate-400">
            {candidate.description}
          </p>
        ) : null}

        <dl className="mt-4 grid gap-2 text-sm text-slate-300 sm:grid-cols-2 lg:grid-cols-4">
          <Info icon={<CalendarDays className="h-4 w-4" aria-hidden="true" />} label="Fecha">
            {candidate.eventDate
              ? formatEventDate(candidate.eventDate)
              : "Sin fecha"}
          </Info>
          <Info icon={<MapPin className="h-4 w-4" aria-hidden="true" />} label="Recinto">
            {candidate.venueName ?? "Sin recinto"}
          </Info>
          <Info icon={<ShieldCheck className="h-4 w-4" aria-hidden="true" />} label="Ciudad">
            {candidate.city ?? "Sin ciudad"}
          </Info>
          <Info icon={<Ticket className="h-4 w-4" aria-hidden="true" />} label="Fuente">
            {candidate.sourceName ?? sourceHost}
          </Info>
        </dl>

        <details className="mt-4 rounded-2xl border border-white/10 bg-[#071018]/70 px-4 py-3 text-sm text-slate-400">
          <summary className="cursor-pointer select-none font-bold text-slate-200">
            Ver texto detectado
          </summary>
          <p className="mt-3 max-h-52 overflow-auto whitespace-pre-wrap leading-6">
            {candidate.rawText ?? "Sin texto extraido."}
          </p>
        </details>
      </div>

      <div className="flex flex-wrap gap-2 md:w-44 md:flex-col">
        <a
          href={candidate.sourceUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-full bg-white/[0.07] px-4 text-sm font-black text-[#f6f3ea] transition hover:bg-white/[0.12] md:flex-none"
        >
          <ExternalLink className="h-4 w-4" aria-hidden="true" />
          Abrir
        </a>
        <Link
          href={candidate.sourceUrl}
          className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-full bg-white/[0.07] px-4 text-sm font-black text-[#f6f3ea] transition hover:bg-white/[0.12] md:flex-none"
        >
          <Eye className="h-4 w-4" aria-hidden="true" />
          Revisar
        </Link>
        <form action={approveCandidate} className="flex-1 md:flex-none">
          <HiddenFields id={candidate.id} reviewKey={reviewKey} status={status} filter={filter} />
          <button
            type="submit"
            disabled={!ready || candidate.status !== EventCandidateStatus.PENDING}
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-[#00c2d1] px-4 text-sm font-black text-[#071018] transition hover:bg-[#35e4ef] disabled:cursor-not-allowed disabled:bg-white/[0.08] disabled:text-slate-500"
          >
            <Check className="h-4 w-4" aria-hidden="true" />
            Aprobar
          </button>
        </form>
        <form action={rejectCandidate} className="flex-1 md:flex-none">
          <HiddenFields id={candidate.id} reviewKey={reviewKey} status={status} filter={filter} />
          <button
            type="submit"
            disabled={candidate.status !== EventCandidateStatus.PENDING}
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-[#ff304f] px-4 text-sm font-black text-white transition hover:bg-[#ff5d74] disabled:cursor-not-allowed disabled:bg-white/[0.08] disabled:text-slate-500"
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
            Rechazar
          </button>
        </form>
      </div>
    </article>
  );
}

function HiddenFields({
  id,
  reviewKey,
  status,
  filter,
}: {
  id: string;
  reviewKey: string;
  status: EventCandidateStatus;
  filter: ReviewFilter;
}) {
  return (
    <>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="key" value={reviewKey} />
      <input type="hidden" name="status" value={status} />
      <input type="hidden" name="filter" value={filter} />
    </>
  );
}

function UnauthorizedPanel() {
  return (
    <main className="grid min-h-dvh place-items-center bg-[#071018] px-4 text-[#f6f3ea]">
      <section className="w-full max-w-md rounded-3xl border border-white/10 bg-white/[0.04] p-6 text-center">
        <AlertTriangle className="mx-auto h-9 w-9 text-[#ff304f]" aria-hidden="true" />
        <h1 className="mt-4 text-2xl font-black">Panel protegido</h1>
        <p className="mt-2 text-sm leading-6 text-slate-400">
          Abre esta pagina con tu llave interna: `/admin/candidatos?key=...`.
        </p>
      </section>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="px-4 py-3">
      <p className="text-2xl font-black text-[#f6f3ea]">{value}</p>
      <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
        {label}
      </p>
    </div>
  );
}

function FilterLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`inline-flex h-10 shrink-0 items-center rounded-full px-4 text-sm font-black transition ${
        active
          ? "bg-[#00c2d1] text-[#071018]"
          : "bg-white/[0.06] text-slate-300 hover:bg-white/[0.1] hover:text-white"
      }`}
    >
      {children}
    </Link>
  );
}

function Badge({
  tone,
  children,
}: {
  tone: "cyan" | "red" | "warning" | "muted";
  children: React.ReactNode;
}) {
  const className = {
    cyan: "bg-[#00c2d1]/14 text-[#50e8f1] ring-[#00c2d1]/30",
    red: "bg-[#ff304f]/14 text-[#ff8da0] ring-[#ff304f]/30",
    warning: "bg-amber-300/12 text-amber-200 ring-amber-300/25",
    muted: "bg-white/[0.06] text-slate-300 ring-white/10",
  }[tone];

  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-black ring-1 ${className}`}>
      {children}
    </span>
  );
}

function Info({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-w-0 gap-2 rounded-2xl bg-white/[0.04] px-3 py-2">
      <span className="mt-0.5 text-[#00c2d1]">{icon}</span>
      <div className="min-w-0">
        <dt className="text-[10px] font-black uppercase tracking-wide text-slate-500">
          {label}
        </dt>
        <dd className="truncate font-bold">{children}</dd>
      </div>
    </div>
  );
}

type ReviewFilter = "all" | "high" | "free" | "complete" | "missing";

function parseStatus(value?: string) {
  if (
    value === EventCandidateStatus.IMPORTED ||
    value === EventCandidateStatus.REJECTED ||
    value === EventCandidateStatus.PENDING
  ) {
    return value;
  }

  return EventCandidateStatus.PENDING;
}

function parseFilter(value?: string): ReviewFilter {
  if (
    value === "high" ||
    value === "free" ||
    value === "complete" ||
    value === "missing"
  ) {
    return value;
  }

  return "all";
}

function buildHref(
  key: string,
  status: EventCandidateStatus | string,
  filter: ReviewFilter | string,
) {
  const params = new URLSearchParams({ key, status });

  if (filter !== "all") {
    params.set("filter", filter);
  }

  return `/admin/candidatos?${params.toString()}`;
}

function getReviewSecret() {
  return process.env.ADMIN_REVIEW_SECRET || process.env.SYNC_SECRET || "";
}

function isAuthorized(key: string) {
  const secret = getReviewSecret();

  return secret.length > 0 && key === secret;
}

function assertAuthorized(key: string) {
  if (!isAuthorized(key)) {
    throw new Error("Unauthorized");
  }
}

function getFormValue(formData: FormData, name: string) {
  const value = formData.get(name);

  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`Missing ${name}`);
  }

  return value;
}

function safeHost(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./u, "");
  } catch {
    return "Fuente externa";
  }
}
