// Fits an embedded map to `bounds` and caps how far it can zoom out: at most
// `zoomOutSteps` zoom levels below the fitted view, and panning is held to
// `maxBounds`. Re-fits while the container resizes (e.g. as layout settles)
// until the visitor moves the map.

import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

interface Props {
  bounds:        L.LatLngBounds;
  maxBounds?:    L.LatLngBounds;
  padding?:      number;
  zoomOutSteps?: number;
}

const MapFitLimit = ({ bounds, maxBounds, padding = 12, zoomOutSteps = 1 }: Props) => {
  const map = useMap();
  useEffect(() => {
    const el = map.getContainer();
    let touched = false;
    const markTouched = () => { touched = true; };
    const fit = () => {
      map.invalidateSize();
      // getBoundsZoom clamps to the current minZoom, so clear it first.
      map.setMinZoom(0);
      const z = map.getBoundsZoom(bounds, false, L.point(padding * 2, padding * 2));
      map.setMinZoom(Math.max(0, z - zoomOutSteps));
      if (!touched) map.fitBounds(bounds, { padding: [padding, padding], animate: false });
    };
    if (maxBounds) {
      map.setMaxBounds(maxBounds);
      map.options.maxBoundsViscosity = 0.9;
    }
    fit();
    el.addEventListener('pointerdown', markTouched);
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => {
      ro.disconnect();
      el.removeEventListener('pointerdown', markTouched);
    };
  }, [map, bounds, maxBounds, padding, zoomOutSteps]);
  return null;
};

export default MapFitLimit;
