import { useState, useMemo, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Link, useSearchParams } from 'react-router-dom';
import {
  X, Camera, ArrowRight, Loader2, AlertCircle,
  Maximize2, Minimize2, LocateFixed, Share2, Check, Info,
  MapPinned, ClipboardList,
} from 'lucide-react';

import WardMap from '@/components/WardMap';
import MapErrorBoundary from '@/components/MapErrorBoundary';
import type { TestimonialMarkerInfo } from '@/components/WardMap';
import { APP_REPORT_STATUS_COLORS } from '@/components/AppReportsLayer';
import type { AppReportPin, AppReportStatus } from '@/components/AppReportsLayer';

// ── Live app reports (GEODHA mobile app) ─────────────────────────────────────
import { useFetchReports } from '@/hooks/useFetchReports';
import { initializeAuth } from '@/lib/firebase';
import type { Report } from '@/services/reportsService';
import { formatDistanceToNow, format, differenceInCalendarDays } from 'date-fns';
import { ThumbsUp } from 'lucide-react';

// ── Shared ward-boundary geometry helpers ─────────────────────────────────────
import { WARD_CENTROIDS, findWardForPoint } from '@/lib/geo';
import { GBA_BY_ID, isInBengaluru } from '@/lib/wards';
import { trackEvent } from '@/lib/analytics';

// ── Firebase hooks ────────────────────────────────────────────────────────────
import { useWardStats }            from '@/hooks/useWardStats';
import { useRecommendedActionsDB } from '@/hooks/useRecommendedActionsDB';
import { useTestimonialsDB }       from '@/hooks/useTestimonialsDB';

// ── Shared types ──────────────────────────────────────────────────────────────
import type { WardData, TestimonialDoc } from '@/services/geodhaService';

// ── Neighbourhood scorecard ───────────────────────────────────────────────────
import NeighbourhoodScorecard from '@/components/scorecard/NeighbourhoodScorecard';
import { selectionFromBbmp, selectionFromGba } from '@/components/scorecard/selection';
import type { ScorecardSelection } from '@/components/scorecard/types';
import { ImageLightbox } from '@/components/dashboard/shared';

// ── Severity scale ────────────────────────────────────────────────────────────
import { computeScale } from '@/lib/severity';

// ── Scale hook (depends on live Firebase ward data) ───────────────────────────

function useScales(wardDataMap: Record<number, WardData>) {
  return useMemo(() => {
    const wards = Object.values(wardDataMap);
    if (wards.length === 0) return null;
    return {
      dump:  computeScale(wards.map((w) => w.garbage_dump)),
      veh:   computeScale(wards.map((w) => w.garbage_vehicle_not_arrived)),
      burn:  computeScale(wards.map((w) => w.burning_of_garbage)),
      total: computeScale(wards.map((w) => w.total_reports)),
    };
  }, [wardDataMap]);
}

// ── BBMP / Sahaaya complaint status card ──────────────────────────────────────
// Red by default (open/in-progress), yellow once BBMP marks it closed (pending
// user confirmation), green once the user has verified it resolved.

