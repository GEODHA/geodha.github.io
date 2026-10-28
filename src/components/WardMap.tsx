import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet';
import type { Layer, PathOptions } from 'leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import wardBoundaries from '../../data/gba-ward-boundaries.json';
import corporationBoundaries from '../../data/gba-corporations.json';
import { featureBounds, WARD_FEATURES } from '@/lib/geo';
import type { WardBoundaryProps } from '@/lib/geo';
import { CORPORATIONS, wardTint } from '@/config/gba';
import type { CorporationId } from '@/config/gba';
import { bbmpWardTint, bbmpZoneColor } from '@/lib/bbmp';
import type { BbmpWardFeature, BbmpWardProps } from '@/lib/bbmp';
import { OSM_TILE_URL, OSM_ATTRIBUTION, OSM_MAX_ZOOM } from '@/config/mapConfig';
import AppReportsLayer, { APP_REPORTS_PANE } from './AppReportsLayer';
import type { AppReportPin } from './AppReportsLayer';

export type WardLayer = 'gba' | 'bbmp';

interface Props {
  /** Which ward boundaries to draw. `selectedWard` and `zoomRequest` use that layer's ward_num. */
  layer?:              WardLayer;
  /** Former BBMP 198 wards — required for the 'bbmp' layer (loaded on demand). */
  bbmpWards?:          BbmpWardFeature[] | null;
  selectedWard:        number | null;
  /** Tap/click on a ward polygon — selects it (no zoom). */
  onWardSelect:        (wardNum: number) => void;
  /** Fly to a ward. `seq` changes on every request so repeats re-zoom. */
  zoomRequest?:        { wardNum: number; seq: number } | null;
  /** Live GEODHA app reports — clustered pins, always visible. */
  appReports?:         AppReportPin[];
  onReportSelect?:     (reportId: string) => void;
}

// ── Panes ─────────────────────────────────────────────────────────────────────
// App-report pins/clusters sit above the ward polygons.

function MapSetup({ onReady }: { onReady: () => void }) {
  const map = useMap();

  useEffect(() => {
    const reportPane = map.getPane(APP_REPORTS_PANE) ?? map.createPane(APP_REPORTS_PANE);
    reportPane.style.zIndex = '620';
    onReady();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map]);

  return null;
}

// ── ZoomController ────────────────────────────────────────────────────────────

