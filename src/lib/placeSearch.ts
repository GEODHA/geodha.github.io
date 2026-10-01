// Place search for the Neighbourhood Scorecard: address / landmark → lat,lng.
//
// • With VITE_GOOGLE_MAPS_API_KEY (Places API (New) enabled), uses Google
//   Places Text Search.
// • Otherwise — or if Google fails — falls back to Photon (OpenStreetMap
//   geocoder by Komoot; free, no key).
// • Google Maps links and raw "lat, lng" pairs are parsed locally.

import { isInBengaluru } from '@/lib/wards';

export interface PlaceResult {
  label:    string;
  sublabel: string;
  lat:      number;
  lng:      number;
  source:   'google' | 'osm' | 'coords';
}

const GOOGLE_KEY = (import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined) || '';
const BOUNDS = { south: 12.68, west: 77.3, north: 13.2, east: 77.9 };

export const placeProvider: 'google' | 'osm' = GOOGLE_KEY ? 'google' : 'osm';

/** Pulls coordinates out of a Google Maps URL or a "lat, lng" string. */
export function parseCoordinates(input: string): { lat: number; lng: number } | null {
  const s = decodeURIComponent(input.trim());
  const patterns = [
    /!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/,                  // place URLs (exact pin)
    /@(-?\d+\.\d+),(-?\d+\.\d+)/,                       // map viewport
    /[?&](?:q|query|ll|destination)=(-?\d+\.\d+),\s*(-?\d+\.\d+)/,
    /^(-?\d{1,2}\.\d+)\s*,\s*(-?\d{1,3}\.\d+)$/,         // "12.97, 77.59"
  ];
  for (const re of patterns) {
    const m = s.match(re);
    if (m) {
      const lat = parseFloat(m[1]), lng = parseFloat(m[2]);
      if (!isNaN(lat) && !isNaN(lng)) return { lat, lng };
    }
  }
  return null;
}

export const isShortMapsLink = (s: string) => /maps\.app\.goo\.gl|goo\.gl\/maps/i.test(s);

async function searchGoogle(q: string): Promise<PlaceResult[]> {
  const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: {
      'Content-Type':     'application/json',
      'X-Goog-Api-Key':   GOOGLE_KEY,
      'X-Goog-FieldMask': 'places.displayName,places.formattedAddress,places.location',
    },
    body: JSON.stringify({
      textQuery: q,
      maxResultCount: 6,
      locationRestriction: {
        rectangle: {
          low:  { latitude: BOUNDS.south, longitude: BOUNDS.west },
          high: { latitude: BOUNDS.north, longitude: BOUNDS.east },
        },
      },
    }),
  });
  if (!res.ok) throw new Error(`Google Places ${res.status}`);
  const json = await res.json() as {
    places?: { displayName?: { text: string }; formattedAddress?: string; location: { latitude: number; longitude: number } }[];
  };
  return (json.places ?? []).map((p) => ({
    label:    p.displayName?.text ?? p.formattedAddress ?? q,
    sublabel: p.formattedAddress ?? '',
    lat:      p.location.latitude,
    lng:      p.location.longitude,
    source:   'google' as const,
  }));
}

async function searchPhoton(q: string): Promise<PlaceResult[]> {
  const url = new URL('https://photon.komoot.io/api/');
  url.searchParams.set('q', q);
  url.searchParams.set('limit', '6');
  url.searchParams.set('lang', 'en');
  url.searchParams.set('bbox', `${BOUNDS.west},${BOUNDS.south},${BOUNDS.east},${BOUNDS.north}`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Photon ${res.status}`);
  const json = await res.json() as {
    features: { geometry: { coordinates: [number, number] }; properties: Record<string, string> }[];
  };
  return json.features.map((f) => {
    const p = f.properties;
    const sub = [p.street, p.district, p.locality, p.city].filter(Boolean);
    return {
      label:    p.name || sub[0] || q,
      sublabel: [...new Set(sub)].join(', '),
      lat:      f.geometry.coordinates[1],
      lng:      f.geometry.coordinates[0],
      source:   'osm' as const,
    };
  });
}

export async function searchPlaces(q: string): Promise<PlaceResult[]> {
  const coords = parseCoordinates(q);
  if (coords) return [{ label: 'Pinned location', sublabel: `${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}`, ...coords, source: 'coords' }];

  let results: PlaceResult[] = [];
  if (GOOGLE_KEY) {
    try { results = await searchGoogle(q); }
    catch (err) { console.warn('Google place search failed, falling back to OSM:', err); }
  }
  if (results.length === 0) results = await searchPhoton(q);
  return results.filter((r) => isInBengaluru(r.lat, r.lng));
}
