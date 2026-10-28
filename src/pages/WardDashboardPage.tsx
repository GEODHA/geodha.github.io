// /dashboard/:slug — ward dashboard (e.g. bscc-31, Kasavanahalli). Reached by
// direct URL only. Two tabs (?tab=blackspots selects the second):
//
// • Wet waste pickup — daily snapshot published at 22:00 IST by the app
//   backend: day documents in geodha_public_truck_maps (counts + PNG) and the
//   newest day's pins in geodha_public_truck_map_pins. The newest day is an
//   interactive map; earlier days (or a pins mismatch) show the stored PNG.
//   ?day=YYYY-MM-DD picks an earlier day.
// • Blackspots — live GEODHA app reports focused on the ward, with neighbouring
//   wards for context: the ward's waste report numbers (daily snapshot from
//   geodha_public_stats/reports), a map, and a carousel of large spots.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { GeoJSON } from 'react-leaflet';
import type L from 'leaflet';
import { AlertCircle, ArrowLeft, Download, Loader2, Maximize2, RotateCw, X, ZoomIn, ZoomOut } from 'lucide-react';

import NotFound from './NotFound';
import StoreButtons from '@/components/StoreButtons';
import MapTouchGuard from '@/components/MapTouchGuard';
import MapErrorBoundary from '@/components/MapErrorBoundary';
import TruckPinsMap, { TRUCK_PIN_COLORS } from '@/components/TruckPinsMap';
import CityReportsMap from '@/components/CityReportsMap';
import AutoScrollRow from '@/components/AutoScrollRow';
import { ReportDialog } from '@/components/ReportCard';
import { Skeleton } from '@/components/ui/skeleton';
import { fetchTruckMaps, fetchTruckMapPins, fetchReportStats } from '@/services/geodhaService';
import type { TruckMapDay } from '@/services/geodhaService';
import { reportsService } from '@/services/reportsService';
import type { Report } from '@/services/reportsService';
import { WARD_DASHBOARDS } from '@/config/wardDashboards';
import type { WardDashboard } from '@/config/wardDashboards';
import { CORPORATIONS } from '@/config/gba';
import { WARD_FEATURES, WARD_PROPS, featureBounds, pointInRing } from '@/lib/geo';
import type { WardBoundaryFeature } from '@/lib/geo';
import {
  DATE_LOCALES, STATUS_COLORS, reportLatLng, reportColor, reportSize, categoryLabel, statusLabel, toDate,
} from '@/lib/reportFields';
import { useI18n } from '@/i18n';
import { trackEvent } from '@/lib/analytics';
import { cn } from '@/lib/utils';

type Tab = 'wet-waste' | 'blackspots';

const ARCHIVO = { fontFamily: "'Archivo', sans-serif" };

/** Today's date in Bengaluru as YYYY-MM-DD (en-CA formats ISO-style). */
const todayIST = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());

/** A dateKey is a calendar day, not an instant — format it in UTC so it never shifts. */
const dayDate = (dateKey: string) => new Date(`${dateKey}T00:00:00Z`);

const fileSize = (bytes: number) =>
  bytes >= 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;

const WardDashboardPage = () => {
  const { slug = '' } = useParams();
  const config = WARD_DASHBOARDS[slug.toLowerCase()];
  if (!config) return <NotFound />;
  return <WardDashboardView slug={slug.toLowerCase()} config={config} />;
};

