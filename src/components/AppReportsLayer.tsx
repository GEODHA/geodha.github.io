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
  /**
   * true when BBMP has marked the underlying Sahaaya complaint closed but the
   * reporting user hasn't yet confirmed the issue is actually resolved.
   * Overrides the status-based pin color to yellow (unless status is
   * already 'resolved', which stays green).
   */
  sahaayaClosed?: boolean;
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

/**
 * Resolves the display color for a pin: green once the user has verified a
 * report resolved, yellow once BBMP has closed the complaint but the user
 * hasn't confirmed yet (regardless of app-side status), otherwise falls back
 * to the plain status color (pending = red, verified = yellow, archived = gray).
 */
function pinColor(status: AppReportStatus, sahaayaClosed?: boolean): string {
  if (status === 'resolved') return APP_REPORT_STATUS_COLORS.resolved;
  if (sahaayaClosed)         return APP_REPORT_STATUS_COLORS.verified; // yellow
  return APP_REPORT_STATUS_COLORS[status] ?? APP_REPORT_STATUS_COLORS.pending;
}

function pinIcon(color: string): L.DivIcon {
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

  // Priority: red (open) > yellow (verified / closed pending confirmation) > green (resolved) > gray
  let color = APP_REPORT_STATUS_COLORS.archived;
  const colors = new Set(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    children.map((m: any) => m.options.effectiveColor as string),
  );
  if      (colors.has(APP_REPORT_STATUS_COLORS.pending))  color = APP_REPORT_STATUS_COLORS.pending;
  else if (colors.has(APP_REPORT_STATUS_COLORS.verified)) color = APP_REPORT_STATUS_COLORS.verified;
  else if (colors.has(APP_REPORT_STATUS_COLORS.resolved)) color = APP_REPORT_STATUS_COLORS.resolved;

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
      const color = pinColor(r.status, r.sahaayaClosed);
      const marker = L.marker(r.position, {
        icon:          pinIcon(color),
        pane:          APP_REPORTS_PANE,
        reportStatus:  r.status,
        effectiveColor: color, // consumed by clusterIcon for color priority
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
