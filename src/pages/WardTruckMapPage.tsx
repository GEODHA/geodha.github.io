// /dashboard/:slug — daily wet waste pickup map for one ward (e.g. bscc-31,
// Kasavanahalli). The PNG and its counts are rendered and published nightly at
// 22:00 IST by the app backend into geodha_public_truck_maps; this page only
// reads them. No per-resident data is fetched — the image is the only place
// locations appear. ?day=YYYY-MM-DD picks an earlier day.

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { AlertCircle, ArrowLeft, Download, Maximize2, RotateCw, X, ZoomIn, ZoomOut } from 'lucide-react';

import NotFound from './NotFound';
import StoreButtons from '@/components/StoreButtons';
import { Skeleton } from '@/components/ui/skeleton';
import { fetchTruckMaps } from '@/services/geodhaService';
import type { TruckMapDay } from '@/services/geodhaService';
import { WARD_DASHBOARDS } from '@/config/wardDashboards';
import { CORPORATIONS } from '@/config/gba';
import { WARD_PROPS } from '@/lib/geo';
import { DATE_LOCALES } from '@/lib/reportFields';
import { useI18n } from '@/i18n';
import { trackEvent } from '@/lib/analytics';
import { cn } from '@/lib/utils';

const COLLECTED_COLOR = '#22c55e';
const MISSED_COLOR    = '#ef4444';

/** Today's date in Bengaluru as YYYY-MM-DD (en-CA formats ISO-style). */
const todayIST = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());

/** A dateKey is a calendar day, not an instant — format it in UTC so it never shifts. */
const dayDate = (dateKey: string) => new Date(`${dateKey}T00:00:00Z`);

const fileSize = (bytes: number) =>
  bytes >= 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;

const WardTruckMapPage = () => {
  const { slug = '' } = useParams();
  const config = WARD_DASHBOARDS[slug.toLowerCase()];
  if (!config) return <NotFound />;
  return <WardTruckMap slug={slug.toLowerCase()} />;
};

