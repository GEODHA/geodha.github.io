// Live GEODHA report map for a city data page (e.g. /jalandhar).
// Clustered pins colored by status and sized by issue size; tapping a pin
// calls onReportSelect. `focus` flies the map to a report ("View on map").

import { useEffect } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import 'leaflet.markercluster';
import type { Report } from '@/services/reportsService';
import { reportLatLng, reportSize, reportColor, STATUS_COLORS } from '@/lib/reportFields';
import { OSM_TILE_URL, OSM_ATTRIBUTION, OSM_MAX_ZOOM } from '@/config/mapConfig';

const PIN_SIZES = { small: 16, medium: 20, large: 26 } as const;

function pinIcon(color: string, size: number, highlighted: boolean): L.DivIcon {
  const ring = highlighted ? 'box-shadow:0 0 0 4px #111,0 0 0 7px #FFCE2B;' : 'box-shadow:0 2px 5px rgba(0,0,0,0.35);';
  return L.divIcon({
    className: '',
    html: `<div style="width:${size}px;height:${size}px;background:${color};border:2px solid #fff;border-radius:50%;${ring}cursor:pointer;"></div>`,
    iconSize:   [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

function clusterIcon(cluster: L.MarkerCluster): L.DivIcon {
  const count  = cluster.getChildCount();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const colors = new Set(cluster.getAllChildMarkers().map((m: any) => m.options.pinColor as string));
  // Open spots dominate the cluster color so problems never hide behind green.
  const color =
    colors.has(STATUS_COLORS.pending)  ? STATUS_COLORS.pending  :
    colors.has(STATUS_COLORS.closed)   ? STATUS_COLORS.closed   :
    colors.has(STATUS_COLORS.resolved) ? STATUS_COLORS.resolved : STATUS_COLORS.archived;
  return L.divIcon({
    className: '',
    html: `<div style="width:38px;height:38px;line-height:34px;background:${color};color:#fff;border:2px solid #fff;border-radius:50%;text-align:center;font-weight:700;font-size:13px;box-shadow:0 2px 5px rgba(0,0,0,0.35);cursor:pointer;">${count}</div>`,
    iconSize: [38, 38],
  });
}

function ReportsLayer({ reports, highlightId, onReportSelect }: {
  reports: Report[];
  highlightId?: string | null;
  onReportSelect: (id: string) => void;
}) {
  const map = useMap();

  useEffect(() => {
    const group = L.markerClusterGroup({
      chunkedLoading:      true,
      spiderfyOnMaxZoom:   true,
      showCoverageOnHover: false,
      maxClusterRadius:    40,
      // Keep the focused report visible as its own pin.
      disableClusteringAtZoom: 17,
      iconCreateFunction:  clusterIcon,
    });

    for (const r of reports) {
      const ll = reportLatLng(r);
      if (!ll || !r.id) continue;
      const color = reportColor(r);
      const size  = PIN_SIZES[reportSize(r) ?? 'medium'];
      const marker = L.marker(ll, {
        icon: pinIcon(color, size, r.id === highlightId),
        pinColor: color,
        zIndexOffset: r.id === highlightId ? 1000 : 0,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);
      marker.on('click', () => onReportSelect(r.id!));
      group.addLayer(marker);
    }

    map.addLayer(group);
    return () => { map.removeLayer(group); };
  }, [map, reports, highlightId, onReportSelect]);

  return null;
}

function FocusController({ focus }: { focus: { latlng: [number, number]; key: number } | null }) {
  const map = useMap();
  useEffect(() => {
    if (focus) map.flyTo(focus.latlng, 17, { duration: 0.8 });
  }, [map, focus]);
  return null;
}

interface Props {
  center:  [number, number];
  zoom?:   number;
  reports: Report[];
  focus?:  { latlng: [number, number]; key: number } | null;
  highlightId?: string | null;
  onReportSelect: (id: string) => void;
}

const CityReportsMap = ({ center, zoom = 12, reports, focus = null, highlightId, onReportSelect }: Props) => (
  <MapContainer
    center={center}
    zoom={zoom}
    minZoom={7}
    maxZoom={19}
    scrollWheelZoom={false}
    style={{ height: '100%', width: '100%', background: '#f4f4f2' }}
  >
    <TileLayer attribution={OSM_ATTRIBUTION} url={OSM_TILE_URL} maxZoom={OSM_MAX_ZOOM} />
    <ReportsLayer reports={reports} highlightId={highlightId} onReportSelect={onReportSelect} />
    <FocusController focus={focus} />
  </MapContainer>
);

export default CityReportsMap;
