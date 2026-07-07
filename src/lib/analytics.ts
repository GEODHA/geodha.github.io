// Thin wrapper around the gtag global injected by index.html.
// Safe to call anywhere — no-ops if GA hasn't loaded (e.g. ad blockers, dev).

declare function gtag(...args: unknown[]): void;

export function trackEvent(name: string, params?: Record<string, unknown>): void {
  if (typeof gtag === 'undefined') return;
  gtag('event', name, params ?? {});
}