function WardTruckMap({ slug }: { slug: string }) {
  const { t, locale } = useI18n();
  const config = WARD_DASHBOARDS[slug];
  const ward   = WARD_PROPS[config.wardNum];
  const corp   = CORPORATIONS[ward.corp_id];
  const wardName = locale === 'kn' ? ward.ward_name_kn : locale === 'hi' ? config.nameHi : ward.ward_name;
  const corpName = locale === 'kn' ? corp.nameKn : corp.name;
  const dl = DATE_LOCALES[locale];

  // Re-runs replace a day's image and URL, so don't keep results past this page view.
  const { data: days = [], isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['truckMaps', config.wardKey],
    queryFn: () => fetchTruckMaps(config.wardKey),
    retry: 1,
    gcTime: 0,
    refetchOnWindowFocus: false,
  });

  const [searchParams, setSearchParams] = useSearchParams();
  const day = days.find((d) => d.dateKey === searchParams.get('day')) ?? days[0];
  const isLatest = day != null && day === days[0];

  const pickDay = (d: TruckMapDay) => {
    setSearchParams((p) => {
      const n = new URLSearchParams(p);
      if (d === days[0]) n.delete('day'); else n.set('day', d.dateKey);
      return n;
    }, { replace: true });
    trackEvent('truck_map_day', { ward: slug, date: d.dateKey });
  };

  const [viewerOpen, setViewerOpen] = useState(false);

  const fmtLongDate  = (k: string) => dayDate(k).toLocaleDateString(dl, { timeZone: 'UTC', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const fmtAltDate   = (k: string) => dayDate(k).toLocaleDateString(dl, { timeZone: 'UTC', day: 'numeric', month: 'long', year: 'numeric' });
  const fmtChipDay   = (k: string) => dayDate(k).toLocaleDateString(dl, { timeZone: 'UTC', weekday: 'short' });
  const fmtChipDate  = (k: string) => dayDate(k).toLocaleDateString(dl, { timeZone: 'UTC', day: 'numeric', month: 'short' });
  const fmtUpdated   = (d: Date) => `${d.toLocaleString(dl, { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })} IST`;
  const fmtNum       = (n: number) => n.toLocaleString(dl);
  const pct          = (d: TruckMapDay) => (d.residents > 0 ? Math.round((d.collected / d.residents) * 100) : 0);

  const alt = day ? t.truckMap.mapAlt(wardName, fmtAltDate(day.dateKey), day.residents, day.collected, day.missed) : '';

  return (
    <main className="pb-16">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <section className="container pt-6 sm:pt-12 pb-5">
        <Link
          to={`/dashboard?ward=${config.wardNum}`}
          className="inline-flex items-center gap-1 text-sm font-bold text-foreground/70 hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> {t.nav.dashboard}
        </Link>
        <p className="mono-label mt-4">{corpName} · {t.truckMap.ward} {ward.ward_id}</p>
        <h1 className="mt-2 text-3xl sm:text-5xl font-extrabold tracking-tight" style={{ fontFamily: "'Archivo', sans-serif" }}>
          {t.truckMap.title(wardName)}
        </h1>
        <p className="mt-3 max-w-2xl text-base sm:text-lg text-foreground/75">{t.truckMap.subtitle}</p>
      </section>

      <section className="container max-w-3xl">
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
              <h2 className="text-xl sm:text-2xl font-extrabold" style={{ fontFamily: "'Archivo', sans-serif" }}>
                {fmtLongDate(day.dateKey)}
              </h2>
              {day.generatedAt && (
                <p className="text-sm text-foreground/70 mt-0.5">{t.truckMap.updated} {fmtUpdated(day.generatedAt)}</p>
              )}
              {isLatest && day.dateKey !== todayIST() && (
                <p className="mono-label mt-1 !text-[11px]">{t.truckMap.todayPending}</p>
              )}
            </div>

            {/* ── Counts ───────────────────────────────────────────────── */}
            <div className="mt-4 grid grid-cols-3 gap-2 sm:gap-4">
              <CountTile value={fmtNum(day.residents)} label={t.truckMap.statResidents} tint="bg-paper" />
              <CountTile value={fmtNum(day.collected)} label={t.truckMap.statCollected} tint="bg-tint-green" dot={COLLECTED_COLOR} />
              <CountTile value={fmtNum(day.missed)}    label={t.truckMap.statMissed}    tint="bg-tint-red"   dot={MISSED_COLOR} />
            </div>
            <p className="mt-3 text-sm font-bold">
              {t.truckMap.pctCollected(pct(day))}
              {day.longMissed > 0 && (
                <span className="text-[#b91c1c]"> · {t.truckMap.longMissed(day.longMissed, day.streakDays)}</span>
              )}
            </p>

            {/* ── Map preview ──────────────────────────────────────────── */}
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
                <li className="flex items-start gap-2"><LegendDot color={COLLECTED_COLOR} />{t.truckMap.explainGreen}</li>
                <li className="flex items-start gap-2"><LegendDot color={MISSED_COLOR} />{t.truckMap.explainRed}</li>
                <li className="flex items-start gap-2"><LegendDot color={MISSED_COLOR} ringed />{t.truckMap.explainRing(day.streakDays)}</li>
                <li className="text-foreground/70">{t.truckMap.explainSource}</li>
              </ul>
              <p className="mt-3 text-[11px] text-foreground/50">{t.truckMap.credit}</p>
            </div>

            {viewerOpen && (
              <MapViewer day={day} alt={alt} onClose={() => setViewerOpen(false)} />
            )}
          </>
        )}
      </section>

      {/* ── CTA ────────────────────────────────────────────────────────── */}
      <section className="container max-w-3xl mt-10">
        <div
          className="flex flex-col gap-5 rounded-2xl border-[3px] border-ink bg-stripes-yellow p-5 sm:p-7"
          style={{ boxShadow: 'var(--shadow-offset-6)' }}
        >
          <div className="bg-paper border-2 border-ink rounded-xl px-4 py-3">
            <p className="text-lg sm:text-2xl font-extrabold" style={{ fontFamily: "'Archivo', sans-serif" }}>{t.truckMap.ctaTitle(wardName)}</p>
            <p className="text-sm text-foreground/75 mt-1">{t.truckMap.ctaBody}</p>
          </div>
          <StoreButtons placement={`ward_${slug}_cta`} />
        </div>
      </section>
    </main>
  );
}

// ── Small pieces ─────────────────────────────────────────────────────────────

function CountTile({ value, label, tint, dot }: { value: string; label: string; tint: string; dot?: string }) {
  return (
    <div className={cn('rounded-2xl border-[3px] border-ink p-3 sm:p-5', tint)} style={{ boxShadow: 'var(--shadow-offset-3)' }}>
      <p className="text-3xl sm:text-5xl font-extrabold tabular-nums leading-none" style={{ fontFamily: "'Archivo', sans-serif" }}>{value}</p>
      <p className="mt-2 flex items-center gap-1.5 text-xs sm:text-sm font-extrabold leading-tight">
        {dot && <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: dot }} />}
        {label}
      </p>
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

function LoadingSkeleton() {
  return (
    <div aria-busy="true">
      <Skeleton className="h-7 w-64 max-w-full" />
      <Skeleton className="mt-2 h-4 w-40" />
      <div className="mt-4 grid grid-cols-3 gap-2 sm:gap-4">
        {[0, 1, 2].map((i) => <Skeleton key={i} className="h-20 sm:h-28 rounded-2xl" />)}
      </div>
      <Skeleton className="mt-4 w-full rounded-2xl" style={{ aspectRatio: '2160 / 2007' }} />
      <Skeleton className="mt-4 h-12 w-full sm:w-56 rounded-full" />
    </div>
  );
}

/**
 * Full-screen viewer. Opens fitted to the screen; tap the image (or the zoom
 * button) for full resolution and pan by scrolling. Native pinch-zoom also works.
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

export default WardTruckMapPage;
