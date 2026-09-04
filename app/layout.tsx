import type { Metadata } from "next";
import { Archivo, IBM_Plex_Sans, IBM_Plex_Sans_Devanagari, IBM_Plex_Mono } from "next/font/google";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { siteUrl } from "@/lib/site-url";
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
  // Absolute OG image URLs depend on this being the real domain in production.
  metadataBase: new URL(siteUrl()),
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
      data-scroll-behavior="smooth"
      className={`${display.variable} ${body.variable} ${devanagari.variable} ${mono.variable} h-full antialiased`}
    >
      <body className="bg-surface text-text flex min-h-full flex-col">
        {/* First tabbable element: lets keyboard and screen-reader users jump
            past the header instead of tabbing through it on every page. */}
        <a
          href="#main"
          className="bg-accent text-accent-text rounded-token sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2 focus:text-sm focus:font-medium"
        >
          Skip to content
        </a>
        <SiteHeader />
        <main id="main" tabIndex={-1} className="flex-1">
          {children}
        </main>
        <SiteFooter />
      </body>
    </html>
  );
}
