// Ward identity helpers for the Neighbourhood Scorecard.
//
// Bengaluru currently has two ward systems in use:
//   • BBMP-198 (2010) — what complaint data, ward marshals and our map use.
//   • GBA-369 (2025)  — five city corporations; what new offices follow.
// src/data/gba-wards.json (built by scripts/build-gba-wards.mjs) carries the
// 369-ward index plus an area-based crosswalk to the 198 wards.

import gbaData from '@/data/gba-wards.json';
import { WARD_FEATURES, pointInRing } from '@/lib/geo';

export type CorporationKey = 'Central' | 'East' | 'North' | 'South' | 'West';

export interface GbaWard {
  id:       string;          // "<corporation_id>-<ward_no>" — unique across corporations
  no:       number;          // ward number within its corporation
  name:     string;
  kn:       string;          // Kannada name
  corp:     CorporationKey;
  zone:     string;          // "Zone1" | "Zone2" within the corporation
  zoneName: string;
  ac:       string;          // assembly constituency
  pop:      number;
  lat:      number;
  lng:      number;
  bbmp:     [number, number][]; // [BBMP-198 ward, % of this ward's area]
}

export interface BbmpWard {
  num:  number;
  name: string;
  zone: string;
}

export const GBA_WARDS = (gbaData as unknown as { wards: GbaWard[] }).wards;
export const GBA_SOURCE_URL = (gbaData as { source_url: string }).source_url;

export const GBA_BY_ID: Record<string, GbaWard> =
  Object.fromEntries(GBA_WARDS.map((w) => [w.id, w]));

export const BBMP_WARDS: BbmpWard[] = WARD_FEATURES
  .map((f) => ({ num: f.properties.ward_num, name: f.properties.ward_name, zone: f.properties.zone ?? '' }))
  .sort((a, b) => a.num - b.num);

export const BBMP_BY_NUM: Record<number, BbmpWard> =
  Object.fromEntries(BBMP_WARDS.map((w) => [w.num, w]));

/** GBA wards overlapping a BBMP-198 ward, largest overlap first. */
export function gbaWardsForBbmp(num: number): { ward: GbaWard; pct: number }[] {
  return GBA_WARDS
    .map((w) => ({ ward: w, pct: w.bbmp.find(([n]) => n === num)?.[1] ?? 0 }))
    .filter((x) => x.pct > 0)
    .sort((a, b) => b.pct - a.pct);
}

// ── Search ────────────────────────────────────────────────────────────────────

export type WardHit =
  | { kind: 'bbmp'; ward: BbmpWard; score: number }
  | { kind: 'gba';  ward: GbaWard;  score: number };

const norm = (s: string) => s.toLowerCase().normalize('NFKD').replace(/[^a-z0-9ಀ-೿ ]/g, ' ').replace(/\s+/g, ' ').trim();

// Consonant skeleton — tolerates spelling variants like Koramangala/Kormangala,
// Hosur/Hosuru or doubled letters across the two ward lists.
const skeleton = (s: string) => s.replace(/[aeiouy ]/g, '').replace(/(.)\1+/g, '$1');

function score(name: string, q: string): number {
  const n = norm(name);
  if (n === q) return 100;
  if (n.startsWith(q)) return 80;
  if (n.split(' ').some((part) => part.startsWith(q))) return 60;
  if (n.includes(q)) return 40;
  if (q.length >= 4 && skeleton(q).length >= 3 && skeleton(n).includes(skeleton(q))) return 30;
  return 0;
}

/** Name search across both ward lists (also matches "ward 12" / "12"). */
export function searchWards(query: string, list: 'all' | 'bbmp' | 'gba' = 'all', max = 12): WardHit[] {
  const q = norm(query);
  if (!q) return [];
  const numMatch = q.match(/^(?:ward )?(\d{1,3})$/);
  const hits: WardHit[] = [];

  if (list !== 'gba') {
    for (const w of BBMP_WARDS) {
      const s = numMatch ? (w.num === +numMatch[1] ? 90 : 0) : score(w.name, q);
      if (s > 0) hits.push({ kind: 'bbmp', ward: w, score: s });
    }
  }
  if (list !== 'bbmp') {
    for (const w of GBA_WARDS) {
      const s = numMatch
        ? (w.no === +numMatch[1] ? 85 : 0)
        : Math.max(score(w.name, q), score(w.kn, q), score(w.ac, q) * 0.5);
      if (s > 0) hits.push({ kind: 'gba', ward: w, score: s });
    }
  }
  return hits.sort((a, b) => b.score - a.score || a.ward.name.localeCompare(b.ward.name)).slice(0, max);
}

// ── Point → GBA ward (boundaries are lazy-loaded; ~440 KB) ───────────────────

type GbaFeature = GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon, { id: string }>;
let gbaGeoPromise: Promise<Record<string, GeoJSON.Polygon | GeoJSON.MultiPolygon>> | null = null;

export function loadGbaGeometries() {
  gbaGeoPromise ??= fetch('/data/gba-369-wards.geojson')
    .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
    .then((fc: GeoJSON.FeatureCollection) =>
      Object.fromEntries((fc.features as GbaFeature[]).map((f) => [f.properties.id, f.geometry])))
    .catch((err) => { gbaGeoPromise = null; throw err; });
  return gbaGeoPromise;
}

function inGeometry(lat: number, lng: number, g: GeoJSON.Polygon | GeoJSON.MultiPolygon): boolean {
  const polys = g.type === 'Polygon' ? [g.coordinates] : g.coordinates;
  return polys.some((p) => pointInRing(lat, lng, p[0] as number[][]));
}

export async function findGbaWardForPoint(lat: number, lng: number): Promise<GbaWard | null> {
  const geoms = await loadGbaGeometries();
  for (const [id, g] of Object.entries(geoms)) {
    if (inGeometry(lat, lng, g)) return GBA_BY_ID[id] ?? null;
  }
  return null;
}

/** Rough Bengaluru bounding box (same as the dashboard's locate-me check). */
export const isInBengaluru = (lat: number, lng: number) =>
  lat >= 12.68 && lat <= 13.2 && lng >= 77.3 && lng <= 77.9;
