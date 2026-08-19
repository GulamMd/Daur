import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms and waiver",
  description: "The terms that apply to entering a Daur race.",
};

/**
 * The version recorded against every registration. When the text below changes
 * materially, bump this AND `termsVersion` in the event documents, so an entry
 * always points at the wording the runner actually agreed to.
 */
export const TERMS_VERSION = "v1";

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="font-display text-text text-2xl font-extrabold tracking-tight">
        Terms and waiver
      </h1>
      <p className="tnum text-text-muted mt-1 font-mono text-xs">
        Version {TERMS_VERSION} · applies to entries made while this version is current
      </p>

      {/* ------------------------------------------------------------------
          UNRESOLVED: the liability waiver below is a placeholder. It must be
          replaced with text from the organizer's own legal advisor before the
          site accepts real entries. Road running carries genuine injury risk
          and this is not text an engineer should draft.
          ------------------------------------------------------------------ */}
      <div
        role="note"
        className="border-border rounded-token mt-6 border border-dashed p-4"
        data-placeholder="liability-waiver"
      >
        <p className="eyebrow text-sodium-ink">Not yet written</p>
        <p className="text-text-muted mt-2 text-sm">
          The assumption-of-risk and liability wording has not been supplied. It needs to come from
          the organizer&rsquo;s legal advisor, not from a template. Until it is in place, this page
          does not constitute a waiver.
        </p>
      </div>

      <Section title="What an entry is">
        <p>
          An entry is a place on the start line for one named person, in one distance, at one
          edition. It is not transferable between people or between distances.
        </p>
        <p>
          Entries are made against a date of birth. Minimum ages are checked against race day, not
          against the day you registered.
        </p>
      </Section>

      <Section title="Registering other people">
        <p>
          One account can enter several people. By entering someone else you confirm that you are
          entitled to do so, that the details you submit are accurate, and that they accept these
          terms.
        </p>
        <p>
          For anyone under 18, the entry must be made by a parent or guardian who accepts these
          terms on their behalf.
        </p>
      </Section>

      <Section title="Changes and cancellation">
        <p>
          Cancellation is handled directly by the organizer. Contact them with your entry reference
          and they will cancel it and release the slot. There is no self-service cancellation.
        </p>
        <p>
          If the organizer cancels an edition, entries are cancelled and everyone affected is
          contacted directly.
        </p>
      </Section>

      <Section title="Race day">
        <p>
          Instructions issued by marshals, medical staff and the police are binding. Cut-off times
          exist because roads reopen on a schedule agreed with the city, and they are enforced.
        </p>
        <p>
          Running on someone else&rsquo;s entry results in both entries being cancelled. Specific
          rules for each race — headphones, cut-offs, aid stations — are on that race&rsquo;s page.
        </p>
      </Section>

      <Section title="Your details">
        <p>
          What is collected and why is set out on the{" "}
          <Link href="/privacy" className="text-text underline underline-offset-4">
            privacy page
          </Link>
          .
        </p>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="eyebrow text-text-muted">{title}</h2>
      <div className="text-text-muted mt-3 max-w-prose space-y-3 text-sm leading-relaxed">
        {children}
      </div>
    </section>
  );
}
