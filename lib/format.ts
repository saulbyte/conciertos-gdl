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
  };

  return labels[source] ?? source;
}
