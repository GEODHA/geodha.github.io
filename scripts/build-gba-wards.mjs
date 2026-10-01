#!/usr/bin/env node
/**
 * build-gba-wards.mjs
 *
 * Builds the Neighbourhood Scorecard's ward data from the GBA 369-ward
 * delimitation (December 2025) and our 198-ward BBMP boundaries.
 *
 * Input  : a GeoJSON of the 369 GBA wards. We use the GeoJSON conversion of
 *          OpenCity's "GBA Final Wards Map With Population - Dec 2025" KML
 *          published by the kaun-city/kaun project (MIT):
 *          https://github.com/kaun-city/kaun/blob/main/apps/web/public/bengaluru-gba-369.geojson
 *          Original: https://data.opencity.in/dataset/gba-wards-delimitation-2025
 *
 * Outputs:
 *   public/data/gba-369-wards.geojson  simplified boundaries (lazy-loaded)
 *   src/data/gba-wards.json            ward index + 369↔198 crosswalk (bundled)
 *
 * Usage  : node scripts/build-gba-wards.mjs path/to/bengaluru-gba-369.geojson
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const src  = process.argv[2];
if (!src) {
  console.error('Usage: node scripts/build-gba-wards.mjs <gba-369.geojson>');
  process.exit(1);
}

const gba  = JSON.parse(readFileSync(src, 'utf8'));
const bbmp = JSON.parse(readFileSync(resolve(ROOT, 'data/ward-boundaries.json'), 'utf8'));

// ── Geometry helpers ([lng, lat] coordinates) ────────────────────────────────

const polygonsOf = (g) => (g.type === 'Polygon' ? [g.coordinates] : g.coordinates);

function bboxOf(g) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const poly of polygonsOf(g)) for (const [x, y] of poly[0]) {
    if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
  }
  return [x0, y0, x1, y1];
}

function inRing(x, y, ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i], [xj, yj] = ring[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

function inGeom(x, y, g) {
  for (const poly of polygonsOf(g)) {
    if (inRing(x, y, poly[0]) && !poly.slice(1).some((h) => inRing(x, y, h))) return true;
  }
  return false;
}

// Douglas–Peucker on a ring (planar, degrees — fine at city scale).
function simplify(points, tol) {
  if (points.length <= 4) return points;
  const sq = tol * tol;
  const keep = new Uint8Array(points.length);
  keep[0] = keep[points.length - 1] = 1;
  const stack = [[0, points.length - 1]];
  while (stack.length) {
    const [a, b] = stack.pop();
    const [ax, ay] = points[a], [bx, by] = points[b];
    const dx = bx - ax, dy = by - ay, len = dx * dx + dy * dy;
    let maxD = 0, idx = -1;
    for (let i = a + 1; i < b; i++) {
      const [px, py] = points[i];
      let t = len ? ((px - ax) * dx + (py - ay) * dy) / len : 0;
      t = Math.max(0, Math.min(1, t));
      const ex = ax + t * dx - px, ey = ay + t * dy - py;
      const d = ex * ex + ey * ey;
      if (d > maxD) { maxD = d; idx = i; }
    }
    if (maxD > sq && idx > 0) { keep[idx] = 1; stack.push([a, idx], [idx, b]); }
  }
  const out = points.filter((_, i) => keep[i]);
  return out.length >= 4 ? out : points;
}

const round = (n) => Math.round(n * 1e5) / 1e5;
const simplifyGeom = (g) => {
  const polys = polygonsOf(g).map((poly) =>
    poly.map((ring) => simplify(ring, 0.00006).map(([x, y]) => [round(x), round(y)])));
  return g.type === 'Polygon' ? { type: 'Polygon', coordinates: polys[0] } : { type: 'MultiPolygon', coordinates: polys };
};

// ── 369 → 198 crosswalk by area sampling ─────────────────────────────────────

const bbmpWards = bbmp.features.map((f) => ({
  num: f.properties.ward_num, geom: f.geometry, bbox: bboxOf(f.geometry),
}));

function bbmpAt(x, y) {
  for (const w of bbmpWards) {
    const [x0, y0, x1, y1] = w.bbox;
    if (x < x0 || x > x1 || y < y0 || y > y1) continue;
    if (inGeom(x, y, w.geom)) return w.num;
  }
  return null;
}

const STEPS = 28; // grid resolution per ward bbox
const wards = gba.features.map((f) => {
  const p = f.properties;
  const [x0, y0, x1, y1] = bboxOf(f.geometry);
  const counts = new Map();
  let total = 0;
  for (let i = 0; i < STEPS; i++) for (let j = 0; j < STEPS; j++) {
    const x = x0 + ((i + 0.5) / STEPS) * (x1 - x0);
    const y = y0 + ((j + 0.5) / STEPS) * (y1 - y0);
    if (!inGeom(x, y, f.geometry)) continue;
    total++;
    const n = bbmpAt(x, y);
    if (n != null) counts.set(n, (counts.get(n) ?? 0) + 1);
  }
  const overlaps = [...counts.entries()]
    .map(([num, c]) => [num, Math.round((c / Math.max(1, total)) * 100)])
    .filter(([, pct]) => pct >= 5)
    .sort((a, b) => b[1] - a[1]);
  if (overlaps.length === 0) {
    const n = bbmpAt(p.center_lng, p.center_lat);
    if (n != null) overlaps.push([n, 100]);
  }
  return {
    id:   `${p.corporation_id}-${p.ward_no}`,
    no:   p.ward_no,
    name: p.ward_name,
    kn:   p.ward_name_kn,
    corp: p.corporation,
    zone: p.zone,
    zoneName: p.zone_name,
    ac:   p.assembly_constituency,
    pop:  p.population,
    lat:  round(p.center_lat),
    lng:  round(p.center_lng),
    // [BBMP-198 ward number, % of this GBA ward's area], largest first.
    bbmp: overlaps,
  };
}).sort((a, b) => a.corp.localeCompare(b.corp) || a.no - b.no);

// ── Write outputs ────────────────────────────────────────────────────────────

const meta = {
  boundary_system: 'gba-369-2025',
  source: 'GBA Wards Delimitation 2025 — Final Wards Map With Population (Dec 2025), via OpenCity',
  source_url: 'https://data.opencity.in/dataset/gba-wards-delimitation-2025',
  converted_by: 'kaun-city/kaun (MIT) — https://github.com/kaun-city/kaun',
  crosswalk: 'Area share of each GBA ward that falls in each BBMP-198 ward (grid sampling, ≥5% kept).',
};

mkdirSync(resolve(ROOT, 'public/data'), { recursive: true });
writeFileSync(
  resolve(ROOT, 'public/data/gba-369-wards.geojson'),
  JSON.stringify({
    type: 'FeatureCollection',
    ...meta,
    features: gba.features.map((f) => ({
      type: 'Feature',
      properties: { id: `${f.properties.corporation_id}-${f.properties.ward_no}` },
      geometry: simplifyGeom(f.geometry),
    })),
  }),
);
writeFileSync(resolve(ROOT, 'src/data/gba-wards.json'), JSON.stringify({ ...meta, wards }, null, 0) + '\n');

console.log(`Wrote ${wards.length} GBA wards; ${wards.filter((w) => w.bbmp.length === 0).length} without a BBMP match.`);
