import { GBA_BY_ID, gbaWardsForBbmp } from '@/lib/wards';
import type { ScorecardSelection } from './types';

/** Fill in whichever ward identity the pick didn't specify. */
export function selectionFromBbmp(num: number): ScorecardSelection {
  return { bbmpNum: num, gbaId: gbaWardsForBbmp(num)[0]?.ward.id ?? null };
}
export function selectionFromGba(id: string): ScorecardSelection {
  return { gbaId: id, bbmpNum: GBA_BY_ID[id]?.bbmp[0]?.[0] ?? null };
}
