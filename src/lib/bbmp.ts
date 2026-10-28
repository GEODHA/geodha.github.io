// Former BBMP 198-ward boundaries, shown on the dashboard map as an optional
// layer next to the GBA 369 wards. The GeoJSON (~800 KB) is loaded on demand,
// the first time someone switches to the BBMP map.

import { pointInRing } from '@/lib/geo';

export interface BbmpWardProps {
  ward_num:  number;
  ward_name: string;
  zone:      string;
}

export type BbmpWardFeature = GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon, BbmpWardProps>;

export const BBMP_WARD_COUNT = 198;

/** One colour per BBMP zone — used for ward tints and the legend. */
export const BBMP_ZONE_COLORS: Record<string, string> = {
  'East':                '#1f8f86',
  'West':                '#9a4b3c',
  'South':               '#a68e2d',
  'Mahadevapura':        '#5470b8',
  'Bommanahalli':        '#c04d97',
  'Rajarajeswari Nagar': '#6b8e23',
  'Yelahanka':           '#d9762b',
  'Dasarahalli':         '#7a5cb8',
};

const FALLBACK_ZONE_COLOR = '#888888';

export const bbmpZoneColor = (zone: string) => BBMP_ZONE_COLORS[zone] ?? FALLBACK_ZONE_COLOR;

function mixWithWhite(hex: string, t: number): string {
  const n = parseInt(hex.slice(1), 16);
  const ch = (shift: number) => Math.round(((n >> shift) & 255) * (1 - t) + 255 * t);
  return `rgb(${ch(16)},${ch(8)},${ch(0)})`;
}

/** Light, per-ward tint of the zone colour (same scheme as GBA's wardTint). */
export function bbmpWardTint(zone: string, wardNum: number): string {
  const step = (wardNum * 5) % 7;
  return mixWithWhite(bbmpZoneColor(zone), 0.25 + step * 0.08);
}

let cache: Promise<BbmpWardFeature[]> | null = null;

/** Loads the 198 ward features once per page load. */
export function loadBbmpWards(): Promise<BbmpWardFeature[]> {
  cache ??= import('../../data/bbmp-ward-boundaries.json')
    .then((m) => (m.default as unknown as GeoJSON.FeatureCollection).features as BbmpWardFeature[])
    .catch((err) => { cache = null; throw err; });
  return cache;
}

/** BBMP ward containing the point, or null. */
export function findBbmpWardForPoint(features: BbmpWardFeature[], lat: number, lng: number): number | null {
  for (const f of features) {
    const g = f.geometry;
    const polys = g.type === 'Polygon' ? [g.coordinates] : g.coordinates;
    if ((polys as number[][][][]).some((poly) => pointInRing(lat, lng, poly[0]))) return f.properties.ward_num;
  }
  return null;
}
