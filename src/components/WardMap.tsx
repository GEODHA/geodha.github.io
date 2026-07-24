import { useEffect, useRef, useMemo, useState } from 'react';
import { MapContainer, TileLayer, GeoJSON, Marker, useMap } from 'react-leaflet';
import type { Layer, PathOptions } from 'leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import wardBoundaries from '../../data/ward-boundaries.json';
import { outerRing, ringCentroid, featureBounds } from '@/lib/geo';
import { computeScale, BAND } from '@/lib/severity';
import type { BandLevel } from '@/lib/severity';
import AppReportsLayer, { APP_REPORTS_PANE } from './AppReportsLayer';
import type { AppReportPin } from './AppReportsLayer';

// WardData type lives in the service layer — re-export for legacy consumers
export type { WardData } from '@/services/geodhaService';
import type { WardData } from '@/services/geodhaService';

// ── Testimonial marker type (exported for DashboardPage) ─────────────────────

export interface TestimonialMarkerInfo {
  id:         string;
  wardNum:    number;
  latlng:     [number, number];
  /** true = documented case at exact GPS; false = ward-centre fallback */
  isExact:    boolean;
  /** true = marked critical — shown with a slightly larger marker */
  isCritical: boolean;
  /** true = success story — green ✓ instead of red ! */
  isPositive: boolean;
}

// ── Internal types ────────────────────────────────────────────────────────────

interface WardFeatureProperties {
  ward_num:  number;
  ward_name: string;
  zone:      string;
}

interface DocMarker {
  wardNum:   number;
  latlng:    [number, number];
  icons:     string;
}

interface Props {
  wardDataMap:         Record<number, WardData>;
  selectedWard:        number | null;
  onWardSelect:        (wardNum: number, data: WardData, zone: string) => void;
  zoomToWard?:         number | null;
  testimonialMarkers?: TestimonialMarkerInfo[];
  /** Live GEODHA app reports — shown as pins when zoomed into a ward. */
  appReports?:         AppReportPin[];
  onReportSelect?:     (reportId: string) => void;
  /**
   * 'stats' (default) — full choropleth + zoom crossfade between ward-level
   * problem icons and app-report pins, exactly as today.
   * 'reports' — simplified view: ward outlines only (no fill), no problem
   * icons, no testimonial badges, no zoom-driven crossfade — app-report pins
   * are just always visible. Mirrors the pre-merge /map page.
   */
  mode?: 'stats' | 'reports';
}

// ── Zoom crossfade (ward icons ⇄ app report pins) ────────────────────────────
// t = 0 → city view: ward icons fully visible, app reports hidden.
// t = 1 → ward view: app reports fully visible, ward icons hidden.
// Between CROSSFADE_START and CROSSFADE_END both layers are partially visible.

const WARD_ICONS_PANE  = 'ward-icons';
const CROSSFADE_START  = 13;
const CROSSFADE_END    = 14.5;

function crossfadeT(zoom: number): number {
  return Math.min(1, Math.max(0, (zoom - CROSSFADE_START) / (CROSSFADE_END - CROSSFADE_START)));
}

/**
 * Creates the two crossfade panes and drives their opacity from the zoom
 * level. Rendered as the FIRST child of MapContainer so the panes exist
 * before any marker that targets them is added.
 */
