// Basemap tile provider — single source of truth for every Leaflet map.
//
// CARTO's basemaps now need an API key, so the default is the standard
// OpenStreetMap tile server (no key; attribution required). It is rendered
// desaturated via the `.geodha-basemap` class in index.css so the ward
// choropleth stays the visual focus, much like the old CARTO "light" style.
//
// To switch providers without code changes, set at build time:
//   VITE_MAP_TILE_URL          e.g. https://tiles.example.org/{z}/{x}/{y}.png
//   VITE_MAP_TILE_ATTRIBUTION  HTML attribution string required by the provider
//   VITE_MAP_TILE_SUBDOMAINS   comma-separated, e.g. "a,b,c" (only if {s} is used)
//
// Please respect the OSM tile usage policy:
// https://operations.osmfoundation.org/policies/tiles/

const env = import.meta.env;

export const MAP_TILE_URL: string =
  (env.VITE_MAP_TILE_URL as string | undefined) ||
  'https://tile.openstreetmap.org/{z}/{x}/{y}.png';

export const MAP_TILE_ATTRIBUTION: string =
  (env.VITE_MAP_TILE_ATTRIBUTION as string | undefined) ||
  '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors';

export const MAP_TILE_SUBDOMAINS: string[] =
  ((env.VITE_MAP_TILE_SUBDOMAINS as string | undefined) || 'abc')
    .split(',').map((s) => s.trim()).filter(Boolean);

/** OSM's tile server caps at zoom 19. */
export const MAP_TILE_MAX_ZOOM = 19;
