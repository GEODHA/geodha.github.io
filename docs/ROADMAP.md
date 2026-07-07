# GEODHA Website Roadmap & Implementation Specs

> Written 2026-07-07 (Claude Fable session). These specs are handoff documents for
> future Claude Sonnet/Opus sessions. Each section is self-contained: read the
> section + the referenced files, then implement. Verify with `npm run build`
> run by Pratul locally (the Cowork sandbox cannot reliably build this repo).

## Session plan (suggested order & model)

| # | Task | Model | Why |
|---|------|-------|-----|
| 0 | Map/dashboard merge | DONE (Fable, 2026-07-07) | Hardest architecture — see §1 |
| 1 | Refactor & cleanup | Sonnet | Mechanical, well-specified below |
| 2 | App/Play Store links + UI | Sonnet | Small, isolated |
| 3 | GA refinement | Sonnet | Small, isolated |
| 4 | UI-kit redesign | Opus (or Sonnet + review) | Design judgment across every page |
| 5 | i18n + Kannada | Sonnet | Mechanical but wide; do AFTER redesign so strings are extracted once |
| 6 | Dashboard automation (geodha_scraper) | Sonnet | Guidance in §7; work happens mostly in C:\GEODHA_App\geodha_scraper |

Rationale: redesign before i18n (avoid translating strings that get rewritten);
refactor first (everything else touches fewer/cleaner files afterwards).

---

## 1. Map/dashboard merge — WHAT WAS DONE (2026-07-07)

Implemented. Context for future sessions:

- `/map` (MapReports page) is merged into `/dashboard`. Zoom-driven crossfade:
  - Zoomed out (≤ z13): ward choropleth + ward-centroid problem icons/testimonial badges.
  - Zoomed in (≥ z14.5): live GEODHA app-report pins (clustered, status-colored);
    ward icons fade out; choropleth fill lightens by 60% so streets are readable.
  - Between z13–14.5 both layers partially visible (crossfade). Constants
    `CROSSFADE_START/END` in `src/components/WardMap.tsx`.
- Mechanism: two Leaflet panes (`ward-icons` z620, `app-reports` z640) whose
  `opacity`/`visibility` are driven by a `zoomend` listener (`MapSetup` in WardMap).
  Visibility (not pointer-events) is used to block interaction because divIcon
  HTML contains inline `pointer-events:auto`.
- New file `src/components/AppReportsLayer.tsx`: markercluster group in the
  app-reports pane; exports `AppReportPin`, `AppReportStatus`,
  `APP_REPORTS_PANE`, `APP_REPORT_STATUS_COLORS`.
- `DashboardPage.tsx`: fetches app reports non-blockingly (`useFetchReports(false)`
  + `initializeAuth`), passes pins to WardMap; tapping a pin opens the shared
  bottom sheet with a new `ReportSheet` (photos → ImageLightbox, status badge,
  description, meta, CTA). Exact-GPS testimonial markers stay visible at all zooms.
- Routing: `/map` → `LegacyMapRedirect` (App.tsx) → `/dashboard`, forwarding
  `location.state`. Hero "View Map" button → `/dashboard`.
  `ReportsBarChart`/`TrashPieChart` now navigate to `/dashboard` with their
  filter state.
- Map `maxZoom` raised 16 → 18.

### 1a. OPEN ITEM: filtered reports list
The old /map page had a "Reports List" tab; home-page charts (bar = date range,
pie = trash category) deep-linked into it with `location.state`
(`dateRangeSelected` / `secondaryCategoryFilter`). That list view no longer
exists — the state is forwarded to /dashboard but currently ignored.
Options (decide with Pratul): (a) reports-list section under the dashboard map,
(b) fold into /data page, (c) drop chart click-through entirely.
Relevant helpers: `getReportsListFromChartDate`, `filterReportsBySecondaryCategory`
in `src/lib/utils.ts` / `src/lib/wasteCategorizationUtils.ts`.

---

## 2. Refactor & codebase cleanup (Sonnet)

