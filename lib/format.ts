export function formatEventDate(date: Date, source?: string) {
  return new Intl.DateTimeFormat("es-MX", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: source === "VISIT_JALISCO" ? undefined : "numeric",
    minute: source === "VISIT_JALISCO" ? undefined : "2-digit",
    timeZone: "America/Mexico_City",
  }).format(date);
}

export function formatShortDate(date: Date) {
  return new Intl.DateTimeFormat("es-MX", {
    day: "2-digit",
    month: "short",
    timeZone: "America/Mexico_City",
  }).format(date);
}

export function formatDateBadge(date: Date) {
  const parts = new Intl.DateTimeFormat("es-MX", {
    day: "2-digit",
    month: "short",
    timeZone: "America/Mexico_City",
  }).formatToParts(date);

  return {
    day: parts.find((part) => part.type === "day")?.value ?? "--",
    month: (parts.find((part) => part.type === "month")?.value ?? "---")
      .replace(".", "")
      .slice(0, 3),
  };
}

export function formatEventTime(date: Date, source?: string) {
  const isUnspecified =
    source === "VISIT_JALISCO" ||
    date.getHours() === 0 && date.getMinutes() === 0 && date.getSeconds() === 0;

  if (isUnspecified) {
    return "Horario por confirmar";
  }

  return new Intl.DateTimeFormat("es-MX", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/Mexico_City",
  }).format(date);
}

export function formatSourceName(source: string) {
  const labels: Record<string, string> = {
    TICKETMASTER: "Ticketmaster",
    VISIT_JALISCO: "Visit Jalisco",
    SUPERBOLETOS: "Superboletos",
    C3_STAGE: "C3 Stage",
    FORO_INDEPENDENCIA: "Foro Independencia",
    FUNTICKET: "FunTicket",
    ARENA_GUADALAJARA: "Arena Guadalajara",
    ETICKET: "eTicket",
    KINGTICKET: "KingTicket",
    VIBRA_JALISCO: "Vibra Jalisco",
    FEVER: "Fever",
    DISCOVERED: "REVERA",
  };

  return labels[source] ?? source;
}

export function formatEventPrice(event: {
  admissionType?: string | null;
  currency?: string | null;
  priceMin?: unknown;
  priceMax?: unknown;
}) {
  if (event.admissionType === "FREE") {
    return "Gratis";
  }

  const currency = event.currency ?? "MXN";
  const min = decimalToNumber(event.priceMin);
  const max = decimalToNumber(event.priceMax);

  if (min !== null && max !== null && min !== max) {
    return `${formatMoney(min, currency)} - ${formatMoney(max, currency)}`;
  }

  if (min !== null) {
    return `Desde ${formatMoney(min, currency)}`;
  }

  if (max !== null) {
    return `Hasta ${formatMoney(max, currency)}`;
  }

  return null;
}

function decimalToNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "object" && value && "toNumber" in value) {
    const amount = (value as { toNumber: () => number }).toNumber();
    return Number.isFinite(amount) ? amount : null;
  }

  if (typeof value === "string") {
    const amount = Number(value);
    return Number.isFinite(amount) ? amount : null;
  }

  return null;
}

function formatMoney(value: number, currency: string) {
  return new Intl.NumberFormat("es-MX", {
    currency,
    maximumFractionDigits: 0,
    style: "currency",
  }).format(value);
}
