// AppReportsLayer — live GEODHA app report pins, rendered inside WardMap.
//
// Pins live in the dedicated `app-reports` map pane so the whole layer can be
// crossfaded against the ward-level icons by zoom level (see MapSetup in
// WardMap.tsx). Markers are clustered with leaflet.markercluster and colored
// by report status (pending / verified / resolved / archived).

import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import 'leaflet.markercluster';

// ── Public types / constants ──────────────────────────────────────────────────

export type AppReportStatus = 'pending' | 'verified' | 'resolved' | 'archived';

export interface AppReportPin {
  id:       string;
  position: [number, number];
  title:    string;
  category: string;
  status:   AppReportStatus;
}

/** Pane that holds app-report pins + their clusters (crossfaded by zoom). */
export const APP_REPORTS_PANE = 'app-reports';

export const APP_REPORT_STATUS_COLORS: Record<AppReportStatus, string> = {
  pending:  '#ef4444', // red
  verified: '#eab308', // yellow
  resolved: '#22c55e', // green
  archived: '#6b7280', // gray
};

// ── Icons ─────────────────────────────────────────────────────────────────────

function pinIcon(status: AppReportStatus): L.DivIcon {
  const color = APP_REPORT_STATUS_COLORS[status];
  const size  = 22;
  return L.divIcon({
    className: '',
    html: `<div style="width:${size}px;height:${size}px;background:${color};border:2px solid #fff;border-radius:50%;box-shadow:0 2px 5px rgba(0,0,0,0.35);cursor:pointer;"></div>`,
    iconSize:   [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

function clusterIcon(cluster: L.MarkerCluster): L.DivIcon {
  const count    = cluster.getChildCount();
  const children = cluster.getAllChildMarkers();

  // Priority: pending (red) > verified (yellow) > resolved (green) > gray
  let color = APP_REPORT_STATUS_COLORS.archived;
  const statuses = new Set(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    children.map((m: any) => m.options.reportStatus as AppReportStatus),
  );
  if      (statuses.has('pending'))  color = APP_REPORT_STATUS_COLORS.pending;
  else if (statuses.has('verified')) color = APP_REPORT_STATUS_COLORS.verified;
  else if (statuses.has('resolved')) color = APP_REPORT_STATUS_COLORS.resolved;

  return L.divIcon({
    className: '',
    html: `<div style="width:38px;height:38px;line-height:34px;background:${color};color:#fff;border:2px solid #fff;border-radius:50%;text-align:center;font-weight:700;font-size:13px;box-shadow:0 2px 5px rgba(0,0,0,0.35);cursor:pointer;">${count}</div>`,
    iconSize: [38, 38],
  });
}

// ── Layer component ───────────────────────────────────────────────────────────

interface Props {
  reports:        AppReportPin[];
  onReportSelect?: (reportId: string) => void;
}

const AppReportsLayer = ({ reports, onReportSelect }: Props) => {
  const map = useMap();

  useEffect(() => {
    if (reports.length === 0) return;

    const group = L.markerClusterGroup({
      clusterPane:          APP_REPORTS_PANE,
      chunkedLoading:       true,
      spiderfyOnMaxZoom:    true,
      showCoverageOnHover:  false,
      zoomToBoundsOnClick:  true,
      maxClusterRadius:     45,
      iconCreateFunction:   clusterIcon,
    });

    for (const r of reports) {
      const marker = L.marker(r.position, {
        icon:         pinIcon(r.status),
        pane:         APP_REPORTS_PANE,
        reportStatus: r.status, // consumed by clusterIcon for color priority
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);
      marker.on('click', () => onReportSelect?.(r.id));
      group.addLayer(marker);
    }

    map.addLayer(group);
    return () => { map.removeLayer(group); };
  }, [map, reports, onReportSelect]);

  return null;
};

export default AppReportsLayer;
