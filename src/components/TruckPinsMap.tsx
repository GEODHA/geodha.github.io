// Interactive wet waste pickup map for the newest published day: the ward
// outline (dashed dark blue) and one dot per resident's answer — green for
// collected, red for missed, with a thin red ring when missed `streakDays`+
// days in a row. Tapping a dot shows its label, status and missed-day run.
//
// Positions are rounded (~11 m), so several residents can share a point.
// Coincident dots are fanned out by a fixed pixel offset around their shared
// position, so each stays visible and tappable at every zoom level.

import { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Polygon, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import MapFitLimit from './MapFitLimit';
import type { TruckMapPins } from '@/services/geodhaService';
import { OSM_TILE_URL, OSM_ATTRIBUTION, OSM_MAX_ZOOM } from '@/config/mapConfig';

export const TRUCK_PIN_COLORS = {
  collected: '#16a34a',
  missed:    '#dc2626',
  boundary:  '#1e3a8a',
} as const;

const DOT = 14;   // dot diameter, px
const RING = 24;  // ring diameter for long-missed dots, px

export interface TruckPinsMapLabels {
  collected: string;
  missed:    string;
  daysInARow: (n: number) => string;
}

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));

function dotIcon(color: string, ringed: boolean, dx: number, dy: number): L.DivIcon {
  const size = ringed ? RING : DOT;
  const dot  = `<div style="width:${DOT}px;height:${DOT}px;background:${color};border:2px solid #fff;border-radius:50%;box-shadow:0 1px 3px rgba(0,0,0,0.4);box-sizing:border-box;"></div>`;
  const html = ringed
    ? `<div style="width:${RING}px;height:${RING}px;border:2px solid ${TRUCK_PIN_COLORS.missed};border-radius:50%;display:flex;align-items:center;justify-content:center;box-sizing:border-box;background:rgba(255,255,255,0.6);cursor:pointer;">${dot}</div>`
    : `<div style="cursor:pointer;">${dot}</div>`;
  return L.divIcon({
    className:   '',
    html,
    iconSize:    [size, size],
    iconAnchor:  [size / 2 - dx, size / 2 - dy],
    popupAnchor: [dx, dy - size / 2],
  });
}

function PinsLayer({ data, labels }: { data: TruckMapPins; labels: TruckPinsMapLabels }) {
  const map = useMap();

  useEffect(() => {
    // Group coincident pins so they can be fanned out.
    const groups = new Map<string, number[]>();
    data.pins.forEach((p, i) => {
      const k = `${p.lat},${p.lng}`;
      groups.set(k, [...(groups.get(k) ?? []), i]);
    });

    const layer = L.layerGroup();
    for (const idxs of groups.values()) {
      const n = idxs.length;
      const radius = n > 1 ? 9 + n * 2 : 0;
      idxs.forEach((i, j) => {
        const p = data.pins[i];
        const angle = (2 * Math.PI * j) / n - Math.PI / 2;
        const dx = Math.round(radius * Math.cos(angle));
        const dy = Math.round(radius * Math.sin(angle));
        const missed = p.status === 'missed';
        const ringed = missed && p.missedDays >= data.streakDays;
        const marker = L.marker([p.lat, p.lng], {
          icon: dotIcon(missed ? TRUCK_PIN_COLORS.missed : TRUCK_PIN_COLORS.collected, ringed, dx, dy),
          // Long-missed dots on top so their rings aren't hidden.
          zIndexOffset: ringed ? 1000 : missed ? 500 : 0,
          keyboard: true,
        });
        const lines = [
          p.label ? `<strong>${escapeHtml(p.label)}</strong>` : '',
          missed ? labels.missed : labels.collected,
          missed && p.missedDays >= 2 ? labels.daysInARow(p.missedDays) : '',
        ].filter(Boolean);
        marker.bindPopup(
          `<div style="font-size:13px;line-height:1.4;overflow-wrap:anywhere">${lines.join('<br/>')}</div>`,
          { closeButton: false, minWidth: 160, maxWidth: popupMaxWidth(), autoPanPadding: L.point(12, 12) },
        );
        layer.addLayer(marker);
      });
    }

    layer.addTo(map);
    return () => { layer.remove(); };
  }, [map, data, labels]);

  return null;
}

/** Popup width that fits a phone screen, so long street names wrap instead of overflowing. */
const popupMaxWidth = () => Math.min(280, (typeof window !== 'undefined' ? window.innerWidth : 320) - 64);

const TruckPinsMap = ({ data, labels }: { data: TruckMapPins; labels: TruckPinsMapLabels }) => {
  const hasBoundary = data.boundary.length > 2;
  const bounds = useMemo(() => (hasBoundary ? L.latLngBounds(data.boundary) : null), [data.boundary, hasBoundary]);
  const maxBounds = useMemo(() => bounds?.pad(0.5), [bounds]);

  return (
    <MapContainer
      bounds={bounds ?? undefined}
      center={bounds ? undefined : [data.pins[0]?.lat ?? 12.9, data.pins[0]?.lng ?? 77.67]}
      zoom={15}
      minZoom={11}
      maxZoom={19}
      // Quarter steps so the long, narrow ward fills a phone-width map.
      zoomSnap={0.25}
      scrollWheelZoom={false}
      style={{ height: '100%', width: '100%', background: '#f4f4f2' }}
    >
      <TileLayer attribution={OSM_ATTRIBUTION} url={OSM_TILE_URL} maxZoom={OSM_MAX_ZOOM} />
      {hasBoundary && (
        <Polygon
          positions={data.boundary}
          interactive={false}
          pathOptions={{
            color: TRUCK_PIN_COLORS.boundary, weight: 2.5, dashArray: '6 6',
            fillColor: TRUCK_PIN_COLORS.boundary, fillOpacity: 0.04,
          }}
        />
      )}
      {bounds && <MapFitLimit bounds={bounds} maxBounds={maxBounds} />}
      <PinsLayer data={data} labels={labels} />
    </MapContainer>
  );
};

export default TruckPinsMap;