function BbmpStatusCard({ report }: { report: Report }) {
  const sahaaya = report.sahaaya;
  const userVerified   = report.status === 'resolved';
  const officiallyClosed = sahaaya?.status === 'closed';

  const tone = userVerified
    ? { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-900', label: 'text-green-700', chipBg: 'bg-green-100' }
    : officiallyClosed
    ? { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-900', label: 'text-amber-700', chipBg: 'bg-amber-100' }
    : { bg: 'bg-red-50',   border: 'border-red-200',   text: 'text-red-900',   label: 'text-red-700',   chipBg: 'bg-red-100' };

  const reportedOn  = report.createdAt?.toDate ? report.createdAt.toDate() : null;
  const remarkDate  = sahaaya?.lastPolledAt?.toDate ? sahaaya.lastPolledAt.toDate() : null;
  const closedDate  = sahaaya?.closedAt?.toDate ? sahaaya.closedAt.toDate() : null;
  // Only a "closed" status is an actual update — interim remarks (e.g. "1st
  // Assignment Based on Ward Mapping") are re-polled unchanged and would
  // otherwise keep pushing this date out on every poll.
  const updateRef   = officiallyClosed ? closedDate : null;
  const daysToUpdate = reportedOn && updateRef ? differenceInCalendarDays(updateRef, reportedOn) : null;

  return (
    <section className={`mx-5 mt-4 rounded-xl border p-4 space-y-2 ${tone.bg} ${tone.border}`}>
      {sahaaya?.grievanceId && (
        <p className={`text-xs font-bold ${tone.label}`}>
          BBMP Complaint ID: <span className="font-mono">{sahaaya.grievanceId}</span>
        </p>
      )}

      {reportedOn && (
        <p className={`text-xs ${tone.text}`}>
          Reported on: {format(reportedOn, 'd MMM yyyy')}
        </p>
      )}

      {/* Interim remarks (e.g. "1st Assignment Based on Ward Mapping") aren't
          real updates — they're re-polled unchanged until BBMP closes the
          complaint, so only show remarks once that's actually happened. */}
      {officiallyClosed && sahaaya?.staffRemarks && (
        <div className={`text-xs ${tone.text} leading-relaxed`}>
          <p className="font-semibold">
            BBMP remarks{remarkDate ? ` · ${format(remarkDate, 'd MMM yyyy')}` : ''}
          </p>
          <p className="italic mt-0.5">"{sahaaya.staffRemarks}"</p>
        </div>
      )}

      {daysToUpdate !== null && daysToUpdate >= 0 && (
        <p className={`text-[11px] font-medium ${tone.label}`}>
          Received an update after {daysToUpdate} {daysToUpdate === 1 ? 'day' : 'days'}
        </p>
      )}

      {officiallyClosed && !userVerified && (
        <p className={`text-xs font-semibold ${tone.text} ${tone.chipBg} rounded-lg px-3 py-2 mt-1`}>
          Report closed by officials. Pending user confirmation whether the issue was resolved or not.
        </p>
      )}

      {userVerified && (
        <p className={`text-xs font-semibold ${tone.text} ${tone.chipBg} rounded-lg px-3 py-2 mt-1`}>
          Resolution confirmed — this report has been verified as closed.
        </p>
      )}
    </section>
  );
}

// ── App report detail sheet ───────────────────────────────────────────────────
// Shown when a live GEODHA app-report pin is tapped (visible when zoomed in).

function ReportSheet({ report, onClose }: { report: Report; onClose: () => void }) {
  const [lightbox, setLightbox] = useState<{ idx: number } | null>(null);
  const photos = report.status !== 'archived' ? report.photos : [];
  const statusColor = APP_REPORT_STATUS_COLORS[report.status as AppReportStatus] ?? APP_REPORT_STATUS_COLORS.pending;

  return (
    <>
      {lightbox && photos.length > 0 && (
        <ImageLightbox images={photos} initialIndex={lightbox.idx} onClose={() => setLightbox(null)} />
      )}

      <div className="flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between px-5 pt-3 pb-3 border-b border-gray-100">
          <div className="min-w-0">
            <h2 className="text-xl font-bold leading-tight" style={{ fontFamily: "'Archivo', sans-serif" }}>
              {report.title}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5 truncate">
              {report.location.address || report.location.ward || 'Location unavailable'}
            </p>
          </div>
          <div className="flex items-center gap-1.5 ml-3 mt-0.5 shrink-0">
            <span
              className="inline-block font-bold rounded-full text-[11px] px-2 py-0.5 text-white capitalize"
              style={{ background: statusColor }}
            >
              {report.status}
            </span>
            <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-700" aria-label="Close">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto" style={{ maxHeight: 'calc(82vh - 100px)', paddingBottom: 'env(safe-area-inset-bottom, 1.5rem)' }}>

          {/* BBMP / Sahaaya complaint status */}
          <BbmpStatusCard report={report} />

          {/* Photos */}
          {photos.length > 0 ? (
            <section className="px-5 pt-4 pb-2">
              <div className="flex gap-2 overflow-x-auto pb-1">
                {photos.map((src, i) => (
                  <button
                    key={i}
                    onClick={() => setLightbox({ idx: i })}
                    className="flex-shrink-0 rounded-lg overflow-hidden border border-gray-200 hover:border-gray-400 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400"
                    aria-label={`View photo ${i + 1}`}
                  >
                    <img src={src} alt={`Report photo ${i + 1}`} className="h-28 w-28 object-cover" loading="lazy" />
                  </button>
                ))}
              </div>
            </section>
          ) : report.status === 'archived' && report.photos.length > 0 ? (
            <section className="px-5 pt-4 pb-2">
              <div className="flex items-center gap-2 text-xs text-gray-400 bg-gray-50 rounded-lg px-3 py-2.5 border border-dashed border-gray-200">
                <Camera className="h-3.5 w-3.5" />
                {report.photos.length} image(s) archived for this report.
              </div>
            </section>
          ) : null}

          {/* Description */}
          {report.description && (
            <section className="px-5 pt-3 pb-2">
              <p className="text-sm text-gray-700 leading-relaxed">{report.description}</p>
            </section>
          )}

          {/* Meta */}
          <section className="px-5 pt-3 pb-2">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-gray-500">
              <span className="capitalize bg-gray-100 rounded-full px-2 py-0.5 font-medium text-gray-600">{report.category}</span>
              {report.location.ward && <span>Ward: {report.location.ward}</span>}
              <span>Reported {formatDistanceToNow(report.createdAt.toDate(), { addSuffix: true })}</span>
              <span className="flex items-center gap-1"><ThumbsUp className="h-3 w-3" />{report.endorsementCount}</span>
            </div>
          </section>

          {/* CTA */}
          <div className="px-5 pt-4 pb-6">
            <Link
              to="/report"
              onClick={() => window.scrollTo(0, 0)}
              className="flex items-center justify-between w-full bg-white border border-gray-200 rounded-xl px-4 py-3.5 shadow-sm hover:shadow transition-shadow"
            >
              <div>
                <p className="text-sm font-semibold text-gray-800">Seen something similar?</p>
                <p className="text-xs text-gray-500 mt-0.5">Report a garbage issue in your area with the GEODHA app.</p>
              </div>
              <div className="shrink-0 ml-3 h-8 w-8 rounded-full flex items-center justify-center" style={{ background: 'var(--gradient-hero)' }}>
                <ArrowRight className="h-4 w-4 text-white" />
              </div>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}

// ── Report color legend — clickable, with a popover explaining each color ────

const REPORT_COLOR_MEANINGS: { color: string; label: string; body: string }[] = [
  { color: '#ef4444', label: 'Reported',          body: 'Awaiting action from officials.' },
  { color: '#eab308', label: 'Closed by officials', body: "Pending reporter's confirmation that the issue is actually resolved." },
  { color: '#22c55e', label: 'Resolved',           body: 'Confirmed fixed by the reporter.' },
];

function ReportColorLegend({ suffix }: { suffix?: string }) {
  const [open, setOpen] = useState(false);
  const [popStyle, setPopStyle] = useState<React.CSSProperties>({});
  const btnRef = useRef<HTMLButtonElement>(null);

  const toggle = () => {
    if (!open && btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      const width = 260;
      setPopStyle({
        position: 'fixed',
        top:      r.bottom + 6,
        left:     Math.min(Math.max(8, r.left), window.innerWidth - width - 8),
        width,
        zIndex:   99999,
      });
    }
    setOpen((o) => !o);
  };

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (btnRef.current && !btnRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={toggle}
        aria-expanded={open}
        aria-label="What do the report colors mean?"
        className="flex items-center gap-1 ml-1 pl-2 border-l border-gray-200 hover:bg-gray-50 rounded px-1 -mx-1 transition-colors"
      >
        <span className="inline-flex gap-0.5">
          {REPORT_COLOR_MEANINGS.map((c) => (
            <span key={c.color} className="h-2.5 w-2.5 rounded-full border border-white shadow-sm" style={{ background: c.color }} />
          ))}
        </span>
        <span>App reports{suffix ? ` ${suffix}` : ''}</span>
        <Info className="h-2.5 w-2.5 text-gray-400" />
      </button>
      {open && createPortal(
        <div style={popStyle} className="bg-white border border-gray-200 rounded-lg shadow-xl p-3 space-y-2.5">
          {REPORT_COLOR_MEANINGS.map((c) => (
            <p key={c.color} className="flex items-start gap-2 text-xs text-gray-600 leading-relaxed">
              <span className="mt-0.5 h-2.5 w-2.5 rounded-full shrink-0" style={{ background: c.color }} />
              <span><span className="font-semibold text-gray-800">{c.label}</span> — {c.body}</span>
            </p>
          ))}
        </div>,
        document.body,
      )}
    </>
  );
}

// ── Map legend (live-reports view) ───────────────────────────────────────────

function MapLegend() {
  return (
    <div className="flex items-center gap-0.5 flex-wrap text-[10px] text-gray-500">
      <span className="flex items-center gap-1 mr-2">
        <span className="inline-block h-2.5 w-4 rounded-sm border border-gray-400" style={{ background: 'transparent' }} />
        Ward boundary
      </span>
      <ReportColorLegend />
    </div>
  );
}

// ── View-mode toggle ──────────────────────────────────────────────────────────

type ViewMode = 'reports' | 'scorecard';

function ViewModeToggle({ mode, onChange }: { mode: ViewMode; onChange: (m: ViewMode) => void }) {
  const btnCls = (active: boolean) =>
    `inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-extrabold transition-colors ${
      active ? 'bg-ink text-white' : 'text-foreground/70 hover:text-foreground'
    }`;
  return (
    <div className="inline-flex items-center bg-paper border-[2.5px] border-ink rounded-full p-1 shrink-0" role="tablist" aria-label="Dashboard view">
      <button role="tab" aria-selected={mode === 'reports'} className={btnCls(mode === 'reports')} onClick={() => onChange('reports')}>
        <MapPinned className="h-3.5 w-3.5" /> Live reports
      </button>
      <button role="tab" aria-selected={mode === 'scorecard'} className={btnCls(mode === 'scorecard')} onClick={() => onChange('scorecard')}>
        <ClipboardList className="h-3.5 w-3.5" /> Neighbourhood scorecard
      </button>
    </div>
  );
}

// ── Loading / error screens ───────────────────────────────────────────────────

function LoadingScreen() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white gap-3">
      <Loader2 className="h-7 w-7 text-gray-400 animate-spin" />
      <p className="text-sm text-gray-500">Loading ward data…</p>
    </div>
  );
}

function ErrorScreen({ message }: { message: string }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white gap-3 px-6 text-center">
      <AlertCircle className="h-8 w-8 text-red-400" />
      <p className="text-sm font-semibold text-gray-800">Could not load dashboard data</p>
      <p className="text-xs text-gray-500 max-w-sm">{message}</p>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

/** Reads ?view=, ?ward= (BBMP-198) and ?gba= (GBA-369 id) from the URL. */
function selectionFromParams(params: URLSearchParams): ScorecardSelection | null {
  const gba  = params.get('gba');
  const ward = parseInt(params.get('ward') ?? '', 10);
  if (gba && GBA_BY_ID[gba]) {
    const sel = selectionFromGba(gba);
    return !isNaN(ward) ? { ...sel, bbmpNum: ward } : sel;
  }
  if (!isNaN(ward)) return selectionFromBbmp(ward);
  return null;
}

const DashboardPage = () => {
  // ── Firebase data ─────────────────────────────────────────────────────────
  const { wardDataMap, loading: wardLoading, error: wardError }     = useWardStats();
  const { actions,     loading: actLoading,  error: actError }      = useRecommendedActionsDB();
  const { testimonials }                                             = useTestimonialsDB();

  const scales = useScales(wardDataMap);

  // ── Live app reports (non-blocking — the map works without them) ──────────
  const [authReady, setAuthReady] = useState(false);
  useEffect(() => {
    initializeAuth()
      .catch((err) => console.error('Firebase auth init failed:', err))
      .finally(() => setAuthReady(true));
  }, []);
  const { reports: appReports, loading: reportsLoading } = useFetchReports(false);

  const appReportPins = useMemo<AppReportPin[]>(() => {
    if (!authReady || reportsLoading) return [];
    return appReports
      .filter((r) =>
        r.id != null &&
        r.location?.latitude  != null && !isNaN(r.location.latitude) &&
        r.location?.longitude != null && !isNaN(r.location.longitude))
      .map((r) => ({
        id:       r.id!,
        position: [r.location.latitude, r.location.longitude] as [number, number],
        title:    r.title,
        category: r.category,
        status:   r.status as AppReportStatus,
        // BBMP closed the complaint but the user hasn't confirmed it yet → yellow pin.
        sahaayaClosed: r.sahaaya?.status === 'closed',
      }));
  }, [authReady, reportsLoading, appReports]);

  // ── URL state ─────────────────────────────────────────────────────────────
  // ?view=scorecard&ward=<198 no>&gba=<369 id>  — shareable scorecard links.
  // Old ?ward= links (from the former stats view) open the scorecard too.
  const [searchParams, setSearchParams] = useSearchParams();
  const initialSelection = useMemo(() => selectionFromParams(searchParams), []); // eslint-disable-line react-hooks/exhaustive-deps

  const [viewMode, setViewMode] = useState<ViewMode>(
    searchParams.get('view') === 'scorecard' || initialSelection ? 'scorecard' : 'reports',
  );
  const [scorecard, setScorecard] = useState<ScorecardSelection | null>(initialSelection);

  const syncUrl = (mode: ViewMode, sel: ScorecardSelection | null) => {
    const next = new URLSearchParams();
    if (mode === 'scorecard') {
      next.set('view', 'scorecard');
      if (sel?.bbmpNum != null) next.set('ward', String(sel.bbmpNum));
      if (sel?.gbaId)           next.set('gba', sel.gbaId);
    }
    setSearchParams(next, { replace: true });
  };

  const handleViewModeChange = (m: ViewMode) => {
    setViewMode(m);
    syncUrl(m, scorecard);
    trackEvent('dashboard_view_mode', { mode: m });
  };

  const handleScorecardChange = (sel: ScorecardSelection | null) => {
    setScorecard(sel);
    syncUrl('scorecard', sel);
    if (sel) trackEvent('scorecard_view', { ward_num: sel.bbmpNum, gba_id: sel.gbaId });
  };

  // ── Live-reports UI state ─────────────────────────────────────────────────
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [sheetOpen,      setSheetOpen]      = useState(false);
  const [zoomToWard,   setZoomToWard]   = useState<number | null>(null);
  const [fullscreen,   setFullscreen]   = useState(false);
  const [locating,     setLocating]     = useState(false);
  const [dashCopied,   setDashCopied]   = useState(false);

  // ── Swipe-to-dismiss state ────────────────────────────────────────────────
  const [dragY,      setDragY]      = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartY = useRef(0);

  const onDragHandleStart = (e: React.TouchEvent) => {
    dragStartY.current = e.touches[0].clientY;
    setIsDragging(true);
  };
  const onDragHandleMove = (e: React.TouchEvent) => {
    const delta = e.touches[0].clientY - dragStartY.current;
    if (delta > 0) setDragY(delta);
  };
  const onDragHandleEnd = () => {
    setIsDragging(false);
    if (dragY > 80) {
      setDragY(0);
      handleClose();
    } else {
      setDragY(0);
    }
  };

  const handleReportSelect = (reportId: string) => {
    const report = appReports.find((r) => r.id === reportId);
    if (!report) return;
    setSelectedReport(report);
    setSheetOpen(true);
    trackEvent('report_pin_tap', { report_id: reportId, category: report.category });
  };

  const handleClose = () => {
    setSheetOpen(false);
    setTimeout(() => setSelectedReport(null), 320);
  };

  useEffect(() => {
    document.body.style.overflow = sheetOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [sheetOpen]);

  // ── Locate me (live-reports map) ──────────────────────────────────────────
  const locateUser = () => {
    if (!navigator.geolocation) { alert('Geolocation is not supported by your browser.'); return; }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        const { latitude: lat, longitude: lng } = pos.coords;
        if (!isInBengaluru(lat, lng)) {
          alert('Your current location appears to be outside Bengaluru.');
          return;
        }
        const wardNum = findWardForPoint(lat, lng);
        if (!wardNum) { alert('Could not match your location to a ward boundary.'); return; }
        setZoomToWard(null);
        setTimeout(() => setZoomToWard(wardNum), 0);
      },
      (err) => {
        setLocating(false);
        if (err.code !== 1) alert('Could not get your location. Please try again.');
        // code 1 = permission denied — user chose not to share, no alert needed
      },
      { enableHighAccuracy: true, timeout: 10_000 },
    );
  };

  // ── Dashboard share ───────────────────────────────────────────────────────
  const shareDashboard = async () => {
    trackEvent('share_click', { target: 'dashboard', view: viewMode });
    const url  = `${window.location.origin}/dashboard${viewMode === 'scorecard' ? '?view=scorecard' : ''}`;
    const text = viewMode === 'scorecard'
      ? `📋 How is your Bengaluru neighbourhood doing? Find your ward (old or new), its garbage report card and who to call →`
      : `🗺️ See live garbage reports from Bengaluru residents on the GEODHA map →`;
    if (navigator.share) {
      try {
        await navigator.share({ title: 'GEODHA · Bengaluru', text, url });
        return;
      } catch (err) {
        if ((err as Error).name === 'AbortError') return;
      }
    }
    try {
      await navigator.clipboard.writeText(url);   // copy the URL, not the long text string
      setDashCopied(true);
      setTimeout(() => setDashCopied(false), 2500);
    } catch { /* ignore */ }
  };

  // ── Testimonial markers for the scorecard map ─────────────────────────────
  const testimonialMarkers = useMemo<TestimonialMarkerInfo[]>(() => {
    const byWard = new Map<number, TestimonialDoc[]>();
    for (const t of testimonials) {
      if (!byWard.has(t.ward_num)) byWard.set(t.ward_num, []);
      byWard.get(t.ward_num)!.push(t);
    }

    const markers: TestimonialMarkerInfo[] = [];
    for (const [wardNum, wt] of byWard) {
      const centroid = WARD_CENTROIDS[wardNum];

      // Handle negative and positive testimonials independently so both can
      // appear in the same ward cluster simultaneously.
      for (const isPositive of [false, true] as const) {
        const group = wt.filter((t) => (t.is_positive ?? false) === isPositive);
        if (group.length === 0) continue;

        const exact = group.filter((t) => t.has_exact_location && t.exact_lat != null && t.exact_lng != null);
        if (exact.length > 0) {
          for (const t of exact) {
            markers.push({ id: t.id, wardNum, latlng: [t.exact_lat!, t.exact_lng!], isExact: true, isCritical: t.critical_or_not ?? false, isPositive });
          }
        } else if (centroid) {
          const isCritical = group.some((t) => t.critical_or_not);
          markers.push({ id: `centre-${isPositive ? 'pos' : 'neg'}-${wardNum}`, wardNum, latlng: centroid, isExact: false, isCritical, isPositive });
        }
      }
    }
    return markers;
  }, [testimonials]);

  // ── Guards ────────────────────────────────────────────────────────────────
  if (wardLoading || actLoading) return <LoadingScreen />;
  if (wardError)                 return <ErrorScreen message={wardError} />;
  if (actError)                  return <ErrorScreen message={actError} />;
  if (!scales)                   return <LoadingScreen />;

  // ── Live-reports map block (used in both normal and fullscreen layouts) ───
  const mapBlock = (minH?: string) => (
    <div className={`relative ${!minH ? 'flex-1' : ''}`} style={minH ? { height: minH } : {}}>
      <div className="absolute inset-0">
        <MapErrorBoundary>
          <WardMap
            wardDataMap={wardDataMap}
            selectedWard={null}
            onWardSelect={() => { /* outlines only in reports mode */ }}
            zoomToWard={zoomToWard}
            appReports={appReportPins}
            onReportSelect={handleReportSelect}
            mode="reports"
          />
        </MapErrorBoundary>
      </div>

      {/* Locate-me button */}
      <button
        onClick={locateUser}
        disabled={locating}
        title={locating ? 'Getting your location…' : 'Go to my location'}
        aria-label="Locate me on map"
        className="absolute top-1 right-1 z-[999] bg-white shadow-md border border-gray-200 rounded-lg p-2.5 hover:bg-gray-50 active:bg-gray-100 transition-colors disabled:opacity-60"
      >
        {locating
          ? <Loader2 className="h-4 w-4 text-gray-400 animate-spin" />
          : <LocateFixed className="h-4 w-4 text-gray-600" />}
      </button>
    </div>
  );

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      {/* ── FULLSCREEN OVERLAY (live reports) ──────────────────────────────── */}
      {fullscreen && viewMode === 'reports' && (
        <div className="fixed inset-0 z-[9000] bg-white flex flex-col">
          <div className="px-3 py-2 bg-white border-b border-gray-100 flex items-center gap-2 shrink-0">
            <p className="font-black text-sm">Live reports</p>
            <button
              onClick={() => setFullscreen(false)}
              title="Exit fullscreen"
              className="shrink-0 ml-auto p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
              aria-label="Exit fullscreen"
            >
              <Minimize2 className="h-4 w-4 text-gray-700" />
            </button>
          </div>
          {mapBlock()}
          <div className="px-4 py-2 border-t border-gray-100 bg-white shrink-0">
            <MapLegend />
          </div>
        </div>
      )}

      {/* ── NORMAL LAYOUT ─────────────────────────────────────────────────── */}
      <div className={`bg-background flex flex-col ${fullscreen && viewMode === 'reports' ? 'invisible' : ''}`}>

        {/* Title section */}
        <div className="bg-paper border-b-[3px] border-ink">
          <div className="container px-4 sm:px-6 lg:px-8 pt-6 pb-4">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="mono-label mb-1">Bengaluru · Open civic data</p>
                <h1 className="text-3xl sm:text-4xl font-black tracking-[-0.03em] leading-tight">
                  {viewMode === 'reports' ? 'Garbage Crisis Map' : 'Neighbourhood Scorecard'}
                </h1>
                <p className="text-sm text-foreground/65 font-medium mt-1">
                  {viewMode === 'reports'
                    ? 'Live reports from the GEODHA app, plotted on the ward map'
                    : 'Find your ward — old or new — and see its report card, corporation and key contacts'}
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0 mt-0.5">
                <button
                  onClick={shareDashboard}
                  title={dashCopied ? 'Copied to clipboard!' : 'Share'}
                  className="p-2 rounded-full border-2 border-ink hover:bg-tint-yellow transition-colors"
                  aria-label="Share dashboard"
                >
                  {dashCopied
                    ? <Check  className="h-4 w-4 text-primary" />
                    : <Share2 className="h-4 w-4" />}
                </button>
                {viewMode === 'reports' && (
                  <button
                    onClick={() => setFullscreen(true)}
                    title="Expand map to fullscreen"
                    className="p-2 rounded-full border-2 border-ink hover:bg-tint-yellow transition-colors"
                    aria-label="Expand to fullscreen"
                  >
                    <Maximize2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            <div className="mt-4">
              <ViewModeToggle mode={viewMode} onChange={handleViewModeChange} />
            </div>
          </div>
        </div>

        {viewMode === 'reports' ? (
          <>
            {/* Legend — above map */}
            <div className="px-4 sm:px-6 py-2 border-b border-gray-100 bg-white">
              <MapLegend />
            </div>

            {mapBlock('70vh')}

            {!sheetOpen && (
              <p className="py-2.5 text-center text-xs text-gray-400">
                Tap a report pin to view its details ·{' '}
                <button className="underline font-semibold" onClick={() => handleViewModeChange('scorecard')}>
                  look up your neighbourhood
                </button>
              </p>
            )}
          </>
        ) : (
          <NeighbourhoodScorecard
            wardDataMap={wardDataMap}
            scales={scales}
            actions={actions}
            testimonials={testimonials}
            testimonialMarkers={testimonialMarkers}
            selection={scorecard}
            onSelectionChange={handleScorecardChange}
          />
        )}

      </div>{/* end normal layout */}

      {viewMode === 'reports' && (
        <>
      {/* Backdrop — outside invisible wrapper so it works in fullscreen mode too */}
          <div
            className={`fixed inset-0 bg-black/30 backdrop-blur-[1px] z-[9100] transition-opacity duration-300 ${
              sheetOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
            }`}
            onClick={handleClose}
          />
    
          {/* Bottom sheet (report details) — above fullscreen overlay (z-[9000]) and backdrop */}
          <div
            className={`fixed inset-x-0 bottom-0 z-[9200] ${isDragging ? '' : 'transition-transform duration-300 ease-out'}`}
            style={{ transform: sheetOpen ? `translateY(${dragY}px)` : 'translateY(100%)' }}
          >
            <div className="bg-white rounded-t-2xl shadow-2xl mx-auto max-w-2xl">
              {/* Drag handle — swipe this area down to dismiss */}
              <div
                className="flex justify-center pt-2.5 pb-1 cursor-grab active:cursor-grabbing touch-none select-none"
                onTouchStart={onDragHandleStart}
                onTouchMove={onDragHandleMove}
                onTouchEnd={onDragHandleEnd}
              >
                <div className="w-10 h-1 rounded-full bg-gray-300" />
              </div>
              {selectedReport && <ReportSheet report={selectedReport} onClose={handleClose} />}
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default DashboardPage;
