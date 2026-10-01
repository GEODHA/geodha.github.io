import { TileLayer } from 'react-leaflet';
import {
  MAP_TILE_URL, MAP_TILE_ATTRIBUTION, MAP_TILE_SUBDOMAINS, MAP_TILE_MAX_ZOOM,
} from '@/config/mapTiles';

/** Shared, key-free basemap used by every map on the site. */
const BaseTileLayer = ({ opacity = 0.7 }: { opacity?: number }) => (
  <TileLayer
    url={MAP_TILE_URL}
    attribution={MAP_TILE_ATTRIBUTION}
    subdomains={MAP_TILE_SUBDOMAINS}
    maxZoom={MAP_TILE_MAX_ZOOM}
    className="geodha-basemap"
    opacity={opacity}
  />
);

export default BaseTileLayer;
