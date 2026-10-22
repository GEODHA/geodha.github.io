// Shared ward-boundary geometry helpers.
// Single source of truth for logic previously duplicated between
// WardMap.tsx and DashboardPage.tsx.
//
// Boundaries are the GBA 369-ward delimitation (see src/config/gba.ts).
// `ward_num` is a site-wide key (1–369, ordered by corporation then ward id);
// `ward_id` is the official number within its corporation.

import L from 'leaflet';
import wardBoundaries from '../../data/gba-ward-boundaries.json';
import legacyCentroids from '../../data/legacy-bbmp-ward-centroids.json';
import { CORPORATIONS } from '@/config/gba';
import type { CorporationId } from '@/config/gba';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface WardBoundaryProps {
  ward_num:     number;
  corp_id:      CorporationId;
  corporation:  string;
  ward_id:      number;
  ward_name:    string;
  ward_name_kn: string;
  zone:         string;
  population:   number | null;
}

export type WardBoundaryFeature = GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon, WardBoundaryProps>;

export const WARD_FEATURES =
  (wardBoundaries as GeoJSON.FeatureCollection).features as WardBoundaryFeature[];

// ── Ring / polygon helpers ────────────────────────────────────────────────────

/** Largest outer ring of a Polygon/MultiPolygon (coords as [lng, lat]). */
export function outerRing(geometry: GeoJSON.Geometry): number[][] {
  if (geometry.type === 'Polygon') return geometry.coordinates[0] as number[][];
  if (geometry.type === 'MultiPolygon') {
    const polys = geometry.coordinates as number[][][][];
    const best  = polys.reduce((a, b) => (a[0].length >= b[0].length ? a : b));
    return best[0] as number[][];
  }
  return [];
}

/** Average-of-vertices centroid of a ring → [lat, lng]. */
export function ringCentroid(ring: number[][]): [number, number] {
  let sumLon = 0, sumLat = 0;
  for (const [lon, lat] of ring) { sumLon += lon; sumLat += lat; }
  return [sumLat / ring.length, sumLon / ring.length];
}

/** Leaflet bounds of a Polygon/MultiPolygon feature geometry. */
export function featureBounds(geometry: GeoJSON.Geometry): L.LatLngBounds | null {
  let pts: number[][] = [];
  if (geometry.type === 'Polygon') pts = geometry.coordinates[0] as number[][];
  else if (geometry.type === 'MultiPolygon') {
    for (const poly of geometry.coordinates as number[][][][]) pts = pts.concat(poly[0] as number[][]);
  }
  if (pts.length === 0) return null;
  const lats = pts.map(([, lat]) => lat);
  const lons = pts.map(([lon])   => lon);
  return L.latLngBounds([[Math.min(...lats), Math.min(...lons)], [Math.max(...lats), Math.max(...lons)]]);
}

// ── Point-in-polygon (ray casting) ────────────────────────────────────────────

export function pointInRing(lat: number, lng: number, ring: number[][]): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i]; // [lng, lat]
    const [xj, yj] = ring[j];
    const intersect = ((yi > lat) !== (yj > lat)) &&
      (lng < (xj - xi) * (lat - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

/** Ward number containing the given point, or null. */
export function findWardForPoint(lat: number, lng: number): number | null {
  for (const feat of WARD_FEATURES) {
    const geom = feat.geometry;
    if (geom.type === 'Polygon') {
      if (pointInRing(lat, lng, geom.coordinates[0] as number[][])) return feat.properties.ward_num;
    } else if (geom.type === 'MultiPolygon') {
      for (const poly of geom.coordinates as number[][][][]) {
        if (pointInRing(lat, lng, poly[0])) return feat.properties.ward_num;
      }
    }
  }
  return null;
}

// ── Precomputed lookups ───────────────────────────────────────────────────────

export const { WARD_PROPS, WARD_CENTROIDS } = (() => {
  const props:     Record<number, WardBoundaryProps> = {};
  const centroids: Record<number, [number, number]>  = {};
  for (const f of WARD_FEATURES) {
    props[f.properties.ward_num]     = f.properties;
    centroids[f.properties.ward_num] = ringCentroid(outerRing(f.geometry));
  }
  return { WARD_PROPS: props, WARD_CENTROIDS: centroids };
})();

/** "Ward 25 · Bengaluru West City Corporation" style subtitle. */
export function wardSubtitle(wardNum: number): string {
  const p = WARD_PROPS[wardNum];
  if (!p) return '';
  return `Ward ${p.ward_id} · ${CORPORATIONS[p.corp_id].name}`;
}

// ── Legacy BBMP (198-ward) numbering ──────────────────────────────────────────
// Testimonials written before the GBA switch carry a BBMP ward_num. We assign
// them to the GBA ward containing the old ward's centroid.

interface LegacyWard { name: string; centroid: [number, number]; gba_ward_num: number | null }
const LEGACY = (legacyCentroids as unknown as { wards: Record<string, LegacyWard> }).wards;

export function legacyToGbaWard(bbmpWardNum: number): number | null {
  return LEGACY[bbmpWardNum]?.gba_ward_num ?? null;
}
