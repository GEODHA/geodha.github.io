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

> STATUS 2026-07-07: core DONE (Fable session). `src/config/appLinks.ts`
> (PLAY_STORE_URL + IOS_APP_URL). App shipped on the public App Store
> 2026-07-24: https://apps.apple.com/in/app/geodha/id6779552306. New
> `StoreButtons` component (with store_click GA events) used in Hero;
> Footer has both store links.
> REMAINING: official store badge assets (do during redesign, §4); add
> StoreButtons to GetStarted when that page's content is written; consider
> OS-detecting smart link for shares.

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

> STATUS 2026-07-07: FOUNDATION DONE (Fable session). The kit is a
> **neo-brutalist "street-poster" system**: white surfaces, 2–3px solid ink
> (#161614) outlines, hard offset shadows (3/4/6px, no blur), pill buttons
> (radius 30px, weight 800), radii 12·16·20·pill, Archivo (400–900) + Space
> Mono for uppercase overline labels, bg #EDEDEA.
>
> Landed in the codebase:
> - index.html: fonts → Archivo + Space Mono + Noto Sans Kannada (Barlow/Inter removed).
> - src/index.css: shadcn tokens remapped to kit palette (primary=green #1FA75C,
>   secondary/warning=yellow #FFCE2B, accent=blue #2C7BE5, destructive=#E5484D,
>   background=#EDEDEA, radius 0.75rem); new tokens --ink/--paper/--tint-* and
>   --shadow-offset-3/4/6; body+headings → Archivo (headings weight 800,
>   tracking -0.02em); utilities: .card-poster, .btn-poster (with pressed
>   translate), .chip-poster, .mono-label, .divider-poster.
> - tailwind.config.ts: font-sans/font-mono set; colors ink/paper/tint-{yellow,green,blue,red}.
> - All inline 'Barlow Condensed' styles replaced with 'Archivo' (14 files).
>
> REMAINING (per-page propagation — Sonnet with the above utilities):
> 1. Cards/buttons/chips across pages → .card-poster/.btn-poster/.chip-poster
>    (Hero CTAs, Index problem/resource/service cards, StoreButtons, dashboards
>    sheets, guide cards). Meta lines (dates, wards) → .mono-label.
> 2. shadcn ui/button variants: add a `poster` variant instead of ad-hoc classes.
> 3. Dark section on Index and .dark tokens in index.css still use the old
>    palette — restyle or drop dark mode.
> 4. Severity BAND colors (src/lib/severity.ts) → align badge/card tints with
>    kit tints (#FFF6D6/#E7F6EE/#E5EFFD/#FDE4E5) + ink borders.
> 5. Kit reference: uploaded "GEODHA UI Kit.html" (1.7MB bundler export; the
>    readable markup is inside the last <script type="__bundler/template">).
>    Status pill pattern: tint bg + 2px ink border + colored dot with 1.5px ink border.

### 4a. HOMEPAGE BLUEPRINT (from Pratul's "Option 1A · Street Poster" mockups, 2026-07-07)

> STATUS 2026-07-07 (later session): BUILT — Index.tsx fully rewritten per this
> blueprint (i18n-enabled); Navigation + Footer restyled (poster chrome, ink
> footer band); StoreButtons → black poster tiles; TopBanner + ScrollingBanner
> deleted (redundant); .bg-stripes-yellow/.bg-blueprint utilities added; stats
> honest & configurable via STATS const in Index.tsx (users placeholder "100+"
> — TODO wire real count). FourElements on About rebuilt as "drag to restore"
> reveal cards (reality⇄ideal wipe, red/green status pill), using old image
> sets 2 (ideal) & 3 (reality); set 1 images now unused.
> REMAINING per-page propagation: Report, Guides (WasteGuide/BWG), Privacy,
> Dashboard chrome, HowItWorks component + items 2–4 below.
>
> UPDATE 2026-07-08: homepage REPLACED by a simple narrative landing page
> (Mission → Problem carousel → Solutions [app screenshots carousel +
> locked live DashboardPreview] → stats [150+/100+/~10] → Blog/Guide/Volunteer
> cards → Contribute CTA; "Data for Action…" marquee). New components:
> SimpleCarousel, DashboardPreview; new config src/config/community.ts
> (WHATSAPP_COMMUNITY_URL placeholder — button hidden until set). Problem
> photos auto-load from src/assets/problem/. Landing strings are English-only
> (TODO i18n). Data page DELETED (/data now redirects to /dashboard; nav +
> footer links removed). FourElements = single-toggle v3. Volunteer page:
> poster styles + karmana.in events block. About: poster card pass done.

Rebuild `Index.tsx` (+ Navigation/Footer) to match the mockups. The mockup
content is PLACEHOLDER — real-content mapping decided below. Reuse the
foundation utilities (.card-poster/.btn-poster/.chip-poster/.mono-label).

Sections top→bottom:
1. **Nav**: white bar, ink border-bottom; logo = green pin + GEODHA 900
   wordmark; right: links + yellow pill CTA "Get the app" (→ StoreButtons
   anchor or Play link).
2. **Hero, 2-col**: LEFT (white): mono overline "● BENGALURU CIVIC ACTION";
   display type stacked "See it. / Snap it. / Solve it." (middle line green,
   Archivo 900, tight leading ~0.95); body copy (reuse current 30-seconds
   pitch); buttons: green pill "Report a problem" (camera icon) + white
   outline pill "See the map" (→ /report, /dashboard). RIGHT: yellow panel
   with diagonal stripes (repeating-linear-gradient 45deg #FFCE2B/#FFD84F),
   real photo in ink-bordered rotated card w/ offset shadow, floating white
   chip "CLEARED IN 3 DAYS" style (use a real resolved-report caption).
   Blue circle accent peeking behind panel edge.
3. **Stats band**: ink bg, 3 cols, Archivo 900 white numbers + colored
   .mono-label captions (yellow/green/blue). REAL DATA: reports count (from
   Firestore app reports or scraper monthly total), "198 WARDS COVERED"
   (verify against ward-boundaries.json feature count), resolved % (compute
   from report statuses; omit the stat if not defensible).
4. **"What we tackle, together"**: h2 + right-aligned mono caption ("Tap a
   category, add a photo, done."). 4 tint cards (tint-yellow/green/blue/white),
   each: ink-bordered icon square (colored bg) + title + one-liner.
   REAL CATEGORIES (not mockup's drains/lakes): Garbage dumps · Open burning ·
   Missed collections (garbage vehicle) · Segregation & guides (→ /guide).
5. **Blue app section**: blue bg with blueprint grid (thin white lines),
   heading "The whole city, in your pocket."; CSS phone mockups (port the
   existing dark-section phone shell, restyle to kit: ink borders, white
   screens showing live-map / new-report / resolved-timeline vignettes).
   APP IS LIVE: replace mockup's "COMING SOON" chip with yellow chip "NOW
   AVAILABLE"; StoreButtons (Play + App Store) styled as black store tiles.
   This REPLACES the current slate-900 bottom section.
6. **Split section**: LEFT (white) "FOR CITIZENS / Get started": list rows
   (.card-poster-lite rows w/ icon chip + arrow): Citizen guides → /guide,
   Volunteer → /volunteer. RIGHT (tint-yellow) "FOR EVERYONE / Explore the
   data": Dashboard → /dashboard, Open data → /data, Stories & blog → /blog.
7. **Green CTA band**: primary green, centered white display "Your street.
   Your move.", sub-line, yellow pill "Report your first problem" → /report.
8. **Footer**: ink band, GEODHA wordmark + mono "geodha.org", right links
   (Map/Resources/About/Contact + store links). Replaces current footer style.

Notes: TopBanner likely redundant with this design (app availability is
section 5) — remove on the redesigned home. Keep GA events (store_click etc.).
Old sections not in mockup (testimonials video, ScrollingBanner, FourElements
etc.): drop from home unless Pratul objects; content lives on inner pages.

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

> STATUS 2026-07-07 (later session): FOUNDATION DONE. Custom lightweight typed
> i18n (src/i18n/: index.tsx provider + en.ts + kn.ts) — NO external deps
> (chosen over react-i18next to avoid npm-install friction; locale files are
> shaped for easy migration if ever needed). Working language switcher in
> Navigation (English/ಕನ್ನಡ, persisted to localStorage, sets <html lang>, fires
> GA language_change). Translated: nav, footer, homepage, StoreButtons.
> Kannada is machine-drafted — NEEDS NATIVE-SPEAKER REVIEW (noted in kn.ts).
> REMAINING: extend Dict + translations to Dashboard (incl. severity BAND
> labels), About, Guides, Report, Data, Volunteer; Hindi later by adding hi.ts;
> per-route titles in App.tsx ROUTE_TITLES could also localize.

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

> STATUS 2026-07-07: core fix DONE (Fable session). `send_page_view: false` in
> index.html; RouteTracker in App.tsx now owns document.title via ROUTE_TITLES
> map (per-page title effects removed from BWGGuidePage/VolunteerPage/WasteGuide);
> new `src/lib/analytics.ts` trackEvent helper; events wired: ward_selected,
> report_pin_tap, share_click (ward + dashboard), store_click (hero).
> REMAINING: verify in GA4 DebugView; add language_change (§5) and more
> store_click placements (§3) when those features land.

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

> STATUS 2026-07-07: scoped in detail → see **geodha_scraper/AUTOMATION.md**
> (two-tier design: existing image-archiving scraper unchanged; new counts-only
> monthly GitHub Action → Firestore; daily resolution tracker as phase 2;
> Vonter/bbmp-citizen-grievances noted for backfill/validation, ODbL caveat).
> The section below is the original outline — AUTOMATION.md supersedes it.

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
