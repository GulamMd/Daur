import Link from "next/link";

const LINKS = [
  { href: "/terms", label: "Terms" },
  { href: "/privacy", label: "Privacy" },
] as const;

export function SiteFooter() {
  return (
    <footer className="border-border bg-surface-sunk mt-auto border-t">
      <div className="text-text-muted mx-auto flex max-w-5xl flex-col gap-3 px-4 py-8 text-sm sm:flex-row sm:items-center sm:justify-between">
        <p>&copy; {new Date().getFullYear()} Daur</p>
        <ul className="flex gap-6">
          {LINKS.map((link) => (
            <li key={link.href}>
              <Link href={link.href} className="hover:text-text transition-colors">
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </footer>
  );
}
