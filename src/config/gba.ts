// Greater Bengaluru Authority (GBA) — the five city corporations that replaced
// BBMP. Ward boundaries: final 369-ward delimitation notified 19 Nov 2025
// (ward names as renamed Dec 2025), via OpenCity:
// https://data.opencity.in/dataset/gba-wards-delimitation-2025
// Colours follow each corporation's official emblem.

export type CorporationId = 1 | 2 | 3 | 4 | 5;

export interface Corporation {
  id:     CorporationId;
  /** Short key as it appears in the source data ("Central", "North", …). */
  key:    string;
  name:   string;
  nameKn: string;
  /** Emblem colour — used for the corporation outline and ward tints. */
  color:  string;
}

export const GBA_NAME = 'Greater Bengaluru Authority';

export const CORPORATIONS: Record<CorporationId, Corporation> = {
  1: { id: 1, key: 'Central', name: 'Bengaluru Central City Corporation', nameKn: 'ಬೆಂಗಳೂರು ಕೇಂದ್ರ ನಗರ ಪಾಲಿಕೆ',   color: '#5470b8' },
  2: { id: 2, key: 'North',   name: 'Bengaluru North City Corporation',   nameKn: 'ಬೆಂಗಳೂರು ಉತ್ತರ ನಗರ ಪಾಲಿಕೆ',   color: '#c04d97' },
  3: { id: 3, key: 'East',    name: 'Bengaluru East City Corporation',    nameKn: 'ಬೆಂಗಳೂರು ಪೂರ್ವ ನಗರ ಪಾಲಿಕೆ',   color: '#1f8f86' },
  4: { id: 4, key: 'South',   name: 'Bengaluru South City Corporation',   nameKn: 'ಬೆಂಗಳೂರು ದಕ್ಷಿಣ ನಗರ ಪಾಲಿಕೆ',  color: '#a68e2d' },
  5: { id: 5, key: 'West',    name: 'Bengaluru West City Corporation',    nameKn: 'ಬೆಂಗಳೂರು ಪಶ್ಚಿಮ ನಗರ ಪಾಲಿಕೆ',   color: '#9a4b3c' },
};

export const CORPORATION_LIST = Object.values(CORPORATIONS);

function mixWithWhite(hex: string, t: number): string {
  const n = parseInt(hex.slice(1), 16);
  const ch = (shift: number) => Math.round(((n >> shift) & 255) * (1 - t) + 255 * t);
  return `rgb(${ch(16)},${ch(8)},${ch(0)})`;
}

/**
 * Light, per-ward tint of the corporation colour. Neighbouring ward ids get
 * visibly different lightness so individual wards stay distinguishable.
 */
export function wardTint(corpId: CorporationId, wardId: number): string {
  const step = (wardId * 5) % 7;            // 0–6, scrambles adjacent ids
  return mixWithWhite(CORPORATIONS[corpId].color, 0.25 + step * 0.08);
}
