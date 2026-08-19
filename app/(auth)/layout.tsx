export default function AuthLayout({ children }: LayoutProps<"/">) {
  // Deliberately quiet. The design direction spends its boldness on the bib,
  // not on forms.
  return <div className="mx-auto w-full max-w-sm px-4 py-14 sm:py-20">{children}</div>;
}
