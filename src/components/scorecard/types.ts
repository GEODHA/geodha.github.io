import type { ClassifyFn } from '@/lib/severity';

export interface Scales { dump: ClassifyFn; veh: ClassifyFn; burn: ClassifyFn; total: ClassifyFn }

/** What the user picked in the scorecard search. */
export type ScorecardPick =
  | { kind: 'bbmp';  num: number }
  | { kind: 'gba';   id: string }
  | { kind: 'point'; lat: number; lng: number; label: string };

/** A resolved neighbourhood: both ward identities (either may be unknown). */
export interface ScorecardSelection {
  bbmpNum:  number | null;
  gbaId:    string | null;
  /** Set when the user searched a place / used their location. */
  place?:   { label: string; lat: number; lng: number };
}
