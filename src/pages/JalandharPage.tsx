// /jalandhar — city data page for Jalandhar, Punjab.
// Live GEODHA app reports on a map (centered on Jalandhar, covering all of
// Punjab), a collapsible size/status filter, Punjab-wide counts, and two
// slowly auto-scrolling photo rows: large spots, and cleanups before/after.
// Default language is Hindi (see PATH_DEFAULT_LOCALES in src/i18n).

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ChevronDown, SlidersHorizontal, Loader2, AlertCircle, X } from 'lucide-react';

import CityReportsMap from '@/components/CityReportsMap';
import MapErrorBoundary from '@/components/MapErrorBoundary';
import AutoScrollRow from '@/components/AutoScrollRow';
import StoreButtons from '@/components/StoreButtons';
import { ReportDialog } from '@/components/ReportCard';
import { reportsService } from '@/services/reportsService';
import type { Report, ReportSize } from '@/services/reportsService';
import { useI18n } from '@/i18n';
import { trackEvent } from '@/lib/analytics';
import { cn } from '@/lib/utils';
import {
  JALANDHAR_CENTER, isInPunjab, reportLatLng, reportSize, isCleaned, afterPhoto,
  sizeLabel, categoryLabel, statusLabel, toDate, reportColor, STATUS_COLORS, DATE_LOCALES,
} from '@/lib/reportFields';

type StatusFilter = 'pending' | 'resolved';
const SIZES: ReportSize[] = ['small', 'medium', 'large'];
const CAROUSEL_LIMIT = 20;

const newestFirst = (a: Report, b: Report) =>
  (toDate(b.createdAt)?.getTime() ?? 0) - (toDate(a.createdAt)?.getTime() ?? 0);

