// Locked preview of the city ward heatmap for the landing page.
// No zoom/pan — the whole preview links to /dashboard. Shows the same
// choropleth AND top-affected ward icons as the real dashboard.

import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, GeoJSON, Marker } from 'react-leaflet';
import type { PathOptions } from 'leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { ArrowRight, Loader2 } from 'lucide-react';

import wardBoundaries from '../../data/ward-boundaries.json';
import { outerRing, ringCentroid } from '@/lib/geo';
import { useWardStats } from '@/hooks/useWardStats';
import { computeScale, BAND } from '@/lib/severity';
import type { BandLevel } from '@/lib/severity';

// Same visual language as WardMap's ward cluster icons (kept preview-local
// so WardMap internals stay private).
const GARBAGE_MOUND_SVG = `<svg xmlns='http://www.w3.org/2000/svg' width='15' height='13' viewBox='0 0 18 16' style='display:inline-block;vertical-align:middle;margin-top:-2px;'><ellipse cx='9' cy='14.5' rx='8.5' ry='1.5' fill='#57534e'/><path d='M1.5 14.5 C2 9.5 5 7 9 6.5 C13 7 16 9.5 16.5 14.5 Z' fill='#78716c'/><line x1='6' y1='9' x2='5' y2='5' stroke='#a8a29e' stroke-width='1.2' stroke-linecap='round'/><line x1='9' y1='7' x2='9' y2='3' stroke='#a8a29e' stroke-width='1.2' stroke-linecap='round'/><line x1='12' y1='9' x2='13' y2='5' stroke='#a8a29e' stroke-width='1.2' stroke-linecap='round'/></svg>`;

function previewIcon(icons: string): L.DivIcon {
  return L.divIcon({
    html: `<div style="font-size:14px;line-height:1;white-space:nowrap;transform:translate(-50%,-50%);filter:drop-shadow(0 0 3px rgba(255,255,255,0.95)) drop-shadow(0 1px 4px rgba(0,0,0,0.75));user-select:none;">${icons}</div>`,
    className: '',
    iconSize:   [0, 0],
    iconAnchor: [0, 0],
  });
}

interface WardProps { ward_num: number; }

const DashboardPreview = () => {
  const { wardDataMap, loading } = useWardStats();

  const classify = useMemo(() => {
    const wards = Object.values(wardDataMap);
    if (wards.length === 0) return null;
    return {
      total: computeScale(wards.map((w) => w.total_reports)),
      dump:  computeScale(wards.map((w) => w.garbage_dump)),
      veh:   computeScale(wards.map((w) => w.garbage_vehicle_not_arrived)),
      burn:  computeScale(wards.map((w) => w.burning_of_garbage)),
    };
  }, [wardDataMap]);

  // Top-affected ward icons — same rules as the dashboard (band 5 per category)
  const iconMarkers = useMemo(() => {
    if (!classify) return [];
    const out: { wardNum: number; latlng: [number, number]; icons: string }[] = [];
    for (const feat of (wardBoundaries as GeoJSON.FeatureCollection).features) {
      const wNum = (feat.properties as WardProps).ward_num;
      const w = wardDataMap[wNum];
      if (!w) continue;
      const parts: string[] = [];
      if (classify.dump(w.garbage_dump)               === 5) parts.push(GARBAGE_MOUND_SVG);
      if (classify.veh(w.garbage_vehicle_not_arrived) === 5) parts.push('🚛');
      if (classify.burn(w.burning_of_garbage)         === 5) parts.push('🔥');
      if (parts.length === 0) continue;
      const ring = outerRing(feat.geometry);
      if (ring.length === 0) continue;
      out.push({ wardNum: wNum, latlng: ringCentroid(ring), icons: parts.join('') });
    }
    return out;
  }, [wardDataMap, classify]);

  const styleFeature = (feature?: GeoJSON.Feature): PathOptions => {
    const num  = (feature?.properties as WardProps | undefined)?.ward_num ?? 0;
    const ward = wardDataMap[num];
    const band = (ward && classify ? classify.total(ward.total_reports) : 0) as BandLevel;
    return {
      fillColor:   BAND[band].mapColor,
      fillOpacity: 0.65,
      color:       'rgba(255,255,255,0.7)',
      weight:      0.5,
    };
  };

  return (
    <Link
      to="/dashboard"
      onClick={() => window.scrollTo(0, 0)}
      aria-label="Open the live city dashboard"
      className="group relative block aspect-[4/3] border-[3px] border-ink rounded-2xl overflow-hidden bg-paper"
      style={{ boxShadow: 'var(--shadow-offset-4)' }}
    >
      {loading ? (
        <div className="absolute inset-0 flex items-center justify-center bg-muted">
          <Loader2 className="h-6 w-6 text-muted-foreground animate-spin" />
        </div>
      ) : (
        /* pointer-events-none locks all map interaction; the Link handles clicks */
        <div className="absolute inset-0 pointer-events-none">
          <MapContainer
            center={[12.955, 77.594]}
            zoom={11}
            zoomControl={false}
            dragging={false}
            scrollWheelZoom={false}
            doubleClickZoom={false}
            touchZoom={false}
            keyboard={false}
            attributionControl={false}
            style={{ height: '100%', width: '100%', background: '#fff' }}
          >
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png"
              subdomains={['a', 'b', 'c', 'd']}
              opacity={0.55}
            />
            <GeoJSON
              // @ts-expect-error json import typing
              data={wardBoundaries}
              style={styleFeature}
            />
            {iconMarkers.map(({ wardNum, latlng, icons }) => (
              <Marker key={wardNum} position={latlng} icon={previewIcon(icons)} interactive={false} />
            ))}
          </MapContainer>
        </div>
      )}

      {/* CTA chip — z-index above Leaflet panes (which go up to ~700) */}
      <span
        className="absolute z-[1000] bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap bg-secondary text-secondary-foreground border-[2.5px] border-ink rounded-full px-4 py-2 text-sm font-extrabold inline-flex items-center gap-2 transition-transform group-hover:-translate-y-0.5"
        style={{ boxShadow: 'var(--shadow-offset-3)' }}
      >
        Open the live dashboard <ArrowRight className="h-4 w-4" />
      </span>
    </Link>
  );
};

export default DashboardPreview;
