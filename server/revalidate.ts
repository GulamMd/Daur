import { revalidatePath } from "next/cache";

/**
 * The public pages are prerendered and refreshed on a 60 second window. An
 * organizer opening registration should not have to wait that out and wonder
 * whether the write landed, so every mutation that changes what the public
 * sees drops the cached copies immediately.
 *
 * The sitemap is included because a newly published event is otherwise
 * invisible to crawlers for up to an hour (app/sitemap.ts sets revalidate).
 *
 * Note: scripts/event-status.ts calls the service directly rather than going
 * through HTTP, so it cannot revalidate. Expect up to 60s of staleness there.
 */
export function revalidatePublicEvent(slug: string): void {
  revalidatePath(`/events/${slug}`);
  revalidatePath("/events");
  revalidatePath("/");
  revalidatePath("/sitemap.xml");
}