const JalandharPage = () => {
  const { t, locale } = useI18n();
  const [searchParams, setSearchParams] = useSearchParams();

  // ── Data ──────────────────────────────────────────────────────────────────
  const { data: allReports = [], isLoading, isError } = useQuery({
    queryKey: ['reports', 'all'],
    queryFn: () => reportsService.getReports(),
    staleTime: 5 * 60 * 1000,
  });

  // Every non-archived Punjab report — Jalandhar plus nearby villages.
  const punjabReports = useMemo(
    () => allReports
      .filter((r) => r.id && r.status !== 'archived' && reportLatLng(r) && isInPunjab(r))
      .sort(newestFirst),
    [allReports],
  );

  const cleanedCount = useMemo(() => punjabReports.filter(isCleaned).length, [punjabReports]);

  const largeReports = useMemo(
    () => punjabReports.filter((r) => reportSize(r) === 'large' && r.photos?.[0]).slice(0, CAROUSEL_LIMIT),
    [punjabReports],
  );
  const cleanups = useMemo(
    () => punjabReports
      .filter((r) => afterPhoto(r) && r.photos?.[0])
      .sort((a, b) => (toDate(b.resolution?.resolvedAt)?.getTime() ?? 0) - (toDate(a.resolution?.resolvedAt)?.getTime() ?? 0))
      .slice(0, CAROUSEL_LIMIT),
    [punjabReports],
  );

  // ── Filters ───────────────────────────────────────────────────────────────
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [sizes,  setSizes]  = useState<ReportSize[]>([]);
  const [status, setStatus] = useState<StatusFilter | null>(null);
  const activeFilters = sizes.length + (status ? 1 : 0);

  const toggleSize = (s: ReportSize) => {
    setSizes((cur) => (cur.includes(s) ? cur.filter((x) => x !== s) : [...cur, s]));
    trackEvent('jalandhar_filter', { kind: 'size', value: s });
  };
  const pickStatus = (s: StatusFilter | null) => {
    setStatus(s);
    trackEvent('jalandhar_filter', { kind: 'status', value: s ?? 'all' });
  };

  // ── Selection / map focus ─────────────────────────────────────────────────
  const [selected, setSelected] = useState<Report | null>(null);
  const [focus, setFocus]       = useState<{ latlng: [number, number]; key: number } | null>(null);
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);

  const filteredReports = useMemo(() => {
    const list = punjabReports.filter((r) => {
      if (sizes.length) {
        const s = reportSize(r);
        if (!s || !sizes.includes(s)) return false;
      }
      if (status === 'resolved' && !isCleaned(r)) return false;
      if (status === 'pending'  &&  isCleaned(r)) return false;
      return true;
    });
    // A report opened via "View on map" stays visible even if filtered out.
    if (highlightId && !list.some((r) => r.id === highlightId)) {
      const h = punjabReports.find((r) => r.id === highlightId);
      if (h) list.push(h);
    }
    return list;
  }, [punjabReports, sizes, status, highlightId]);

  const openReport = useCallback((r: Report, source: string) => {
    setSelected(r);
    if (r.id) setSearchParams((p) => { const n = new URLSearchParams(p); n.set('report', r.id!); return n; }, { replace: true });
    trackEvent('report_open', { report_id: r.id, source, city: 'jalandhar' });
  }, [setSearchParams]);

  const handlePinSelect = useCallback((id: string) => {
    const r = punjabReports.find((x) => x.id === id);
    if (r) openReport(r, 'map');
  }, [punjabReports, openReport]);

  const closeReport = () => {
    setSelected(null);
    setSearchParams((p) => { const n = new URLSearchParams(p); n.delete('report'); return n; }, { replace: true });
  };

  const viewOnMap = (r: Report) => {
    const ll = reportLatLng(r);
    closeReport();
    if (!ll) return;
    setHighlightId(r.id ?? null);
    setFocus({ latlng: ll, key: Date.now() });
    mapRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    trackEvent('report_view_on_map', { report_id: r.id });
  };

  // Deep link: /jalandhar?report=<id> opens that report's card once loaded.
  const deepLinkHandled = useRef(false);
  useEffect(() => {
    if (deepLinkHandled.current || punjabReports.length === 0) return;
    deepLinkHandled.current = true;
    const id = searchParams.get('report');
    const r  = id ? punjabReports.find((x) => x.id === id) : undefined;
    if (r) {
      setSelected(r);
      setHighlightId(r.id ?? null);
      const ll = reportLatLng(r);
      if (ll) setFocus({ latlng: ll, key: Date.now() });
    }
  }, [punjabReports, searchParams]);

  const fmtNum  = (n: number) => n.toLocaleString(DATE_LOCALES[locale]);
  const fmtDate = (ts: unknown) => toDate(ts)?.toLocaleDateString(DATE_LOCALES[locale], { day: 'numeric', month: 'short', year: 'numeric' }) ?? '';

  return (
    <main className="pb-16">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <section className="container pt-8 sm:pt-12 pb-6">
        <p className="mono-label">{t.jalandhar.kicker}</p>
        <h1 className="mt-2 text-3xl sm:text-5xl font-extrabold tracking-tight" style={{ fontFamily: "'Archivo', sans-serif" }}>
          {t.jalandhar.title}
        </h1>
        <p className="mt-3 max-w-2xl text-base sm:text-lg text-foreground/75">{t.jalandhar.subtitle}</p>
      </section>

      {/* ── Filters (collapsed by default) ─────────────────────────────── */}
      <section className="container">
        <div className="rounded-2xl border-[3px] border-ink bg-paper" style={{ boxShadow: 'var(--shadow-offset-4)' }}>
          <button
            onClick={() => setFiltersOpen((o) => !o)}
            className="w-full flex items-center justify-between gap-3 px-4 py-3"
            aria-expanded={filtersOpen}
            aria-controls="jalandhar-filters"
          >
            <span className="flex items-center gap-2 font-extrabold">
              <SlidersHorizontal className="h-4 w-4" />
              {t.jalandhar.filters}
              {activeFilters > 0 && (
                <span className="text-xs font-bold rounded-full bg-secondary border-2 border-ink px-2 leading-5">{activeFilters}</span>
              )}
            </span>
            <span className="flex items-center gap-2 text-sm text-foreground/70">
              {!isLoading && (
                <span className="hidden sm:inline">{fmtNum(filteredReports.length)} {t.jalandhar.showingOnMap}</span>
              )}
              <ChevronDown className={cn('h-5 w-5 transition-transform', filtersOpen && 'rotate-180')} />
            </span>
          </button>

          {filtersOpen && (
            <div id="jalandhar-filters" className="border-t-2 border-dashed border-ink/30 px-4 py-4 space-y-4">
              <FilterGroup label={t.jalandhar.filterSize}>
                <Chip active={sizes.length === 0} onClick={() => setSizes([])}>{t.jalandhar.all}</Chip>
                {SIZES.map((s) => (
                  <Chip key={s} active={sizes.includes(s)} onClick={() => toggleSize(s)}>{sizeLabel(t, s)}</Chip>
                ))}
              </FilterGroup>
              <FilterGroup label={t.jalandhar.filterStatus}>
                <Chip active={status === null} onClick={() => pickStatus(null)}>{t.jalandhar.all}</Chip>
                <Chip active={status === 'pending'} onClick={() => pickStatus('pending')} dot={STATUS_COLORS.pending}>
                  {t.report.statusPending}
                </Chip>
                <Chip active={status === 'resolved'} onClick={() => pickStatus('resolved')} dot={STATUS_COLORS.resolved}>
                  {t.report.statusResolved}
                </Chip>
              </FilterGroup>
              <div className="flex items-center justify-between text-sm">
                <span className="text-foreground/70">{fmtNum(filteredReports.length)} {t.jalandhar.showingOnMap}</span>
                {activeFilters > 0 && (
                  <button
                    onClick={() => { setSizes([]); setStatus(null); }}
                    className="inline-flex items-center gap-1 font-bold underline underline-offset-2"
                  >
                    <X className="h-3.5 w-3.5" /> {t.jalandhar.clearFilters}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── Map ────────────────────────────────────────────────────────── */}
      <section className="container mt-4">
        <div
          ref={mapRef}
          className="relative h-[60vh] min-h-[360px] max-h-[640px] rounded-2xl border-[3px] border-ink overflow-hidden isolate"
          style={{ boxShadow: 'var(--shadow-offset-4)' }}
        >
          <MapErrorBoundary>
            <CityReportsMap
              center={JALANDHAR_CENTER}
              zoom={12}
              reports={filteredReports}
              focus={focus}
              highlightId={highlightId}
              onReportSelect={handlePinSelect}
            />
          </MapErrorBoundary>
          {(isLoading || isError) && (
            <div className="absolute inset-0 z-[1000] flex items-center justify-center bg-paper/70 pointer-events-none">
              <p className="flex items-center gap-2 font-bold bg-paper border-2 border-ink rounded-full px-4 py-2">
                {isLoading
                  ? <><Loader2 className="h-4 w-4 animate-spin" /> {t.jalandhar.loading}</>
                  : <><AlertCircle className="h-4 w-4" /> {t.jalandhar.loadError}</>}
              </p>
            </div>
          )}
        </div>
        {/* Legend */}
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs font-medium text-foreground/70">
          <LegendDot color={STATUS_COLORS.pending}>{t.report.statusPending}</LegendDot>
          <LegendDot color={STATUS_COLORS.closed}>{t.report.statusClosedByOfficials}</LegendDot>
          <LegendDot color={STATUS_COLORS.resolved}>{t.report.statusResolved}</LegendDot>
        </div>
      </section>

      {/* ── Stats ──────────────────────────────────────────────────────── */}
      <section className="container mt-8 grid grid-cols-2 gap-3 sm:gap-5">
        <StatTile value={isLoading ? '—' : fmtNum(punjabReports.length)} label={t.jalandhar.statReported} note={t.jalandhar.statReportedNote} tint="bg-tint-red" />
        <StatTile value={isLoading ? '—' : fmtNum(cleanedCount)} label={t.jalandhar.statCleaned} note={t.jalandhar.statCleanedNote} tint="bg-tint-green" />
      </section>

      {/* ── Large spots carousel ───────────────────────────────────────── */}
      <section className="container mt-12">
        <SectionHeading title={t.jalandhar.largeTitle} body={t.jalandhar.largeBody} />
        {largeReports.length === 0 ? (
          <EmptyRow loading={isLoading}>{t.jalandhar.largeEmpty}</EmptyRow>
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
      </section>

      {/* ── Cleanups before / after carousel ───────────────────────────── */}
      <section className="container mt-10">
        <SectionHeading title={t.jalandhar.cleanupTitle} body={t.jalandhar.cleanupBody} />
        {cleanups.length === 0 ? (
          <EmptyRow loading={isLoading}>{t.jalandhar.cleanupEmpty}</EmptyRow>
        ) : (
          <AutoScrollRow
            items={cleanups}
            speed={18}
            getKey={(r) => r.id!}
            renderItem={(r) => (
              <button
                onClick={() => openReport(r, 'carousel_cleanup')}
                className="block w-80 sm:w-[26rem] text-left rounded-2xl border-[3px] border-ink overflow-hidden bg-paper"
                style={{ boxShadow: 'var(--shadow-offset-3)' }}
              >
                <div className="grid grid-cols-2 gap-0.5 bg-ink">
                  <BeforeAfterImg src={r.photos[0]} label={t.jalandhar.before} />
                  <BeforeAfterImg src={afterPhoto(r)!} label={t.jalandhar.after} green />
                </div>
                <div className="px-3 py-2 border-t-[3px] border-ink">
                  <p className="font-extrabold truncate">{categoryLabel(t, r.category)}</p>
                  <p className="text-xs text-foreground/60 truncate">
                    {t.report.cleanedOn} · {fmtDate(r.resolution?.resolvedAt)}
                  </p>
                </div>
              </button>
            )}
          />
        )}
      </section>

      {/* ── CTA ────────────────────────────────────────────────────────── */}
      <section className="container mt-12">
        <div
          className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 rounded-2xl border-[3px] border-ink bg-stripes-yellow p-5 sm:p-7"
          style={{ boxShadow: 'var(--shadow-offset-6)' }}
        >
          <div className="bg-paper border-2 border-ink rounded-xl px-4 py-3">
            <p className="text-lg sm:text-2xl font-extrabold" style={{ fontFamily: "'Archivo', sans-serif" }}>{t.jalandhar.ctaTitle}</p>
            <p className="text-sm text-foreground/75 mt-1">{t.jalandhar.ctaBody}</p>
          </div>
          <StoreButtons placement="jalandhar_cta" className="shrink-0" />
        </div>
      </section>

      <ReportDialog report={selected} onClose={closeReport} onViewOnMap={viewOnMap} />
    </main>
  );
};

// ── Small pieces ─────────────────────────────────────────────────────────────

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mono-label mb-2">{label}</p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function Chip({ active, onClick, dot, children }: {
  active: boolean; onClick: () => void; dot?: string; children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border-2 border-ink px-3.5 py-1.5 text-sm font-bold transition-colors',
        active ? 'bg-ink text-paper' : 'bg-paper hover:bg-muted',
      )}
    >
      {dot && <span className="h-2.5 w-2.5 rounded-full border border-white" style={{ background: dot }} />}
      {children}
    </button>
  );
}

