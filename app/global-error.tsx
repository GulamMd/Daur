"use client";

import { useEffect } from "react";
import { reportError } from "@/lib/report-error";

/**
 * Catches errors thrown by the root layout itself, where the normal error
 * boundary cannot render because the layout never mounted. It must supply its
 * own <html> and <body>, and it cannot rely on the design tokens — globals.css
 * is loaded by the layout that just failed — so the styles here are inline and
 * deliberately literal.
 */
export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => {
    reportError(error, { scope: "root-layout", ...(error.digest ? { digest: error.digest } : {}) });
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#1a1d21",
          color: "#fafaf7",
          fontFamily: "system-ui, sans-serif",
          padding: "2rem",
          textAlign: "center",
        }}
      >
        <div>
          <p style={{ letterSpacing: "0.18em", fontSize: "0.6875rem", color: "#ff8a1f" }}>DAUR</p>
          <h1 style={{ fontSize: "1.5rem", margin: "1rem 0 0.5rem" }}>The site failed to load.</h1>
          <p style={{ color: "#e4e4de", opacity: 0.8, fontSize: "0.875rem", margin: 0 }}>
            Reload the page. If it keeps happening, try again in a few minutes.
          </p>
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages --
              A full document reload is deliberate: the root layout failed to
              mount, so client-side navigation cannot be trusted to recover. */}
          <a
            href="/"
            style={{
              display: "inline-block",
              marginTop: "1.5rem",
              padding: "0.75rem 1rem",
              background: "#ff8a1f",
              color: "#1a1d21",
              borderRadius: "0.375rem",
              textDecoration: "none",
              fontWeight: 600,
              fontSize: "0.875rem",
            }}
          >
            Reload
          </a>
        </div>
      </body>
    </html>
  );
}
