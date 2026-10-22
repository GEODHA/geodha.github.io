// Locked preview of the city ward map for the landing page.
// No zoom/pan — the whole preview links to /dashboard. Shows the same
// GBA wards (tinted by city corporation) and corporation outlines as the
// real dashboard.

import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';
import type { PathOptions } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { ArrowRight } from 'lucide-react';

import wardBoundaries from '../../data/gba-ward-boundaries.json';
import corporationBoundaries from '../../data/gba-corporations.json';
import type { WardBoundaryProps } from '@/lib/geo';
import { CORPORATIONS, wardTint } from '@/config/gba';
import type { CorporationId } from '@/config/gba';
import { OSM_TILE_URL, OSM_ATTRIBUTION, OSM_MAX_ZOOM } from '@/config/mapConfig';

const wardStyle = (feature?: GeoJSON.Feature): PathOptions => {
  const props = feature?.properties as WardBoundaryProps | undefined;
  return {
    fillColor:   props ? wardTint(props.corp_id, props.ward_id) : '#ddd',
    fillOpacity: 0.5,
    color:       'rgba(255,255,255,0.8)',
    weight:      0.5,
  };
};

const corporationStyle = (feature?: GeoJSON.Feature): PathOptions => {
  const id = (feature?.properties as { corp_id: CorporationId } | undefined)?.corp_id ?? 1;
  return { fill: false, color: CORPORATIONS[id].color, weight: 2, opacity: 0.95 };
};

const DashboardPreview = () => (
  <Link
    to="/dashboard"
    onClick={() => window.scrollTo(0, 0)}
    aria-label="Open the live city dashboard"
    className="group relative block aspect-[4/3] border-[3px] border-ink rounded-2xl overflow-hidden bg-paper"
    style={{ boxShadow: 'var(--shadow-offset-4)' }}
  >
    {/* pointer-events-none locks all map interaction; the Link handles clicks */}
    <div className="absolute inset-0 pointer-events-none">
      <MapContainer
        center={[12.985, 77.615]}
        zoom={10.5}
        zoomSnap={0.5}
        zoomControl={false}
        dragging={false}
        scrollWheelZoom={false}
        doubleClickZoom={false}
        touchZoom={false}
        keyboard={false}
        style={{ height: '100%', width: '100%', background: '#fff' }}
      >
        <TileLayer
          attribution={OSM_ATTRIBUTION}
          url={OSM_TILE_URL}
          maxZoom={OSM_MAX_ZOOM}
          className="tiles-muted"
          opacity={0.55}
        />
        <GeoJSON
          // @ts-expect-error json import typing
          data={wardBoundaries}
          style={wardStyle}
        />
        <GeoJSON
          // @ts-expect-error json import typing
          data={corporationBoundaries}
          style={corporationStyle}
        />
      </MapContainer>
    </div>

    {/* CTA chip — z-index above Leaflet panes (which go up to ~700) */}
    <span
      className="absolute z-[1000] bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap bg-secondary text-secondary-foreground border-[2.5px] border-ink rounded-full px-4 py-2 text-sm font-extrabold inline-flex items-center gap-2 transition-transform group-hover:-translate-y-0.5"
      style={{ boxShadow: 'var(--shadow-offset-3)' }}
    >
      Open the live dashboard <ArrowRight className="h-4 w-4" />
    </span>
  </Link>
);

export default DashboardPreview;