function MapSetup({ onReady, onCrossfade, crossfadeEnabled = true }: {
  onReady:           () => void;
  onCrossfade?:      (t: number) => void;
  /** false in 'reports' mode — app-report pins are just always shown. */
  crossfadeEnabled?: boolean;
}) {
  const map = useMap();

  useEffect(() => {
    const wardPane   = map.getPane(WARD_ICONS_PANE)  ?? map.createPane(WARD_ICONS_PANE);
    const reportPane = map.getPane(APP_REPORTS_PANE) ?? map.createPane(APP_REPORTS_PANE);
    wardPane.style.zIndex   = '620';
    reportPane.style.zIndex = '640';

    if (!crossfadeEnabled) {
      // Reports-only mode: no ward icons are ever rendered into wardPane, and
      // app-report pins should always be fully visible — skip the zoom-driven
      // opacity logic entirely.
      wardPane.style.opacity      = '0';
      wardPane.style.visibility   = 'hidden';
      reportPane.style.opacity    = '1';
      reportPane.style.visibility = 'visible';
      onReady();
      return;
    }

    for (const pane of [wardPane, reportPane]) {
      pane.style.transition = 'opacity 300ms ease, visibility 300ms ease';
    }

    const apply = () => {
      const t = crossfadeT(map.getZoom());
      wardPane.style.opacity      = String(1 - t);
      wardPane.style.visibility   = t >= 1 ? 'hidden' : 'visible';
      reportPane.style.opacity    = String(t);
      reportPane.style.visibility = t <= 0 ? 'hidden' : 'visible';
      onCrossfade?.(t);
    };

    apply();
    map.on('zoomend', apply);
    onReady();
    return () => { map.off('zoomend', apply); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, crossfadeEnabled]);

  return null;
}

// ── Icon HTML ─────────────────────────────────────────────────────────────────

const GARBAGE_MOUND_SVG = `<svg xmlns='http://www.w3.org/2000/svg' width='18' height='16' viewBox='0 0 18 16' style='display:inline-block;vertical-align:middle;margin-top:-2px;'><ellipse cx='9' cy='14.5' rx='8.5' ry='1.5' fill='#57534e'/><path d='M1.5 14.5 C2 9.5 5 7 9 6.5 C13 7 16 9.5 16.5 14.5 Z' fill='#78716c'/><line x1='6' y1='9' x2='5' y2='5' stroke='#a8a29e' stroke-width='1.2' stroke-linecap='round'/><line x1='9' y1='7' x2='9' y2='3' stroke='#a8a29e' stroke-width='1.2' stroke-linecap='round'/><line x1='12' y1='9' x2='13' y2='5' stroke='#a8a29e' stroke-width='1.2' stroke-linecap='round'/></svg>`;


/** Shared sizing constants so negative and positive markers are identical in size. */
function markerSizes(isCritical: boolean) {
  return {
    size:     isCritical ? 28 : 22,
    fontSize: isCritical ? 15 : 13,
    border:   isCritical ? '2.5px solid rgba(255,255,255,0.95)' : '2px solid rgba(255,255,255,0.9)',
    shadow:   isCritical ? '0 3px 8px rgba(0,0,0,0.65)' : '0 2px 6px rgba(0,0,0,0.55)',
  };
}

/** Inline red ! badge — negative/problem testimonial in the ward cluster. */
function makeTestimonialInlineBadge(isCritical: boolean): string {
  const { size, fontSize, border, shadow } = markerSizes(isCritical);
  return `<span style="display:inline-flex;align-items:center;justify-content:center;width:${size}px;height:${size}px;border-radius:50%;background:#991b1b;border:${border};box-shadow:${shadow};font-size:${fontSize}px;font-weight:900;color:#fff;font-family:sans-serif;vertical-align:middle;margin-left:2px;">!</span>`;
}

/** Inline green ✓ badge — success story / positive testimonial in the ward cluster. */
function makePositiveInlineBadge(isCritical: boolean): string {
  const { size, fontSize, border, shadow } = markerSizes(isCritical);
  return `<span style="display:inline-flex;align-items:center;justify-content:center;width:${size}px;height:${size}px;border-radius:50%;background:#15803d;border:${border};box-shadow:${shadow};font-size:${fontSize}px;font-weight:900;color:#fff;font-family:sans-serif;vertical-align:middle;margin-left:2px;">✓</span>`;
}

/** Ward problem icon cluster (critical-band categories + optional testimonial badge). */
function makeProblemIcon(icons: string): L.DivIcon {
  return L.divIcon({
    html: `<div style="font-size:17px;line-height:1;white-space:nowrap;transform:translate(-50%,-50%);filter:drop-shadow(0 0 3px rgba(255,255,255,0.95)) drop-shadow(0 1px 4px rgba(0,0,0,0.75));cursor:pointer;user-select:none;pointer-events:auto;">${icons}</div>`,
    className: '',
    iconSize:    [0, 0],
    iconAnchor:  [0, 0],
    popupAnchor: [0, -20],
  });
}

/** Solid dark-red ! pin — negative/problem documented case at exact GPS. */
function makeTestimonialExactIcon(isCritical: boolean): L.DivIcon {
  const { size, fontSize, border, shadow } = markerSizes(isCritical);
  return L.divIcon({
    html: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:#991b1b;border:${border};box-shadow:${shadow};display:flex;align-items:center;justify-content:center;font-size:${fontSize}px;font-weight:900;color:#fff;font-family:sans-serif;transform:translate(-50%,-50%);cursor:pointer;user-select:none;">!</div>`,
    className: '',
    iconSize:    [0, 0],
    iconAnchor:  [0, 0],
    popupAnchor: [0, -14],
  });
}

/** Solid green ✓ pin — success story / positive case at exact GPS. */
function makePositiveExactIcon(isCritical: boolean): L.DivIcon {
  const { size, fontSize, border, shadow } = markerSizes(isCritical);
  return L.divIcon({
    html: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:#15803d;border:${border};box-shadow:${shadow};display:flex;align-items:center;justify-content:center;font-size:${fontSize}px;font-weight:900;color:#fff;font-family:sans-serif;transform:translate(-50%,-50%);cursor:pointer;user-select:none;">✓</div>`,
    className: '',
    iconSize:    [0, 0],
    iconAnchor:  [0, 0],
    popupAnchor: [0, -14],
  });
}

// ── ZoomController ────────────────────────────────────────────────────────────

function ZoomController({ wardNum }: { wardNum: number }) {
  const map = useMap();
  useEffect(() => {
    const feat = (wardBoundaries as GeoJSON.FeatureCollection).features.find(
      (f) => (f.properties as WardFeatureProperties).ward_num === wardNum
    );
    if (!feat) return;
    const bounds = featureBounds(feat.geometry);
    if (bounds) map.flyToBounds(bounds, { padding: [50, 50], duration: 0.6 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wardNum]);
  return null;
}

// ── Component ─────────────────────────────────────────────────────────────────

const WardMap = ({ wardDataMap, selectedWard, onWardSelect, zoomToWard, testimonialMarkers = [], appReports = [], onReportSelect, mode = 'stats' }: Props) => {
  const reportsOnly = mode === 'reports';
  const geoJsonRef = useRef<L.GeoJSON | null>(null);

  // Crossfade state — panes must exist before pane-targeted markers render.
  const [panesReady, setPanesReady] = useState(false);
  const [fadeT,      setFadeT]      = useState(0);

  const allWards = useMemo(() => Object.values(wardDataMap), [wardDataMap]);

  // Percentile scales derived from live data
  const classify = useMemo(() => ({
    total: computeScale(allWards.map((w) => w.total_reports)),
    dump:  computeScale(allWards.map((w) => w.garbage_dump)),
    veh:   computeScale(allWards.map((w) => w.garbage_vehicle_not_arrived)),
    burn:  computeScale(allWards.map((w) => w.burning_of_garbage)),
  }), [allWards]);

  // Non-exact testimonials → merged into the ward cluster icon as inline badges.
  // Separate maps for negative (red !) and positive (green ✓).
  // Map value = isCritical: true if any entry for that ward is critical.
  const { centreNegWards, centrePosWards } = useMemo(() => {
    const neg = new Map<number, boolean>();
    const pos = new Map<number, boolean>();
    for (const t of testimonialMarkers.filter((mk) => !mk.isExact)) {
      if (t.isPositive) {
        pos.set(t.wardNum, (pos.get(t.wardNum) ?? false) || t.isCritical);
      } else {
        neg.set(t.wardNum, (neg.get(t.wardNum) ?? false) || t.isCritical);
      }
    }
    return { centreNegWards: neg, centrePosWards: pos };
  }, [testimonialMarkers]);

  // Ward cluster markers: critical-band problem icons + inline testimonial badges.
  const docMarkers = useMemo<DocMarker[]>(() => {
    const out: DocMarker[] = [];
    for (const feat of (wardBoundaries as GeoJSON.FeatureCollection).features) {
      const wNum = (feat.properties as WardFeatureProperties).ward_num;
      const w    = wardDataMap[wNum];

      const parts: string[] = [];
      if (w) {
        if (classify.dump(w.garbage_dump)               === 5) parts.push(GARBAGE_MOUND_SVG);
        if (classify.veh(w.garbage_vehicle_not_arrived) === 5) parts.push('🚛');
        if (classify.burn(w.burning_of_garbage)         === 5) parts.push('🔥');
      }
      if (centreNegWards.has(wNum)) parts.push(makeTestimonialInlineBadge(centreNegWards.get(wNum)!));
      if (centrePosWards.has(wNum)) parts.push(makePositiveInlineBadge(centrePosWards.get(wNum)!));

      if (parts.length === 0) continue;

      const ring = outerRing(feat.geometry);
      if (ring.length === 0) continue;
      out.push({ wardNum: wNum, latlng: ringCentroid(ring), icons: parts.join('') });
    }
    return out;
  }, [wardDataMap, classify, centreNegWards, centrePosWards]);

  // GeoJSON styling
  const styleFeature = (feature?: GeoJSON.Feature): PathOptions => {
    if (reportsOnly) {
      // Ward outlines only — no fill, no severity coloring.
      return {
        fillOpacity: 0,
        color:       'rgba(26,26,20,0.4)',
        weight:      1,
      };
    }
    const props      = feature?.properties as WardFeatureProperties | undefined;
    const num        = props?.ward_num ?? 0;
    const ward       = wardDataMap[num];
    const band       = (ward ? classify.total(ward.total_reports) : 0) as BandLevel;
    const isSelected = num === selectedWard;
    // Lighten the choropleth as the user zooms in so app-report pins sit on
    // readable streets (fadeT: 0 = city view, 1 = ward view).
    return {
      fillColor:   BAND[band].mapColor,
      fillOpacity: (isSelected ? 0.88 : 0.60) * (1 - 0.6 * fadeT),
      color:       isSelected ? '#1a1a1a' : 'rgba(255,255,255,0.7)',
      weight:      isSelected ? 2 : 0.5,
    };
  };

  const onEachFeature = (feature: GeoJSON.Feature, layer: Layer) => {
    // Reports-only mode: outlines are visual context only — no tooltip/click.
    if (reportsOnly) return;
    const props = feature.properties as WardFeatureProperties;
    const num   = props.ward_num;
    const ward  = wardDataMap[num];
    const band  = (ward ? classify.total(ward.total_reports) : 0) as BandLevel;
    const cfg   = BAND[band];

    layer.bindTooltip(
      `<div style="font-family:'Archivo',sans-serif;">
         <div style="font-size:14px;font-weight:700;">${props.ward_name}</div>
         <span style="background:${cfg.badgeBg};color:${cfg.badgeFg};font-size:11px;font-weight:700;padding:1px 8px;border-radius:999px;">${cfg.label}</span>
       </div>`,
      { sticky: true, opacity: 0.96 },
    );

    layer.on('click', (e) => {
      if (ward) onWardSelect(num, ward, props.zone ?? '');
      const poly = layer as L.Polygon;
      if (poly.getBounds) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const map = (e as any).target._map as L.Map | undefined;
        map?.flyToBounds(poly.getBounds(), { padding: [50, 50], duration: 0.6 });
      }
    });
  };

  // Re-style on selection or crossfade change
  useEffect(() => {
    geoJsonRef.current?.setStyle((f) => styleFeature(f));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedWard, fadeT]);

  return (
    <MapContainer
      center={[12.97, 77.594]}
      zoom={11}
      minZoom={10}
      maxZoom={18}
      maxBounds={[[12.68, 77.30], [13.20, 77.90]]}
      maxBoundsViscosity={0.9}
      style={{ height: '100%', width: '100%', background: '#fff' }}
      zoomControl={true}
    >
      <TileLayer
        attribution='© <a href="https://carto.com/attributions">CARTO</a> © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png"
        subdomains={['a','b','c','d']}
        opacity={0.55}
      />

      {/* Panes + zoom crossfade driver — must precede pane-targeted markers */}
      <MapSetup onReady={() => setPanesReady(true)} onCrossfade={setFadeT} crossfadeEnabled={!reportsOnly} />

      {zoomToWard != null && <ZoomController wardNum={zoomToWard} />}

      {/* Ward choropleth */}
      <GeoJSON
        // @ts-expect-error json import typing
        data={wardBoundaries}
        style={styleFeature}
        onEachFeature={onEachFeature}
        ref={(r) => { if (r) geoJsonRef.current = r; }}
      />

      {/* Ward cluster markers: problem icons + testimonial badge (merged).
          Rendered in the ward-icons pane so they fade out on zoom-in.
          Hidden entirely in reports-only mode. */}
      {!reportsOnly && panesReady && docMarkers.map(({ wardNum, latlng, icons }) => (
        <Marker
          key={`prob-${wardNum}`}
          position={latlng}
          icon={makeProblemIcon(icons)}
          pane={WARD_ICONS_PANE}
          zIndexOffset={800}
          eventHandlers={{
            click: () => {
              const w = wardDataMap[wardNum];
              if (w) {
                const feat = (wardBoundaries as GeoJSON.FeatureCollection).features.find(
                  (f) => (f.properties as WardFeatureProperties).ward_num === wardNum
                );
                const zone = (feat?.properties as WardFeatureProperties | undefined)?.zone ?? '';
                onWardSelect(wardNum, w, zone);
              }
            },
          }}
        />
      ))}

      {/* Exact-location markers — negative (red !) and positive (green ✓).
          Same pane as the ward icons so (a) zIndexOffset stacks them ON TOP of
          the top-affected icon clusters, and (b) they crossfade out together
          when zooming into app-report view. Hidden in reports-only mode. */}
      {!reportsOnly && panesReady && testimonialMarkers.filter((m) => m.isExact).map((m) => (
        <Marker
          key={`te-${m.id}`}
          position={m.latlng}
          icon={m.isPositive ? makePositiveExactIcon(m.isCritical) : makeTestimonialExactIcon(m.isCritical)}
          pane={WARD_ICONS_PANE}
          zIndexOffset={950}
          eventHandlers={{
            click: () => {
              const w = wardDataMap[m.wardNum];
              if (w) {
                const feat = (wardBoundaries as GeoJSON.FeatureCollection).features.find(
                  (f) => (f.properties as WardFeatureProperties).ward_num === m.wardNum
                );
                const zone = (feat?.properties as WardFeatureProperties | undefined)?.zone ?? '';
                onWardSelect(m.wardNum, w, zone);
              }
            },
          }}
        />
      ))}

      {/* Live GEODHA app reports — fade in as the user zooms into a ward */}
      {panesReady && appReports.length > 0 && (
        <AppReportsLayer reports={appReports} onReportSelect={onReportSelect} />
      )}
    </MapContainer>
  );
};

export default WardMap;