> STATUS 2026-07-07: steps 1, 2, 4, 5 and most of 6 DONE (Fable session).
> Deleted: MapReports, OpenStreetMap, CustomHeatmapLayer, heatmapConfigService,
> PhotoCarousel, LocationPicker, ReportCard, VirtualizedList, HeroParticles,
> Header, VideoSection, AppPreviewCarousel, OptimizedImage, Features,
> visionService, notificationService, blogService, mockData,
> ward-heatmap2.json, bun.lockb, REFERENCE_CODE/ (user-approved),
> src/pages/# Code Citations.md. pages/Dashboard.tsx → components/ChartsPanel.tsx
> (kept DORMANT — Hero usage is commented out; user chose keep over delete).
> New: src/lib/geo.ts (shared geometry). Console noise stripped outside src/admin.
> REMAINING: step 3 (split DashboardPage.tsx into components/dashboard/*) and a
> post-cleanup `npm run build` + `npm run lint` pass by Pratul.

Goal: delete dead weight, split oversized files, dedupe logic. No behavior change.
After EACH step: Pratul runs `npm run build` + spot-checks `npm run dev`.

1. **Delete dead pages/components** (verify zero imports first with grep):
   - `src/pages/MapReports.tsx` (replaced by merge; keep `ReportSheet` behavior in mind).
   - `src/components/OpenStreetMap.tsx` + `src/components/CustomHeatmapLayer.tsx`
     — ONLY if no longer imported anywhere (check `LocationPicker`, `ReportPage`).
   - `src/pages/Dashboard.tsx` is NOT dead — it's the charts panel used by Hero.
     Rename to `src/components/ChartsPanel.tsx` to end the Dashboard/DashboardPage confusion.
   - `REFERENCE_CODE/` directory — historical reference; move out of the repo or
     delete (ask Pratul). It confuses tooling and greps.
   - `src/pages/# Code Citations.md` — delete.
   - `data/ward-heatmap.json` / `ward-heatmap2.json` — check usage; likely stale scraper outputs.
2. **Dedupe geometry helpers**: `outerRing`/`ringCentroid`/`featureBounds`/
   point-in-polygon exist in BOTH `WardMap.tsx` and `DashboardPage.tsx`
   (`outerRingFromGeometry`, `pointInRing`, `findWardForPoint`, centroid IIFE).
   Extract to `src/lib/geo.ts` with the `ZONE_LOOKUP`/`WARD_CENTROIDS` builders.
3. **Split DashboardPage.tsx (~1230 lines)** into:
   `components/dashboard/WardSheet.tsx`, `ReportSheet.tsx`, `ImageLightbox.tsx`,
   `WardSearch.tsx`, `MapLegend.tsx`, keeping the page as orchestration only.
4. **Strip console noise**: `useFetchReports`, `OpenStreetMap`, `MapReports`,
   `firebase.ts` are full of emoji console.logs. Remove or gate behind `import.meta.env.DEV`.
5. **Fix loose types**: `useFetchReports(isTesting)` param untyped; `as any`
   casts around markercluster options (acceptable, but centralize).
6. **Repo hygiene**: confirm `dist/` is gitignored (deploy uses `gh-pages -d dist`);
   remove `bun.lockb` if npm is canonical (package-lock.json exists); `.env` files
   in repo root — verify secrets aren't committed (`.env` IS present — check!).

## 3. App Store & Play Store links + UI (Sonnet)

App is now live on both stores. Get the final URLs from Pratul first
(Play: `https://play.google.com/store/apps/details?id=com.geodha.community`
is already hard-coded in `Hero.tsx`; App Store URL unknown).

1. Create `src/config/appLinks.ts` exporting `PLAY_STORE_URL`, `APP_STORE_URL`.
2. Create a `StoreBadges` component using official badge assets
   (Google Play badge + Apple App Store badge SVGs, per each store's brand rules —
   don't hand-draw them). Props: size, layout (row/column).
3. Place: Hero (replace the single "Download Reporting App" button with both badges),
   `GetStarted.tsx`, `Footer.tsx`, `ReportSheet` CTA ("Report with the GEODHA app"),
   and the `/report` page.
4. GA events on click: `gtag('event', 'store_click', { store: 'play'|'appstore', placement })`.
5. Smart deep link (optional): single "Get the app" button that OS-detects
   (iOS → App Store, Android → Play) for share contexts.

## 4. Website redesign — GEODHA UI Kit (Opus preferred)

Source of truth: `GEODHA UI Kit.html` (Pratul has it; copy into `docs/ui-kit/`).
Kit summary (extracted 2026-07-07):

- **Fonts**: Archivo (headings/body, incl. 900 weight for the GEODHA wordmark,
  letter-spacing −1), Space Mono (mono/numbers), Material Symbols Outlined (icons).
  Current site uses Barlow Condensed for headings — replace everywhere
  (grep `Barlow Condensed`).
- **Palette**: ink `#161614`, surface `#EDEDEA` / off-whites `#FFFFFF`,
  green `#1FA75C` (+tint `#E7F6EE`), blue `#2C7BE5` (+tint `#E5EFFD`),
  yellow `#FFCE2B` (+tints `#FFF6D6`, `#FFEFB0`), red `#E5484D` (+tint `#FDE4E5`),
  grays `#33332e #55554e #6b6b66 #8a8a84 #9a9a94 #cfcfca`.
- Approach:
  1. Encode kit as CSS variables + Tailwind theme in `src/index.css` /
     `tailwind.config.ts` (map to existing shadcn token names where possible so
     ui/ components restyle for free).
  2. Load fonts via `index.html` (Google Fonts: Archivo, Space Mono, Noto Sans
     Kannada — see §5) and remove Barlow Condensed.
  3. Page order: Navigation/Footer → Index (Hero, Features, HowItWorks) →
     Dashboard chrome (title, legend, sheets — NOT map logic) → About/GetStarted →
     Guide pages → Report/Volunteer.
  4. Keep severity band colors (`src/lib/severity.ts` BAND map) functional —
     align them to kit red/yellow/green tints rather than inventing new ones.
- Do NOT restructure components during redesign (refactor is a separate session).

## 5. Multi-language support & Kannada (Sonnet, after redesign)

1. Stack: `react-i18next` + `i18next-browser-languagedetector`. No URL prefixing
   (GH Pages SPA); persist choice in localStorage; `<html lang>` sync.
2. Namespaces per page: `common` (nav, footer, CTAs), `home`, `dashboard`,
   `guide`, `report`, `about`. Files in `src/locales/{en,kn}/*.json`.
3. Font: Archivo has no Kannada glyphs — add Noto Sans Kannada fallback:
   `font-family: 'Archivo', 'Noto Sans Kannada', sans-serif` globally.
4. Language switcher in `Navigation.tsx` (a `Languages` icon is ALREADY imported
   there — likely a stub was planned). Label options in their own script: "English / ಕನ್ನಡ".
5. Content notes: ward names stay English (data-driven); translate legend,
   sheets, severity labels (BAND labels live in `src/lib/severity.ts` — needs
   i18n-aware refactor), recommended-action templates come from Firestore →
   add `label_kn`/`steps_kn` fields OR keep actions English-only for v1 (ask Pratul).
6. Dates/numbers: `toLocaleDateString('kn-IN')` where locale-sensitive.
7. GA: `gtag('event', 'language_change', { lang })`.

## 6. Google Analytics refinement (Sonnet)

Current state: gtag loaded in `index.html`; `RouteTracker` in `App.tsx` fires a
`page_view` on every route change with `page_title: document.title`.

**Root cause of "dashboard vs home not differentiated":** the site never changes
`document.title` per route — every page_view carries the same title, and GA4's
default report groups by title. Also the initial gtag config in `index.html`
almost certainly auto-fires a page_view, so `/` gets double-counted.

Fix:
1. In `index.html` gtag config: `gtag('config', 'G-XXXX', { send_page_view: false });`
2. Add per-route titles: lightweight `usePageTitle(title)` hook (or
   react-helmet-async) — set `document.title = 'GEODHA · Dashboard'` etc.
   BEFORE RouteTracker fires (RouteTracker's effect must run after title is set;
   simplest: RouteTracker derives title from a route→title map itself).
3. Custom events worth adding: `ward_selected` (ward_num), `report_pin_tap`,
   `share_click` (ward/dashboard), `store_click` (§3), `language_change` (§5),
   `map_zoom_mode` (ward-view vs city-view entered).
4. Verify in GA4 Realtime + DebugView with `?debug_mode=1`.

## 7. Dashboard automation — geodha_scraper (guidance)

Repo: `C:\GEODHA_App\geodha_scraper` (Python: scraper.py, build_export.py,
resolution_tracker.py, run_daily.py; a `geodha-scraper.service` systemd unit
already exists). Today the monthly normalized weights are produced manually and
pushed into the site's data.

**Key insight:** the dashboard already reads ward stats from Firestore
(`useWardStats` → WardData), and there's an admin page (`WardDataAdmin`).
So automation should write to **Firestore**, not commit JSON to the repo —
no site redeploy needed, updates are instant.

Recommended architecture (two tiers):

1. **Monthly weights — GitHub Actions cron** (free, no server):
   - Private repo for the scraper. Workflow: `schedule: cron '0 3 1 * *'`
     (1st of month) → run scraper (raw complaint counts only — Pratul confirms
     this is fast) → compute normalized weights → write to Firestore via
     `firebase-admin` with a service-account key stored as a GitHub secret.
   - Add a `last_updated` doc so the dashboard subtitle ("May 2026 · …" is
     currently HARD-CODED in DashboardPage.tsx) can render from data.
2. **Daily resolution tracking — needs persistence, pick one:**
   - GitHub Actions daily cron with state in Firestore (each complaint id →
     first_seen, last_seen_open, resolved_at). No server needed; ~free.
   - OR the existing systemd service on an always-on box/VPS (₹300–500/mo or a
     spare Raspberry Pi) if runs are long or need images.
   - Images: download only on demand (they're needed "for other purposes", not
     the weights) — store in Firebase Storage, keyed by complaint id, with a
     size cap.
3. **Weighted function** (v1 proposal — tune with real data):
   `ward_score = Σ_category w_c · normalize(count_c / ward_population_or_area) · staleness`
   plus a resolution-quality term: `r = median_resolution_days / city_median`,
   final `score' = score · (0.7 + 0.3·min(r, 2))` so slow-resolving wards rank
   worse. Keep percentile banding (existing `computeScale`) on top.
4. Migration path: keep `build_export.py` output shape identical to the
   Firestore `WardData` schema (`garbage_dump`, `garbage_vehicle_not_arrived`,
   `burning_of_garbage`, `total_reports`, ward_num/name) so the site needs no changes.

First session on this: wire scraper → Firestore locally (one-off backfill),
then add the GitHub Action, then the daily tracker.
