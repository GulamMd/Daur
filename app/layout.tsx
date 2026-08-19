import type { Metadata } from "next";
import { Archivo, IBM_Plex_Sans, IBM_Plex_Sans_Devanagari, IBM_Plex_Mono } from "next/font/google";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import "./globals.css";

// Rationale for each face: docs/design-direction.md
const display = Archivo({
  variable: "--font-daur-display",
  subsets: ["latin"],
  axes: ["wdth"],
});

const body = IBM_Plex_Sans({
  variable: "--font-daur-body",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

// Daur is दौड़. The wordmark is set in its own script, which is the actual
// reason the Plex family was chosen over a neutral default.
const devanagari = IBM_Plex_Sans_Devanagari({
  variable: "--font-daur-deva",
  subsets: ["devanagari"],
  weight: ["600"],
});

const mono = IBM_Plex_Mono({
  variable: "--font-daur-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: "Daur",
    template: "%s · Daur",
  },
  description: "City road races on closed streets. Register your crew, turn up at the start line.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${body.variable} ${devanagari.variable} ${mono.variable} h-full antialiased`}
    >
      <body className="bg-surface text-text flex min-h-full flex-col">
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
