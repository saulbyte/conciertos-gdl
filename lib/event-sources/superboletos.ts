import { EventSource, type PrismaClient } from "@prisma/client";
import { get } from "node:https";
import { syncEventSource } from "@/lib/event-sources/sync";
import type {
  EventSourceAdapter,
  ExternalEvent,
} from "@/lib/event-sources/types";

const CATALOG_URL =
  "https://dl09mj2qf37fz.cloudfront.net/SuperBoletosRepositorio/apps/jsonCache/27768/catalogos/search.json";
const EVENT_URL = "https://www.superboletos.com/landing-evento";
const REQUEST_TIMEOUT_MS = 30_000;
const MAX_CATALOG_BYTES = 5 * 1024 * 1024;

const METRO_CITIES = new Map([
  ["guadalajara", "Guadalajara"],
  ["zapopan", "Zapopan"],
  ["tlaquepaque", "San Pedro Tlaquepaque"],
  ["san pedro tlaquepaque", "San Pedro Tlaquepaque"],
  ["tlajomulco", "Tlajomulco de Zuniga"],
  ["tlajomulco de zuniga", "Tlajomulco de Zuniga"],
  ["tonala", "Tonala"],
]);

type SuperboletosCatalogEvent = {
  eventoId?: string;
  nombreEvento?: string;
  nombreRecinto?: string;
  nombreCiudad?: string;
  estadoEvento?: string;
  claveTipoEvento?: string;
  fechaPrimeraPresentacion?: string;
  ventaInicio?: string;
  fechas?: string;
  rutaImagenMain?: string | null;
  claveEstatusFechaEvento?: string | null;
};

export const superboletosAdapter: EventSourceAdapter = {
  name: "Superboletos",
  source: EventSource.SUPERBOLETOS,
  fetchEvents: fetchSuperboletosEvents,
};

export async function syncSuperboletosEvents(prisma: PrismaClient) {
  return syncEventSource(prisma, superboletosAdapter);
}

export async function fetchSuperboletosEvents(): Promise<ExternalEvent[]> {
  const catalog = await requestCatalog(
    process.env.SUPERBOLETOS_CATALOG_URL || CATALOG_URL,
  );
  const now = new Date();

  return catalog
    .map(mapCatalogEvent)
    .filter((event): event is ExternalEvent => event !== null)
    .filter((event) => event.eventDate > now);
}

function requestCatalog(url: string) {
  return new Promise<SuperboletosCatalogEvent[]>((resolve, reject) => {
    const request = get(
      url,
      {
        headers: {
          Accept: "application/json",
          "User-Agent":
            "ConciertosGDL/1.0 (+https://conciertos-gdl.vercel.app; event indexer)",
        },
      },
      (response) => {
        if (response.statusCode !== 200) {
          response.resume();
          reject(
            new Error(
              `Superboletos catalog request failed: ${response.statusCode ?? "unknown"}`,
            ),
          );
          return;
        }

        const chunks: Buffer[] = [];
        let totalBytes = 0;

        response.on("data", (chunk: Buffer) => {
          totalBytes += chunk.length;

          if (totalBytes > MAX_CATALOG_BYTES) {
            request.destroy(new Error("Superboletos catalog exceeded 5 MB"));
            return;
          }

          chunks.push(chunk);
        });
        response.on("end", () => {
          try {
            resolve(
              JSON.parse(Buffer.concat(chunks).toString("utf8")) as SuperboletosCatalogEvent[],
            );
          } catch (error) {
            reject(new Error("Superboletos returned invalid JSON", { cause: error }));
          }
        });
        response.on("error", reject);
      },
    );

    request.setTimeout(REQUEST_TIMEOUT_MS, () => {
      request.destroy(new Error("Superboletos catalog request timed out"));
    });
    request.on("error", reject);
  });
}

export function mapCatalogEvent(
  item: SuperboletosCatalogEvent,
): ExternalEvent | null {
  const externalId = cleanText(item.eventoId);
  const title = cleanText(item.nombreEvento);
  const venue = cleanText(item.nombreRecinto);
  const city = normalizeMetroCity(item.nombreCiudad);
  const eventDate = parseCatalogDate(
    item.fechaPrimeraPresentacion,
    item.fechas,
  );
  const saleStart = parseCatalogDate(item.ventaInicio);

  if (
    !externalId ||
    !title ||
    !venue ||
    !city ||
    !eventDate ||
    normalizeForSearch(item.estadoEvento) !== "jalisco" ||
    normalizeForSearch(item.claveTipoEvento) !== "conciertos" ||
    normalizeForSearch(item.claveEstatusFechaEvento) === "cancelado" ||
    (saleStart && saleStart > new Date())
  ) {
    return null;
  }

  return {
    externalId,
    title,
    description: null,
    eventDate,
    imageUrl: cleanText(item.rutaImagenMain) || null,
    sourceUrl: `${EVENT_URL}/${encodeURIComponent(externalId)}`,
    venue: {
      name: venue,
      city,
    },
    artists: [],
  };
}

function parseCatalogDate(
  value?: string | null,
  displayValue?: string | null,
) {
  const match = cleanText(value).match(
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2})(?::(\d{2}))?$/,
  );

  if (!match) {
    return null;
  }

  const [, day, month, year, rawHour, rawMinute, second = "00"] = match;
  const displayTime = cleanText(displayValue).match(
    /(\d{1,2}):(\d{2})\s*Hrs\.?/i,
  );
  const hour = displayTime?.[1] ?? rawHour;
  const minute = displayTime?.[2] ?? rawMinute;
  const date = new Date(
    `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}T${hour.padStart(2, "0")}:${minute}:${second}-06:00`,
  );

  return Number.isNaN(date.getTime()) ? null : date;
}

function normalizeMetroCity(value?: string | null) {
  return METRO_CITIES.get(normalizeForSearch(value)) ?? null;
}

function normalizeForSearch(value?: string | null) {
  return cleanText(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function cleanText(value?: string | null) {
  return value?.replace(/\s+/g, " ").trim() ?? "";
}
