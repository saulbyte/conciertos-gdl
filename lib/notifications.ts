import type { PrismaClient } from "@prisma/client";
import { formatEventDate } from "@/lib/format";

type ResendResponse = {
  id?: string;
  message?: string;
  error?: string;
};

export async function notifyArtistSubscribersOfNewEvent(
  prisma: PrismaClient,
  eventId: string,
) {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      venue: true,
      artists: {
        include: {
          artist: {
            include: {
              subscriptions: {
                where: { active: true },
              },
            },
          },
        },
      },
    },
  });

  if (!event) {
    return;
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://conciertos-gdl.vercel.app";
  const eventUrl = `${appUrl.replace(/\/$/u, "")}/event/${event.id}`;
  const deliveredTo = new Set<string>();

  for (const eventArtist of event.artists) {
    const { artist } = eventArtist;

    for (const subscription of artist.subscriptions) {
      if (deliveredTo.has(subscription.email)) {
        continue;
      }

      deliveredTo.add(subscription.email);

      try {
        await sendArtistEventEmail({
          artistName: artist.name,
          email: subscription.email,
          eventDate: formatEventDate(event.eventDate, event.source),
          eventTitle: event.title,
          eventUrl,
          venueName: event.venue.name,
        });
      } catch (error) {
        console.error(
          `[notifications] No se pudo enviar aviso a ${subscription.email}:`,
          error,
        );
      }
    }
  }
}

async function sendArtistEventEmail({
  artistName,
  email,
  eventDate,
  eventTitle,
  eventUrl,
  venueName,
}: {
  artistName: string;
  email: string;
  eventDate: string;
  eventTitle: string;
  eventUrl: string;
  venueName: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.NOTIFICATION_FROM_EMAIL;

  if (!apiKey || !from) {
    console.info(
      `[notifications] Aviso omitido para ${email}: faltan RESEND_API_KEY o NOTIFICATION_FROM_EMAIL.`,
    );
    return;
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: email,
      subject: `${artistName} tiene nuevo concierto en Guadalajara`,
      html: `
        <div style="font-family: Arial, sans-serif; color: #0f172a; line-height: 1.6;">
          <p style="font-size: 14px; color: #6d28d9; font-weight: 700; text-transform: uppercase;">Conciertos GDL</p>
          <h1 style="font-size: 24px; margin: 0 0 12px;">Nuevo concierto detectado</h1>
          <p>Encontramos una fecha nueva de <strong>${escapeHtml(artistName)}</strong>.</p>
          <div style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 18px 0;">
            <h2 style="font-size: 18px; margin: 0 0 8px;">${escapeHtml(eventTitle)}</h2>
            <p style="margin: 0;">${escapeHtml(eventDate)}</p>
            <p style="margin: 4px 0 0;">${escapeHtml(venueName)}</p>
          </div>
          <p>
            <a href="${eventUrl}" style="display: inline-block; background: #7c3aed; color: white; padding: 12px 18px; border-radius: 6px; text-decoration: none; font-weight: 700;">
              Ver evento
            </a>
          </p>
          <p style="font-size: 12px; color: #64748b;">Recibiste este aviso porque marcaste interes en este artista.</p>
        </div>
      `,
    }),
  });

  if (!response.ok) {
    const result = (await response.json().catch(() => null)) as
      | ResendResponse
      | null;
    throw new Error(
      result?.message ||
        result?.error ||
        `Resend rejected the email with status ${response.status}`,
    );
  }
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