function LegendDot({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="h-3 w-3 rounded-full border-2 border-white shadow" style={{ background: color }} />
      {children}
    </span>
  );
}

function StatTile({ value, label, note, tint }: { value: string; label: string; note: string; tint: string }) {
  return (
    <div className={cn('rounded-2xl border-[3px] border-ink p-4 sm:p-6', tint)} style={{ boxShadow: 'var(--shadow-offset-4)' }}>
      <p className="text-4xl sm:text-6xl font-extrabold tabular-nums leading-none" style={{ fontFamily: "'Archivo', sans-serif" }}>{value}</p>
      <p className="mt-2 text-sm sm:text-base font-extrabold">{label}</p>
      <p className="mono-label mt-1 !text-[11px]">{note}</p>
    </div>
  );
}

function SectionHeading({ title, body }: { title: string; body: string }) {
  return (
    <div className="mb-4">
      <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight" style={{ fontFamily: "'Archivo', sans-serif" }}>{title}</h2>
      <p className="text-sm sm:text-base text-foreground/70 mt-1">{body}</p>
    </div>
  );
}

function EmptyRow({ loading, children }: { loading: boolean; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border-[3px] border-dashed border-ink/40 bg-muted px-6 py-10 text-center">
      {loading ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : <p className="mono-label">{children}</p>}
    </div>
  );
}

function BeforeAfterImg({ src, label, green }: { src: string; label: string; green?: boolean }) {
  return (
    <figure className="relative">
      <img src={src} alt={label} loading="lazy" className="w-full aspect-[4/5] object-cover bg-muted" />
      <figcaption
        className={cn(
          'absolute top-2 left-2 text-[11px] font-extrabold uppercase tracking-wide rounded-full px-2 py-0.5 border-2 border-ink',
          green ? 'bg-tint-green' : 'bg-paper',
        )}
      >
        {label}
      </figcaption>
    </figure>
  );
}

export default JalandharPage;
