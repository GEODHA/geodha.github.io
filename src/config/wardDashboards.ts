// Ward dashboards at /dashboard/:slug — wards with a daily wet waste pickup
// map published by the app backend (geodha_public_truck_maps).
// Slug: "b" + corporation initial + "cc-" + official ward number,
// e.g. bscc-31 = Bengaluru South City Corporation, ward 31.

export interface WardDashboard {
  /** Backend key, `{zone}_{wardNumber}` — matches the docs' `wardKey`. */
  wardKey: string;
  /** Site-wide GBA ward key (WARD_PROPS / ?ward= on /dashboard). */
  wardNum: number;
  /** Hindi ward name (Kannada and English come from the boundary data). */
  nameHi:  string;
}

export const WARD_DASHBOARDS: Record<string, WardDashboard> = {
  'bscc-31': { wardKey: 'South_31', wardNum: 216, nameHi: 'कसवनहल्ली' },
};
