/**
 * Minimal analytics abstraction so UI components never talk to a
 * specific analytics vendor directly. In this pass it only supports a
 * console.log sink (dev) and a no-op sink (prod with no provider
 * configured). When a real provider (e.g. Plausible, Umami, GA4) is
 * wired in later, only this file needs to change.
 *
 * Usage: `track("external_link_click", { href, label })`
 */

type EventProps = Record<string, string | number | boolean | undefined>;

const PROVIDER = process.env.NEXT_PUBLIC_ANALYTICS_PROVIDER ?? "";

export function track(event: string, props?: EventProps): void {
  if (!PROVIDER) {
    // No analytics provider configured — no-op in production, but a
    // console.log in dev so the event stream is still visible.
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.log(`[analytics] ${event}`, props ?? {});
    }
    return;
  }

  // Provider-specific dispatch goes here once a provider is chosen.
  // Keeping this branch intentionally unimplemented (rather than
  // guessing a vendor SDK shape) — wire it up when NEXT_PUBLIC_ANALYTICS_PROVIDER
  // is actually set to something.
  if (process.env.NODE_ENV !== "production") {
    // eslint-disable-next-line no-console
    console.log(`[analytics:${PROVIDER}] ${event}`, props ?? {});
  }
}