function ZoomController({ features, wardNum, seq }: { features: GeoJSON.Feature[]; wardNum: number; seq: number }) {
  const map = useMap();
  useEffect(() => {
    const feat = features.find((f) => (f.properties as { ward_num: number }).ward_num === wardNum);
    if (!feat) return;
    const bounds = featureBounds(feat.geometry);
    if (bounds) map.flyToBounds(bounds, { padding: [50, 50], duration: 0.6, maxZoom: 15 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wardNum, seq]);
  return null;
}

// ── Styles ────────────────────────────────────────────────────────────────────

const corporationStyle = (feature?: GeoJSON.Feature): PathOptions => {
  const id = (feature?.properties as { corp_id: CorporationId } | undefined)?.corp_id ?? 1;
  return {
    fill:        false,
    color:       CORPORATIONS[id].color,
    weight:      2.5,
    opacity:     0.95,
    interactive: false,
  };
};

// ── Component ─────────────────────────────────────────────────────────────────

// Hover tooltips only where hovering exists — on touch screens the tapped
// ward's name is shown by the dashboard's selected-ward label instead.
const CAN_HOVER = typeof window !== 'undefined' && window.matchMedia?.('(hover: hover)').matches;

const WardMap = ({ layer = 'gba', bbmpWards, selectedWard, onWardSelect, zoomRequest, appReports = [], onReportSelect }: Props) => {
  const geoJsonRef = useRef<L.GeoJSON | null>(null);
  const [panesReady, setPanesReady] = useState(false);
  const isBbmp = layer === 'bbmp' && bbmpWards != null;

  // Each ward gets a light, unique tint of its corporation's emblem colour
  // (BBMP: its zone's colour).
  const styleFeature = (feature?: GeoJSON.Feature): PathOptions => {
    const props      = feature?.properties as (WardBoundaryProps | BbmpWardProps) | undefined;
    const isSelected = props?.ward_num === selectedWard;
    const fillColor  = !props ? '#ddd'
      : 'corp_id' in props ? wardTint(props.corp_id, props.ward_id)
      : bbmpWardTint(props.zone, props.ward_num);
    return {
      fillColor,
      fillOpacity: isSelected ? 0.75 : 0.45,
      color:       isSelected ? '#1a1a1a' : 'rgba(255,255,255,0.85)',
      weight:      isSelected ? 2 : 0.6,
    };
  };

  const onEachFeature = (feature: GeoJSON.Feature, layer: Layer) => {
    const props = feature.properties as WardBoundaryProps;
    const corp  = CORPORATIONS[props.corp_id];

    if (CAN_HOVER) layer.bindTooltip(
      `<div style="font-family:'Archivo',sans-serif;">
         <div style="font-size:14px;font-weight:700;">${props.ward_name}</div>
         <div style="font-size:11px;color:#555;">Ward ${props.ward_id} ·
           <span style="color:${corp.color};font-weight:700;">${corp.key}</span></div>
       </div>`,
      { sticky: true, opacity: 0.96 },
    );

    layer.on('click', () => onWardSelect(props.ward_num));
  };

  const onEachBbmpFeature = (feature: GeoJSON.Feature, layer: Layer) => {
    const props = feature.properties as BbmpWardProps;

    if (CAN_HOVER) layer.bindTooltip(
      `<div style="font-family:'Archivo',sans-serif;">
         <div style="font-size:14px;font-weight:700;">${props.ward_name}</div>
         <div style="font-size:11px;color:#555;">BBMP ward ${props.ward_num} ·
           <span style="color:${bbmpZoneColor(props.zone)};font-weight:700;">${props.zone}</span></div>
       </div>`,
      { sticky: true, opacity: 0.96 },
    );

    layer.on('click', () => onWardSelect(props.ward_num));
  };

  // Re-style on selection change; lift the selected ward so its outline
  // isn't hidden under its neighbours'.
  useEffect(() => {
    geoJsonRef.current?.setStyle((f) => styleFeature(f));
    geoJsonRef.current?.eachLayer((l) => {
      const num = ((l as L.Polygon).feature?.properties as WardBoundaryProps | undefined)?.ward_num;
      if (num === selectedWard) (l as L.Polygon).bringToFront();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedWard, isBbmp]);

  return (
    <MapContainer
      center={[12.985, 77.615]}
      zoom={11}
      minZoom={10}
      maxZoom={18}
      maxBounds={[[12.68, 77.30], [13.30, 77.95]]}
      maxBoundsViscosity={0.9}
      style={{ height: '100%', width: '100%', background: '#fff' }}
      zoomControl={true}
    >
      <TileLayer
        attribution={OSM_ATTRIBUTION}
        url={OSM_TILE_URL}
        maxZoom={OSM_MAX_ZOOM}
        className="tiles-muted"
        opacity={0.55}
      />

      {/* Panes — must precede pane-targeted markers */}
      <MapSetup onReady={() => setPanesReady(true)} />

      {zoomRequest && (
        <ZoomController
          features={isBbmp ? bbmpWards : WARD_FEATURES}
          wardNum={zoomRequest.wardNum}
          seq={zoomRequest.seq}
        />
      )}

      {isBbmp ? (
        // Former BBMP 198 wards, tinted by zone
        <GeoJSON
          key="bbmp"
          data={{ type: 'FeatureCollection', features: bbmpWards } as GeoJSON.FeatureCollection}
          style={styleFeature}
          onEachFeature={onEachBbmpFeature}
          ref={(r) => { if (r) geoJsonRef.current = r; }}
        />
      ) : (
        <>
          {/* GBA wards, tinted by corporation */}
          <GeoJSON
            key="gba"
            // @ts-expect-error json import typing
            data={wardBoundaries}
            style={styleFeature}
            onEachFeature={onEachFeature}
            ref={(r) => { if (r) geoJsonRef.current = r; }}
          />

          {/* Corporation outlines */}
          <GeoJSON
            // @ts-expect-error json import typing
            data={corporationBoundaries}
            style={corporationStyle}
          />
        </>
      )}

      {/* Live GEODHA app reports */}
      {panesReady && appReports.length > 0 && (
        <AppReportsLayer reports={appReports} onReportSelect={onReportSelect} />
      )}
    </MapContainer>
  );
};

export default WardMap;