function WardDashboardView({ slug, config }: { slug: string; config: WardDashboard }) {
  const { t, locale } = useI18n();
  const ward = WARD_PROPS[config.wardNum];
  const corp = CORPORATIONS[ward.corp_id];
  const wardName = locale === 'kn' ? ward.ward_name_kn : locale === 'hi' ? config.nameHi : ward.ward_name;
  const corpName = locale === 'kn' ? corp.nameKn : corp.name;

  const [searchParams, setSearchParams] = useSearchParams();
  const tab: Tab = searchParams.get('tab') === 'blackspots' ? 'blackspots' : 'wet-waste';

  const pickTab = (next: Tab) => {
    setSearchParams((p) => {
      const n = new URLSearchParams(p);
      if (next === 'blackspots') n.set('tab', 'blackspots'); else n.delete('tab');
      return n;
    }, { replace: true });
    trackEvent('ward_dashboard_tab', { ward: slug, tab: next });
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: 'wet-waste',  label: t.truckMap.tabWetWaste },
    { key: 'blackspots', label: t.truckMap.tabBlackspots },
  ];

  return (
    <main className="pb-16">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <section className="container pt-6 sm:pt-12 pb-4">
        <Link
          to={`/dashboard?ward=${config.wardNum}`}
          className="inline-flex items-center gap-1 text-sm font-bold text-foreground/70 hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> {t.nav.dashboard}
        </Link>
        <p className="mono-label mt-4">{corpName} · {t.truckMap.ward} {ward.ward_id}</p>
        <h1 className="mt-2 text-3xl sm:text-5xl font-extrabold tracking-tight" style={ARCHIVO}>{wardName}</h1>
      </section>

      {/* ── Tabs ───────────────────────────────────────────────────────── */}
      <section className="container max-w-3xl">
        <div role="tablist" className="flex gap-2 rounded-full border-2 border-ink bg-paper p-1">
          {tabs.map(({ key, label }) => (
            <button
              key={key}
              role="tab"
              aria-selected={tab === key}
              onClick={() => pickTab(key)}
              className={cn(
                'flex-1 rounded-full px-3 py-2 text-sm font-extrabold transition-colors',
                tab === key ? 'bg-ink text-paper' : 'text-foreground/70 hover:bg-muted',
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </section>

      <section className="container max-w-3xl mt-5" role="tabpanel">
        {tab === 'wet-waste'
          ? <WetWasteTab slug={slug} config={config} wardName={wardName} />
          : <BlackspotsTab slug={slug} config={config} wardName={wardName} />}
      </section>

      {/* ── CTA ────────────────────────────────────────────────────────── */}
      <section className="container max-w-3xl mt-10">
        <div
          className="flex flex-col gap-5 rounded-2xl border-[3px] border-ink bg-stripes-yellow p-5 sm:p-7"
          style={{ boxShadow: 'var(--shadow-offset-6)' }}
        >
          <div className="bg-paper border-2 border-ink rounded-xl px-4 py-3">
            <p className="text-lg sm:text-2xl font-extrabold" style={ARCHIVO}>
              {tab === 'wet-waste' ? t.truckMap.ctaTitle(wardName) : t.truckMap.bsCtaTitle(wardName)}
            </p>
            <p className="text-sm text-foreground/75 mt-1">
              {tab === 'wet-waste' ? t.truckMap.ctaBody : t.truckMap.bsCtaBody}
            </p>
          </div>
          <StoreButtons placement={`ward_${slug}_cta`} />
        </div>
      </section>
    </main>
  );
}

// ── Wet waste pickup tab ─────────────────────────────────────────────────────

function WetWasteTab({ slug, config, wardName }: { slug: string; config: WardDashboard; wardName: string }) {
  const { t, locale } = useI18n();
  const dl = DATE_LOCALES[locale];

  // Daily snapshot: fetch once per page view, never poll. Re-runs replace a
  // day's image URL, so nothing is kept past this page view.
  const { data: days = [], isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['truckMaps', config.wardKey],
    queryFn: () => fetchTruckMaps(config.wardKey),
    retry: 1,
    gcTime: 0,
    refetchOnWindowFocus: false,
  });
  const { data: pins, isLoading: pinsLoading } = useQuery({
    queryKey: ['truckMapPins', config.wardKey],
    queryFn: () => fetchTruckMapPins(config.wardKey),
    retry: false,
    gcTime: 0,
    refetchOnWindowFocus: false,
  });

  const [searchParams, setSearchParams] = useSearchParams();
  const day = days.find((d) => d.dateKey === searchParams.get('day')) ?? days[0];
  const isLatest = day != null && day === days[0];
  // Newest day is interactive only when the pins are for that same day;
  // otherwise (re-run in progress, pins missing/unreadable) show its PNG.
  const livePins = isLatest && pins && pins.dateKey === day.dateKey ? pins : null;
  const interactive = livePins != null;
  const waitingForPins = isLatest && pinsLoading;

  const pickDay = (d: TruckMapDay) => {
    setSearchParams((p) => {
      const n = new URLSearchParams(p);
      if (d === days[0]) n.delete('day'); else n.set('day', d.dateKey);
      return n;
    }, { replace: true });
    trackEvent('truck_map_day', { ward: slug, date: d.dateKey });
  };

  const [viewerOpen, setViewerOpen] = useState(false);

  const pinLabels = useMemo(() => ({
    collected:  t.truckMap.popupCollected,
    missed:     t.truckMap.popupMissed,
    daysInARow: t.truckMap.popupDays,
  }), [t]);

  const fmtLongDate = (k: string) => dayDate(k).toLocaleDateString(dl, { timeZone: 'UTC', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const fmtAltDate  = (k: string) => dayDate(k).toLocaleDateString(dl, { timeZone: 'UTC', day: 'numeric', month: 'long', year: 'numeric' });
  const fmtChipDay  = (k: string) => dayDate(k).toLocaleDateString(dl, { timeZone: 'UTC', weekday: 'short' });
  const fmtChipDate = (k: string) => dayDate(k).toLocaleDateString(dl, { timeZone: 'UTC', day: 'numeric', month: 'short' });
  const fmtUpdated  = (d: Date) => `${d.toLocaleString(dl, { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })} IST`;
  const fmtNum      = (n: number) => n.toLocaleString(dl);
  const pct         = (d: TruckMapDay) => (d.residents > 0 ? Math.round((d.collected / d.residents) * 100) : 0);

  const alt = day ? t.truckMap.mapAlt(wardName, fmtAltDate(day.dateKey), day.residents, day.collected, day.missed) : '';

  return (
    <>
      <p className="text-base sm:text-lg text-foreground/75 mb-5">{t.truckMap.subtitle}</p>

      {isLoading ? (
        <LoadingSkeleton />
      ) : isError ? (
        <div className="rounded-2xl border-[3px] border-ink bg-tint-red px-5 py-8 text-center" style={{ boxShadow: 'var(--shadow-offset-4)' }}>
          <AlertCircle className="h-6 w-6 mx-auto" />
          <p className="mt-2 font-bold">{t.truckMap.loadError}</p>
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="mt-4 inline-flex items-center gap-2 rounded-full border-2 border-ink bg-paper px-4 py-2 text-sm font-extrabold disabled:opacity-60"
          >
            <RotateCw className={cn('h-4 w-4', isFetching && 'animate-spin')} /> {t.truckMap.retry}
          </button>
        </div>
      ) : !day ? (
        <div className="rounded-2xl border-[3px] border-dashed border-ink/40 bg-muted px-6 py-10 text-center">
          <p className="font-extrabold">{t.truckMap.emptyTitle}</p>
          <p className="mono-label mt-2">{t.truckMap.empty}</p>
        </div>
      ) : (
        <>
          {/* ── Date ─────────────────────────────────────────────────── */}
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold" style={ARCHIVO}>{fmtLongDate(day.dateKey)}</h2>
            <p className="text-sm text-foreground/70 mt-0.5">
              {t.truckMap.snapshotNote(fmtAltDate(day.dateKey))}
              {day.generatedAt && <> {t.truckMap.updated} {fmtUpdated(day.generatedAt)}.</>}
            </p>
            {isLatest && day.dateKey !== todayIST() && (
              <p className="mono-label mt-1 !text-[11px]">{t.truckMap.todayPending}</p>
            )}
          </div>

          {/* ── Counts ───────────────────────────────────────────────── */}
          <div className="mt-4 grid grid-cols-3 gap-2 sm:gap-4">
            <CountTile value={fmtNum(day.residents)} label={t.truckMap.statResidents} tint="bg-paper" />
            <CountTile value={fmtNum(day.collected)} label={t.truckMap.statCollected} tint="bg-tint-green" dot={TRUCK_PIN_COLORS.collected} />
            <CountTile value={fmtNum(day.missed)}    label={t.truckMap.statMissed}    tint="bg-tint-red"   dot={TRUCK_PIN_COLORS.missed} />
          </div>
          <p className="mt-3 text-sm font-bold">
            {t.truckMap.pctCollected(pct(day))}
            {day.longMissed > 0 && (
              <span className="text-[#b91c1c]"> · {t.truckMap.longMissed(day.longMissed, day.streakDays)}</span>
            )}
          </p>

          {/* ── Map: interactive for the newest day, PNG otherwise ───── */}
          {waitingForPins ? (
            <Skeleton className="mt-4 h-[65vh] min-h-[340px] max-h-[640px] w-full rounded-2xl" />
          ) : livePins ? (
            <>
              <MapTouchGuard
                exploreLabel={t.truckMap.mapExplore}
                doneLabel={t.truckMap.mapDone}
                className="mt-4 h-[65vh] min-h-[340px] max-h-[640px] rounded-2xl border-[3px] border-ink overflow-hidden isolate"
                style={{ boxShadow: 'var(--shadow-offset-4)' }}
              >
                <MapErrorBoundary>
                  <TruckPinsMap data={livePins} labels={pinLabels} />
                </MapErrorBoundary>
              </MapTouchGuard>
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs font-medium text-foreground/70">
                <span className="inline-flex items-center gap-1.5"><LegendDot color={TRUCK_PIN_COLORS.collected} />{t.truckMap.legendCollected}</span>
                <span className="inline-flex items-center gap-1.5"><LegendDot color={TRUCK_PIN_COLORS.missed} />{t.truckMap.legendMissed}</span>
                <span className="inline-flex items-center gap-1.5"><LegendDot color={TRUCK_PIN_COLORS.missed} ringed />{t.truckMap.legendLong(livePins.streakDays)}</span>
                <span className="inline-flex items-center gap-1.5"><LegendLine color={TRUCK_PIN_COLORS.boundary} dashed />{t.truckMap.legendBoundary}</span>
              </div>
            </>
          ) : (
            <>
              <button
                onClick={() => { setViewerOpen(true); trackEvent('truck_map_zoom', { ward: slug, date: day.dateKey }); }}
                className="group relative mt-4 block w-full rounded-2xl border-[3px] border-ink overflow-hidden bg-muted"
                style={{ boxShadow: 'var(--shadow-offset-4)', aspectRatio: `${day.image.width} / ${day.image.height}` }}
                aria-describedby="truck-map-hint"
              >
                <img
                  key={day.image.url}
                  src={day.image.url}
                  alt={alt}
                  width={day.image.width}
                  height={day.image.height}
                  loading="lazy"
                  className="block w-full h-auto"
                />
                <span className="absolute bottom-2 right-2 inline-flex items-center gap-1 rounded-full border-2 border-ink bg-paper px-2.5 py-1 text-xs font-bold">
                  <Maximize2 className="h-3.5 w-3.5" />
                </span>
              </button>
              <p id="truck-map-hint" className="mt-2 text-xs text-foreground/60">{t.truckMap.tapToZoom}</p>
            </>
          )}

          {/* ── Download ─────────────────────────────────────────────── */}
          {/* Storage serves the PNG with Content-Disposition: attachment, so a plain link downloads it. */}
          <a
            href={day.image.url}
            onClick={() => trackEvent('truck_map_download', { ward: slug, date: day.dateKey })}
            className="mt-4 flex w-full sm:w-auto sm:inline-flex items-center justify-center gap-2 rounded-full border-[2.5px] border-ink bg-secondary text-secondary-foreground px-5 py-3 font-extrabold transition-transform active:translate-x-[2px] active:translate-y-[2px]"
            style={{ boxShadow: 'var(--shadow-offset-3)' }}
          >
            <Download className="h-4 w-4" />
            {t.truckMap.download}
            {day.image.bytes > 0 && (
              <span className="font-mono text-xs font-bold opacity-70">PNG, {fileSize(day.image.bytes)}</span>
            )}
          </a>

          {/* ── Day picker ───────────────────────────────────────────── */}
          {days.length > 1 && (
            <div className="mt-8">
              <p className="mono-label mb-2">{t.truckMap.pickDay}</p>
              <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0" role="group" aria-label={t.truckMap.pickDay}>
                {days.map((d) => {
                  const active = d === day;
                  return (
                    <button
                      key={d.dateKey}
                      onClick={() => pickDay(d)}
                      aria-pressed={active}
                      className={cn(
                        'shrink-0 min-w-[4.5rem] rounded-xl border-2 border-ink px-3 py-2 text-center transition-colors',
                        active ? 'bg-ink text-paper' : 'bg-paper hover:bg-muted',
                      )}
                    >
                      <span className="block text-[11px] font-bold uppercase opacity-70">{fmtChipDay(d.dateKey)}</span>
                      <span className="block text-sm font-extrabold whitespace-nowrap">{fmtChipDate(d.dateKey)}</span>
                      <span className="block text-[11px] font-bold tabular-nums" style={{ color: active ? undefined : pct(d) >= 50 ? '#15803d' : '#b91c1c' }}>
                        {pct(d)}%
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Explainer ────────────────────────────────────────────── */}
          <div className="mt-8 rounded-2xl border-2 border-ink bg-paper p-4 sm:p-5">
            <h2 className="font-extrabold">{t.truckMap.explainTitle}</h2>
            <ul className="mt-3 space-y-2 text-sm">
              <li>{t.truckMap.explainDot}</li>
              <li className="flex items-start gap-2"><LegendDot color={TRUCK_PIN_COLORS.collected} />{t.truckMap.explainGreen}</li>
              <li className="flex items-start gap-2"><LegendDot color={TRUCK_PIN_COLORS.missed} />{t.truckMap.explainRed}</li>
              <li className="flex items-start gap-2"><LegendDot color={TRUCK_PIN_COLORS.missed} ringed />{t.truckMap.explainRing(day.streakDays)}</li>
              <li>{t.truckMap.explainApprox}</li>
              <li className="text-foreground/70">{t.truckMap.explainSource}</li>
            </ul>
            <p className="mt-3 text-[11px] text-foreground/50">{t.truckMap.credit}</p>
          </div>

          {viewerOpen && !interactive && (
            <MapViewer day={day} alt={alt} onClose={() => setViewerOpen(false)} />
          )}
        </>
      )}
    </>
  );
}

// ── Blackspots tab ───────────────────────────────────────────────────────────

const CAROUSEL_LIMIT = 20;

const newestFirst = (a: Report, b: Report) =>
  (toDate(b.createdAt)?.getTime() ?? 0) - (toDate(a.createdAt)?.getTime() ?? 0);

/** True when [lat, lng] is inside the ward's polygon(s). */
function inFeature([lat, lng]: [number, number], f: WardBoundaryFeature): boolean {
  const g = f.geometry;
  if (g.type === 'Polygon') return pointInRing(lat, lng, g.coordinates[0] as number[][]);
  return (g.coordinates as number[][][][]).some((poly) => pointInRing(lat, lng, poly[0]));
}

function BlackspotsTab({ slug, config, wardName }: { slug: string; config: WardDashboard; wardName: string }) {
  const { t, locale } = useI18n();
  const dl = DATE_LOCALES[locale];

  // Same source and cache as the city pages; only fetched once this tab opens.
  const { data: allReports = [], isLoading, isError } = useQuery({
    queryKey: ['reports', 'all'],
    queryFn: () => reportsService.getReports(),
    staleTime: 5 * 60 * 1000,
  });

  const feature = useMemo(
    () => WARD_FEATURES.find((f) => f.properties.ward_num === config.wardNum)!,
    [config.wardNum],
  );
  const wardBounds = useMemo(() => featureBounds(feature.geometry)!, [feature]);
  // Initial view: the ward plus a little margin. Reports and neighbouring
  // ward outlines cover a wider area so panning out shows what's around.
  const viewBounds = useMemo(() => wardBounds.pad(0.08), [wardBounds]);
  const area       = useMemo(() => wardBounds.pad(0.5), [wardBounds]);
  const neighbours = useMemo<GeoJSON.FeatureCollection>(() => ({
    type: 'FeatureCollection',
    features: WARD_FEATURES.filter((f) => f !== feature && featureBounds(f.geometry)?.intersects(area)),
  }), [feature, area]);

  const nearby = useMemo(
    () => allReports
      .filter((r) => {
        const ll = reportLatLng(r);
        return r.id && r.status !== 'archived' && ll && area.contains(ll);
      })
      .sort(newestFirst),
    [allReports, area],
  );
  const inWard = useMemo(() => nearby.filter((r) => inFeature(reportLatLng(r)!, feature)), [nearby, feature]);

  // Headline numbers come from the daily (22:00 IST) snapshot, read once per
  // page load — not from the reports above.
  const { data: reportStats, isLoading: statsLoading } = useQuery({
    queryKey: ['reportStats'],
    queryFn: fetchReportStats,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });
  const wardStats = reportStats?.wards[config.wardKey];

  const largeReports = useMemo(
    () => inWard.filter((r) => reportSize(r) === 'large' && r.photos?.[0]).slice(0, CAROUSEL_LIMIT),
    [inWard],
  );

  // ── Selection / map focus ────────────────────────────────────────────────
  const [selected, setSelected] = useState<Report | null>(null);
  const [focus, setFocus] = useState<{ latlng: [number, number]; key: number } | null>(null);
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);

  const openReport = useCallback((r: Report, source: string) => {
    setSelected(r);
    trackEvent('report_open', { report_id: r.id, source, ward: slug });
  }, [slug]);

  const handlePinSelect = useCallback((id: string) => {
    const r = nearby.find((x) => x.id === id);
    if (r) openReport(r, 'map');
  }, [nearby, openReport]);

  const viewOnMap = (r: Report) => {
    const ll = reportLatLng(r);
    setSelected(null);
    if (!ll) return;
    setHighlightId(r.id ?? null);
    setFocus({ latlng: ll, key: Date.now() });
    mapRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const onEachNeighbour = useCallback((f: GeoJSON.Feature, layer: L.Layer) => {
    const p = f.properties as WardBoundaryFeature['properties'];
    (layer as L.Path).bindTooltip(locale === 'kn' ? p.ward_name_kn : p.ward_name, { sticky: true });
  }, [locale]);

  const fmtNum  = (n: number) => n.toLocaleString(dl);
  const fmtDate = (ts: unknown) => toDate(ts)?.toLocaleDateString(dl, { day: 'numeric', month: 'short', year: 'numeric' }) ?? '';
  const stat    = (n: number | undefined) => (n == null ? '—' : fmtNum(n));

  return (
    <>
      <p className="text-base sm:text-lg text-foreground/75 mb-5">{t.truckMap.bsSubtitle(wardName)}</p>

      {/* ── Waste report numbers (daily snapshot) ────────────────────── */}
      <p className="mono-label mb-2">{t.truckMap.bsStatsScope(wardName)}</p>
      {!statsLoading && !wardStats ? (
        <p className="rounded-2xl border-[3px] border-dashed border-ink/40 bg-muted px-4 py-5 text-center text-sm font-bold">
          {t.truckMap.rsUnavailable}
        </p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-4">
            <CountTile value={stat(wardStats?.totalReports)}    label={t.truckMap.rsTotal}    note={t.truckMap.rsTotalNote}    tint="bg-paper" />
            <CountTile value={stat(wardStats?.sentToSahaaya)}   label={t.truckMap.rsSent}     note={t.truckMap.rsSentNote}     tint="bg-tint-blue" />
            <CountTile value={stat(wardStats?.closedOnSahaaya)} label={t.truckMap.rsClosed}   note={t.truckMap.rsClosedNote}   tint="bg-tint-yellow" dot={STATUS_COLORS.closed} />
            <CountTile value={stat(wardStats?.resolvedByUsers)} label={t.truckMap.rsResolved} note={t.truckMap.rsResolvedNote} tint="bg-tint-green"  dot={STATUS_COLORS.resolved} />
          </div>
          {reportStats?.updatedAt && (
            <p className="mt-2 text-xs text-foreground/60">
              {t.truckMap.rsUpdated(`${reportStats.updatedAt.toLocaleString(dl, { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })} IST`)}
            </p>
          )}
        </>
      )}

      {/* ── Map ──────────────────────────────────────────────────────── */}
      <div ref={mapRef}>
        <MapTouchGuard
          exploreLabel={t.truckMap.mapExplore}
          doneLabel={t.truckMap.mapDone}
          className="mt-4 h-[65vh] min-h-[340px] max-h-[640px] rounded-2xl border-[3px] border-ink overflow-hidden isolate"
          style={{ boxShadow: 'var(--shadow-offset-4)' }}
        >
          <MapErrorBoundary>
            <CityReportsMap
              bounds={viewBounds}
              zoomSnap={0.25}
              reports={nearby}
              focus={focus}
              highlightId={highlightId}
              onReportSelect={handlePinSelect}
            >
              <GeoJSON
                key={`neighbours-${locale}`}
                data={neighbours}
                onEachFeature={onEachNeighbour}
                style={{ color: '#374151', weight: 1.5, opacity: 0.7, fillOpacity: 0 }}
              />
              <GeoJSON
                data={feature}
                interactive={false}
                style={{ color: TRUCK_PIN_COLORS.boundary, weight: 3, dashArray: '6 6', fillColor: TRUCK_PIN_COLORS.boundary, fillOpacity: 0.05 }}
              />
            </CityReportsMap>
          </MapErrorBoundary>
          {(isLoading || isError) && (
            <div className="absolute inset-0 z-[1000] flex items-center justify-center bg-paper/70 pointer-events-none">
              <p className="flex items-center gap-2 font-bold bg-paper border-2 border-ink rounded-full px-4 py-2 text-sm">
                {isLoading
                  ? <><Loader2 className="h-4 w-4 animate-spin" /> {t.truckMap.bsLoading}</>
                  : <><AlertCircle className="h-4 w-4" /> {t.truckMap.bsLoadError}</>}
              </p>
            </div>
          )}
        </MapTouchGuard>
      </div>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs font-medium text-foreground/70">
        <span className="inline-flex items-center gap-1.5"><LegendDot color={STATUS_COLORS.pending} />{t.truckMap.bsPending}</span>
        <span className="inline-flex items-center gap-1.5"><LegendDot color={STATUS_COLORS.closed} />{t.truckMap.bsClosed}</span>
        <span className="inline-flex items-center gap-1.5"><LegendDot color={STATUS_COLORS.resolved} />{t.truckMap.bsResolved}</span>
        <span className="inline-flex items-center gap-1.5"><LegendLine color={TRUCK_PIN_COLORS.boundary} dashed />{t.truckMap.legendBoundary}</span>
        <span className="inline-flex items-center gap-1.5"><LegendLine color="#374151" />{t.truckMap.legendNeighbours}</span>
      </div>
      <p className="mt-1.5 text-xs text-foreground/60">{t.truckMap.bsMapNote} {t.truckMap.bsMapLive}</p>

      {/* ── Large spots carousel ─────────────────────────────────────── */}
      <div className="mt-10">
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight" style={ARCHIVO}>{t.truckMap.bsLargeTitle}</h2>
        <p className="text-sm sm:text-base text-foreground/70 mt-1 mb-4">{t.truckMap.bsLargeBody(wardName)}</p>
        {largeReports.length === 0 ? (
          <div className="rounded-2xl border-[3px] border-dashed border-ink/40 bg-muted px-6 py-10 text-center">
            {isLoading ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : <p className="mono-label">{t.truckMap.bsLargeEmpty}</p>}
          </div>
        ) : (
          <AutoScrollRow
            items={largeReports}
            getKey={(r) => r.id!}
            renderItem={(r) => (
              <button
                onClick={() => openReport(r, 'carousel_large')}
                className="group block w-60 sm:w-72 text-left rounded-2xl border-[3px] border-ink overflow-hidden bg-paper"
                style={{ boxShadow: 'var(--shadow-offset-3)' }}
              >
                <div className="relative">
                  <img src={r.photos[0]} alt={categoryLabel(t, r.category)} loading="lazy" className="w-full aspect-[4/3] object-cover bg-muted transition-transform duration-300 group-hover:scale-105" />
                  <span
                    className="absolute top-2 left-2 text-[11px] font-bold text-white rounded-full px-2 py-0.5 border-2 border-white"
                    style={{ background: reportColor(r) }}
                  >
                    {statusLabel(t, r)}
                  </span>
                </div>
                <div className="px-3 py-2 border-t-[3px] border-ink">
                  <p className="font-extrabold truncate">{categoryLabel(t, r.category)}</p>
                  <p className="text-xs text-foreground/60 truncate">{r.location?.address || fmtDate(r.createdAt)}</p>
                </div>
              </button>
            )}
          />
        )}
      </div>

      <ReportDialog report={selected} onClose={() => setSelected(null)} onViewOnMap={viewOnMap} />
    </>
  );
}

// ── Small pieces ─────────────────────────────────────────────────────────────

function CountTile({ value, label, note, tint, dot }: { value: string; label: string; note?: string; tint: string; dot?: string }) {
  return (
    <div className={cn('rounded-2xl border-[3px] border-ink p-3 sm:p-5', tint)} style={{ boxShadow: 'var(--shadow-offset-3)' }}>
      <p className="text-3xl sm:text-5xl font-extrabold tabular-nums leading-none" style={ARCHIVO}>{value}</p>
      <p className="mt-2 flex items-center gap-1.5 text-xs sm:text-sm font-extrabold leading-tight">
        {dot && <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: dot }} />}
        {label}
      </p>
      {note && <p className="mt-1 text-[10px] sm:text-xs leading-tight text-foreground/60">{note}</p>}
    </div>
  );
}

function LegendDot({ color, ringed }: { color: string; ringed?: boolean }) {
  return (
    <span
      className="mt-0.5 h-4 w-4 shrink-0 rounded-full"
      style={ringed
        ? { background: color, border: '2px solid white', boxShadow: `0 0 0 2px ${color}` }
        : { background: color, border: '2px solid white', boxShadow: '0 0 0 1px rgba(0,0,0,0.15)' }}
    />
  );
}

function LegendLine({ color, dashed }: { color: string; dashed?: boolean }) {
  return <span className="inline-block w-5 shrink-0" style={{ borderTop: `2.5px ${dashed ? 'dashed' : 'solid'} ${color}` }} />;
}

function LoadingSkeleton() {
  return (
    <div aria-busy="true">
      <Skeleton className="h-7 w-64 max-w-full" />
      <Skeleton className="mt-2 h-4 w-40" />
      <div className="mt-4 grid grid-cols-3 gap-2 sm:gap-4">
        {[0, 1, 2].map((i) => <Skeleton key={i} className="h-20 sm:h-28 rounded-2xl" />)}
      </div>
      <Skeleton className="mt-4 h-[65vh] min-h-[340px] max-h-[640px] w-full rounded-2xl" />
      <Skeleton className="mt-4 h-12 w-full sm:w-56 rounded-full" />
    </div>
  );
}

/**
 * Full-screen PNG viewer. Opens fitted to the screen; tap the image (or the
 * zoom button) for full resolution and pan by scrolling. Native pinch-zoom also works.
 */
function MapViewer({ day, alt, onClose }: { day: TruckMapDay; alt: string; onClose: () => void }) {
  const { t } = useI18n();
  const [zoomed, setZoomed] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const focusPoint = useRef<{ fx: number; fy: number }>({ fx: 0.5, fy: 0.5 });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  // Keep the tapped point under the finger when zooming in.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || !zoomed) return;
    const { fx, fy } = focusPoint.current;
    el.scrollTo({ left: fx * el.scrollWidth - el.clientWidth / 2, top: fy * el.scrollHeight - el.clientHeight / 2 });
  }, [zoomed]);

  const toggleAt = (e: React.MouseEvent<HTMLImageElement>) => {
    if (!zoomed) {
      const r = e.currentTarget.getBoundingClientRect();
      focusPoint.current = { fx: (e.clientX - r.left) / r.width, fy: (e.clientY - r.top) / r.height };
    }
    setZoomed((z) => !z);
  };

  return createPortal(
    <div className="fixed inset-0 z-[9990] flex flex-col bg-black/95" role="dialog" aria-modal="true" aria-label={alt}>
      <div className="flex items-center justify-end gap-2 p-3 shrink-0">
        <a
          href={day.image.url}
          className="inline-flex items-center gap-1.5 rounded-full bg-white/15 hover:bg-white/25 text-white px-3 py-2 text-sm font-bold"
        >
          <Download className="h-4 w-4" /> {t.truckMap.download}
        </a>
        <button
          onClick={() => { focusPoint.current = { fx: 0.5, fy: 0.5 }; setZoomed((z) => !z); }}
          className="rounded-full bg-white/15 hover:bg-white/25 text-white p-2"
          aria-label={zoomed ? t.truckMap.zoomOut : t.truckMap.zoomIn}
        >
          {zoomed ? <ZoomOut className="h-5 w-5" /> : <ZoomIn className="h-5 w-5" />}
        </button>
        <button onClick={onClose} className="rounded-full bg-white/15 hover:bg-white/25 text-white p-2" aria-label={t.truckMap.close}>
          <X className="h-5 w-5" />
        </button>
      </div>
      <div
        ref={scrollRef}
        className={cn('flex-1 min-h-0 overflow-auto', !zoomed && 'flex items-center justify-center p-2')}
        style={{ touchAction: 'pan-x pan-y pinch-zoom' }}
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <img
          src={day.image.url}
          alt={alt}
          width={day.image.width}
          height={day.image.height}
          onClick={toggleAt}
          className={cn(
            'block bg-white',
            zoomed ? 'max-w-none cursor-zoom-out' : 'max-w-full max-h-full w-auto h-auto object-contain cursor-zoom-in',
          )}
          style={zoomed ? { width: day.image.width, height: 'auto' } : undefined}
        />
      </div>
    </div>,
    document.body,
  );
}

export default WardDashboardPage;
