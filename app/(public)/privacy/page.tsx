import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy",
  description: "What Daur collects, why, and where it is stored.",
};

/**
 * Written from what the code actually does, not from a template. If the schema
 * or the third parties change, this page changes with them — a privacy notice
 * that drifts from the system is worse than none.
 */
export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="font-display text-text text-2xl font-extrabold tracking-tight">Privacy</h1>
      <p className="text-text-muted mt-2 max-w-prose text-sm">
        This describes what the site actually stores. It is deliberately specific rather than
        general.
      </p>

      <Section title="What is collected">
        <Table
          rows={[
            [
              "Your account",
              "Name, email address, and either a password or a linked Google account. A phone number if you add one.",
            ],
            [
              "People you register",
              "Full name, date of birth, gender, mobile number, and an email address if given.",
            ],
            [
              "Each entry",
              "A copy of those details as submitted, the age on race day, the entry reference, and when the terms were accepted.",
            ],
          ]}
        />
        <p>
          Passwords are never stored. What is stored is an argon2id hash, from which the password
          cannot be recovered.
        </p>
        <p>
          The copy kept against an entry is deliberately frozen. Correcting a name later updates the
          person on your account but does not rewrite an entry already made, because the entry is
          the record of what was actually submitted.
        </p>
      </Section>

      <Section title="Why">
        <p>
          Date of birth is used to check minimum ages against race day. Mobile numbers are used by
          the organizer on race day. Everything else exists to run the entry itself.
        </p>
      </Section>

      <Section title="Who can see it">
        <p>
          The race organizer sees the entry list for their own race. Nothing is sold, and nothing is
          shared with advertisers.
        </p>
        <Table
          rows={[
            ["Neon", "Hosts the database (Amazon Web Services, US East)."],
            ["Vercel", "Hosts and serves the site."],
            [
              "Google",
              "Only if you choose to sign in with Google, which shares your name, email and profile picture with us.",
            ],
          ]}
        />
      </Section>

      <Section title="Cookies">
        <p>
          Only the cookies needed to keep you signed in and to protect sign-in against forgery.
          There is no advertising, no analytics and no third-party tracking on this site, which is
          why you are not asked to accept anything.
        </p>
      </Section>

      <Section title="How long it is kept">
        <p>
          Entry records are kept as the organizer&rsquo;s record of who ran. You can remove people
          from your account at any time; if they have run a past race, the entry itself remains and
          they simply disappear from your account.
        </p>
        <p>To have an account and its data deleted, contact the organizer.</p>
      </Section>

      <Section title="Contact">
        <p>
          Contact details are on each race page and in your{" "}
          <Link href="/account/registrations" className="text-text underline underline-offset-4">
            entry details
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

function Table({ rows }: { rows: [string, string][] }) {
  return (
    <dl className="border-border rounded-token divide-border divide-y border">
      {rows.map(([term, detail]) => (
        <div key={term} className="px-4 py-3">
          <dt className="text-text text-sm font-medium">{term}</dt>
          <dd className="text-text-muted mt-1 text-sm">{detail}</dd>
        </div>
      ))}
    </dl>
  );
}
