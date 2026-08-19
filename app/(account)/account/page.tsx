import { redirect } from "next/navigation";

// Registrations are what people come back for, so /account lands there.
export default function AccountIndexPage() {
  redirect("/account/registrations");
}
