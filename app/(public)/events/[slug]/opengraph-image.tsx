import { ImageResponse } from "next/og";
import { getEventBySlug } from "@/server/services/event.service";
import { loadOgFonts, loadOgColors, sodiumGlow, OG_SIZE } from "@/lib/og-fonts";
import { formatEventDate, formatTime } from "@/lib/format";
import { effectiveStatus } from "@/lib/event-status";
import { EventStatus } from "@/generated/prisma/enums";

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "Daur race";

/**
 * The preview card that renders when someone shares an event link on
 * Instagram, WhatsApp or Slack. This is the top of the entire funnel, so it
 * carries the same identity as the page: asphalt ground, sodium light, the
 * name in Archivo, the facts in mono.
 *
 * Colours are parsed out of tokens.css rather than restated here, so the card
 * cannot drift away from the site the first time the palette is touched.
 */
export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [event, fonts, colors] = await Promise.all([
    getEventBySlug(slug),
    loadOgFonts(),
    loadOgColors(),
  ]);

  const archivo = {
    name: "Archivo",
    data: fonts.archivo,
    style: "normal" as const,
    weight: 800 as const,
  };
  const plex = { name: "Plex", data: fonts.mono, style: "normal" as const, weight: 400 as const };

  if (!event) {
    return new ImageResponse(
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: colors.asphalt,
          color: colors.bib,
          fontFamily: "Archivo",
          fontSize: 64,
        }}
      >
        Daur
      </div>,
      { ...size, fonts: [archivo] },
    );
  }

  const status = effectiveStatus(event);
  const statusLabel =
    status === EventStatus.REGISTRATION_OPEN
      ? "Registration open"
      : status === EventStatus.COMING_SOON
        ? "Coming soon"
        : status === EventStatus.COMPLETED
          ? "Completed"
          : status === EventStatus.CANCELLED
            ? "Cancelled"
            : "Registration closed";

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: 72,
        background: colors.asphalt,
        // The streetlight, as a light source rather than a decorative blob.
        backgroundImage: `radial-gradient(46% 62% at 12% -6%, ${sodiumGlow(colors.sodium, 0.4)} 0%, ${sodiumGlow(colors.sodium, 0)} 66%)`,
        color: colors.bib,
        fontFamily: "Archivo",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div
          style={{
            fontFamily: "Plex",
            fontSize: 24,
            letterSpacing: 6,
            color: colors.chalk,
            opacity: 0.75,
          }}
        >
          DAUR
        </div>
        <div
          style={{
            fontFamily: "Plex",
            fontSize: 22,
            letterSpacing: 3,
            textTransform: "uppercase",
            color: colors.sodium,
            border: `2px solid ${colors.sodium}`,
            borderRadius: 8,
            padding: "8px 16px",
          }}
        >
          {statusLabel}
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column" }}>
        <div
          style={{
            fontSize: event.name.length > 26 ? 78 : 96,
            fontWeight: 800,
            lineHeight: 1,
            letterSpacing: -2,
            display: "flex",
          }}
        >
          {event.name}
        </div>
        {event.tagline && (
          <div
            style={{
              fontFamily: "Plex",
              fontSize: 30,
              marginTop: 20,
              color: colors.chalk,
              opacity: 0.8,
              display: "flex",
            }}
          >
            {event.tagline}
          </div>
        )}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <div style={{ display: "flex", gap: 14 }}>
          {event.categories.map((category) => (
            <div
              key={category.name}
              style={{
                fontFamily: "Plex",
                fontSize: 28,
                color: colors.bib,
                border: `2px solid ${colors.chalk}59`,
                borderRadius: 10,
                padding: "10px 20px",
                display: "flex",
              }}
            >
              {category.name}
            </div>
          ))}
        </div>
        <div
          style={{
            fontFamily: "Plex",
            fontSize: 28,
            color: colors.chalk,
            opacity: 0.85,
            display: "flex",
          }}
        >
          {formatEventDate(event.startAt, event.timezone)} ·{" "}
          {formatTime(event.startAt, event.timezone)} · {event.venueName}, {event.city}
        </div>
      </div>
    </div>,
    { ...size, fonts: [archivo, plex] },
  );
}
