// Fixed figures for a ward's campaign summary (top of the Wet waste pickup
// tab). These come from the campaign write-up and are not computed from
// Firestore; only the daily chart grows, with day documents after `seriesEnd`.
// Copy lives in the i18n `campaign` block.

export interface CampaignComparison {
  residents:  number;
  checkins:   number;
  /** Reports (one per resident per day) with wet waste collected, out of `reports`. */
  collected:  number;
  reports:    number;
  /** Residents who went 4+ days in a row without a pickup. */
  longMissed: number;
  /** Longest stretch without a pickup, in days. */
  longestGap: number;
  fullDays:   number;
  totalDays:  number;
  complaints: number;
  /** Complaints closed; omitted when not reported for the period. */
  complaintsClosed?: number;
}

export interface WardCampaign {
  /** Daily [dateKey, collected, residents], as published in the write-up. */
  series:     [string, number, number][];
  /** Last day of the fixed series; later days come from the day documents. */
  seriesEnd:  string;
  /** Day the chart marks with "New contractor engaged". */
  markerDate: string;
  before:     CampaignComparison;
  after:      CampaignComparison;
}

export const KASAVANAHALLI_CAMPAIGN: WardCampaign = {
  series: [
    ['2026-10-21', 2, 4], ['2026-10-22', 0, 13], ['2026-10-23', 2, 16], ['2026-10-24', 13, 26],
    ['2026-10-25', 2, 23], ['2026-10-26', 7, 31], ['2026-10-27', 4, 39], ['2026-10-28', 19, 45],
    ['2026-10-29', 0, 46], ['2026-10-30', 3, 31], ['2026-10-31', 7, 32], ['2026-11-01', 14, 29],
    ['2026-11-02', 9, 22], ['2026-11-03', 2, 26], ['2026-11-04', 29, 31], ['2026-11-05', 27, 31],
    ['2026-11-06', 24, 26], ['2026-11-07', 28, 28], ['2026-11-08', 13, 17], ['2026-11-09', 13, 13],
    ['2026-11-10', 24, 24],
  ],
  seriesEnd:  '2026-11-10',
  markerDate: '2026-11-04',
  before: {
    residents: 78, checkins: 361, collected: 59, reports: 306,
    longMissed: 8, longestGap: 8, fullDays: 0, totalDays: 11, complaints: 75, complaintsClosed: 1,
  },
  after: {
    residents: 54, checkins: 205, collected: 158, reports: 170,
    longMissed: 0, longestGap: 1, fullDays: 3, totalDays: 7, complaints: 5,
  },
};
