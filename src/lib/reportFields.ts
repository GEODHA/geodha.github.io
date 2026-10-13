// Normalisation helpers for GEODHA app reports, following the mobile app's
// own reader (report.mapper.ts): legacy and current document shapes both
// appear in the `reports` collection.

import type { Report, ReportSize } from '@/services/reportsService';
import type { Dict } from '@/i18n';

/**
 * [lat, lng] for a report, or null. Checks the shapes in the app's order:
 * root `position`, then `location.coordinates` (GeoPoint), then
 * `location.latitude/longitude` (what current writes use).
 */
export function reportLatLng(r: Report): [number, number] | null {
  const ok = (lat: unknown, lng: unknown): boolean =>
    typeof lat === 'number' && typeof lng === 'number' && !isNaN(lat) && !isNaN(lng);

  if (Array.isArray(r.position) && ok(r.position[0], r.position[1])) {
    return [r.position[0], r.position[1]];
  }
  const loc = r.location as Report['location'] | string | undefined;
  if (!loc || typeof loc === 'string') return null;
  if (loc.coordinates && ok(loc.coordinates.latitude, loc.coordinates.longitude)) {
    return [loc.coordinates.latitude, loc.coordinates.longitude];
  }
  if (ok(loc.latitude, loc.longitude)) return [loc.latitude, loc.longitude];
  return null;
}

const SIZES: ReportSize[] = ['small', 'medium', 'large'];

/** issueSize, falling back to the AI estimate (user-edited first). */
export function reportSize(r: Report): ReportSize | null {
  const s = r.issueSize ?? r.aiInsights?.userEdited?.approxSize ?? r.aiInsights?.original?.approxSize;
  return s && (SIZES as string[]).includes(s) ? (s as ReportSize) : null;
}

/** Only `resolved` counts as cleaned up (officials closing a grievance doesn't). */
export const isCleaned = (r: Report) => r.status === 'resolved';

/** Cleaned up with a verified after photo. */
export const afterPhoto = (r: Report): string | null =>
  isCleaned(r) && r.resolution?.photoUrl ? r.resolution.photoUrl : null;

// ── Region filter ────────────────────────────────────────────────────────────

// Rough bounding box of Punjab (India). Only used when a report has no
// reverse-geocoded `location.state` — geocoding is best-effort in the app.
const PUNJAB_BBOX = { south: 29.53, north: 32.58, west: 73.87, east: 76.95 };

export const JALANDHAR_CENTER: [number, number] = [31.326, 75.5762];

/** True for reports in Punjab: by geocoded state when present, else by bbox. */
export function isInPunjab(r: Report): boolean {
  const state = typeof r.location === 'object' ? r.location?.state : undefined;
  if (state) return /punjab/i.test(state);
  const ll = reportLatLng(r);
  if (!ll) return false;
  const [lat, lng] = ll;
  return lat >= PUNJAB_BBOX.south && lat <= PUNJAB_BBOX.north &&
         lng >= PUNJAB_BBOX.west  && lng <= PUNJAB_BBOX.east;
}

// ── Display helpers ──────────────────────────────────────────────────────────

// Pin / pill colors — shared by the map and the report card so the card and map always agree.
export const STATUS_COLORS = {
  pending:  '#ef4444',
  closed:   '#eab308',
  resolved: '#22c55e',
  archived: '#6b7280',
} as const;

export function reportColor(r: Report): string {
  if (r.status === 'resolved') return STATUS_COLORS.resolved;
  if (r.status === 'archived') return STATUS_COLORS.archived;
  if (r.sahaaya?.status === 'closed') return STATUS_COLORS.closed;
  return STATUS_COLORS.pending;
}


export function sizeLabel(t: Dict, s: ReportSize): string {
  return { small: t.report.sizeSmall, medium: t.report.sizeMedium, large: t.report.sizeLarge }[s];
}

export function categoryLabel(t: Dict, category: string): string {
  const map: Record<string, string> = {
    littering:           t.report.catLittering,
    garbage:             t.report.catLittering,
    open_dump:           t.report.catOpenDump,
    construction_debris: t.report.catConstructionDebris,
    construction:        t.report.catConstructionDebris,
    plant_waste:         t.report.catPlantWaste,
    open_burning:        t.report.catOpenBurning,
    burning:             t.report.catOpenBurning,
  };
  return map[category] ?? t.report.catOther;
}

export function statusLabel(t: Dict, r: Report): string {
  if (r.status === 'resolved') return t.report.statusResolved;
  if (r.sahaaya?.status === 'closed') return t.report.statusClosedByOfficials;
  if (r.status === 'verified') return t.report.statusVerified;
  if (r.status === 'archived') return t.report.statusArchived;
  return t.report.statusPending;
}

/** Firestore Timestamp (SDK object or plain {seconds}) → Date. */
export function toDate(ts: unknown): Date | null {
  if (!ts) return null;
  const v = ts as { toDate?: () => Date; seconds?: number };
  if (typeof v.toDate === 'function') return v.toDate();
  if (typeof v.seconds === 'number') return new Date(v.seconds * 1000);
  return null;
}

/** BCP-47 tag for date formatting per site locale. */
export const DATE_LOCALES = { en: 'en-IN', kn: 'kn-IN', hi: 'hi-IN' } as const;
