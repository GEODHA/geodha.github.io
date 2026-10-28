import { useState, useMemo, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Link, useSearchParams } from 'react-router-dom';
import {
  X, Camera, ArrowRight, Search, MapPin,
  Maximize2, Minimize2, LocateFixed, Share2, Check, Loader2,
  ChevronLeft, ChevronRight, Info,
} from 'lucide-react';

import WardMap from '@/components/WardMap';
import type { WardLayer } from '@/components/WardMap';
import MapErrorBoundary from '@/components/MapErrorBoundary';
import { APP_REPORT_STATUS_COLORS } from '@/components/AppReportsLayer';
import type { AppReportPin, AppReportStatus } from '@/components/AppReportsLayer';

// ── Live app reports (GEODHA mobile app) ─────────────────────────────────────
import { useFetchReports } from '@/hooks/useFetchReports';
import { initializeAuth } from '@/lib/firebase';
import type { Report } from '@/services/reportsService';
import { formatDistanceToNow, format, differenceInCalendarDays } from 'date-fns';
import { ThumbsUp } from 'lucide-react';

// ── GBA ward-boundary geometry helpers ────────────────────────────────────────
import {
  WARD_FEATURES, WARD_PROPS, findWardForPoint, legacyToGbaWard,
} from '@/lib/geo';
import { CORPORATIONS, CORPORATION_LIST } from '@/config/gba';
import {
  BBMP_WARD_COUNT, BBMP_ZONE_COLORS, bbmpZoneColor, findBbmpWardForPoint, loadBbmpWards,
} from '@/lib/bbmp';
import type { BbmpWardFeature } from '@/lib/bbmp';
import { trackEvent } from '@/lib/analytics';

// ── Firebase hooks ────────────────────────────────────────────────────────────
import { useTestimonialsDB } from '@/hooks/useTestimonialsDB';

// ── Shared types ──────────────────────────────────────────────────────────────
import type { TestimonialDoc, ReportStats } from '@/services/geodhaService';
import { fetchReportStats } from '@/services/geodhaService';

// ── Date formatter — "2026-04-15" → "April 2026" ─────────────────────────────

function formatMonthYear(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00'); // force local-date parse
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
}

// ── Link renderer (supports [text](url) and bare https:// URLs in quote text) ──

function renderWithLinks(text: string): React.ReactNode {
  const pattern = /\[([^\]]+)\]\((https?:\/\/[^)]+)\)|https?:\/\/\S+/g;
  const nodes: React.ReactNode[] = [];
  let last = 0, match: RegExpExecArray | null;
  while ((match = pattern.exec(text)) !== null) {
    if (match.index > last) nodes.push(text.slice(last, match.index));
    const label = match[1];
    const href  = match[2] ?? match[0];
    nodes.push(
      <a key={match.index} href={href} target="_blank" rel="noopener noreferrer"
        className="underline text-blue-600 hover:text-blue-800 break-all">
        {label ?? href}
      </a>
    );
    last = match.index + match[0].length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes.length === 1 ? nodes[0] : <>{nodes}</>;
}

// ── Testimonial → GBA ward placement ──────────────────────────────────────────
// Testimonials in Firestore carry a legacy BBMP (198-ward) ward_num. Exact-GPS
// entries are matched to the GBA ward containing the point; the rest fall back
// to the GBA ward containing their old BBMP ward's centroid. Used to label each
// carousel card and to focus the map on it.

function testimonialGbaWard(t: TestimonialDoc): number | null {
  if (t.has_exact_location && t.exact_lat != null && t.exact_lng != null) {
    const w = findWardForPoint(t.exact_lat, t.exact_lng);
    if (w != null) return w;
  }
  return legacyToGbaWard(t.ward_num);
}

// ── Image lightbox (carousel) ────────────────────────────────────────────────

function ImageLightbox({ images, initialIndex, onClose }: {
  images: string[];
  initialIndex: number;
  onClose: () => void;
}) {
  const [idx, setIdx] = useState(initialIndex);
  const prev = () => setIdx((i) => Math.max(0, i - 1));
  const next = () => setIdx((i) => Math.min(images.length - 1, i + 1));

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape')      onClose();
      if (e.key === 'ArrowLeft')   prev();
      if (e.key === 'ArrowRight')  next();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [images.length]);

  return createPortal(
    <div
      className="fixed inset-0 z-[9990] flex flex-col items-center justify-center bg-black/90"
      onClick={onClose}
    >
      {/* Navigation: prev */}
      {idx > 0 && (
        <button
          onClick={(e) => { e.stopPropagation(); prev(); }}
          className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2.5 transition-colors"
          aria-label="Previous image"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
      )}

      {/* Image */}
      <img
        src={images[idx]}
        alt={`Photo ${idx + 1} of ${images.length}`}
        className="max-h-[82vh] max-w-[88vw] object-contain rounded-lg shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      />

      {/* Navigation: next */}
      {idx < images.length - 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); next(); }}
          className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2.5 transition-colors"
          aria-label="Next image"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      )}

      {/* Close */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-colors"
        aria-label="Close"
      >
        <X className="h-5 w-5" />
      </button>

      {/* Counter */}
      {images.length > 1 && (
        <div className="absolute bottom-4 text-white text-xs font-medium bg-black/50 px-3 py-1 rounded-full pointer-events-none">
          {idx + 1} / {images.length}
        </div>
      )}
    </div>,
    document.body,
  );
}

// ── Ward search ───────────────────────────────────────────────────────────────

interface SearchableWard {
  ward_num:     number;
  ward_name:    string;
  ward_name_kn: string;
  /** Corporation key (GBA) or zone (BBMP) — also matched by an exact query. */
  group:        string;
  color:        string;
  /** Short tag shown on the right, e.g. "East #12". */
  tag:          string;
}

const GBA_SEARCHABLE: SearchableWard[] = WARD_FEATURES
  .map(({ properties: w }) => ({
    ward_num: w.ward_num, ward_name: w.ward_name, ward_name_kn: w.ward_name_kn,
    group: CORPORATIONS[w.corp_id].key, color: CORPORATIONS[w.corp_id].color,
    tag: `${CORPORATIONS[w.corp_id].key} #${w.ward_id}`,
  }))
  .sort((a, b) => a.ward_name.localeCompare(b.ward_name));

const bbmpSearchable = (features: BbmpWardFeature[]): SearchableWard[] => features
  .map(({ properties: w }) => ({
    ward_num: w.ward_num, ward_name: w.ward_name, ward_name_kn: '',
    group: w.zone, color: bbmpZoneColor(w.zone), tag: `${w.zone} #${w.ward_num}`,
  }))
  .sort((a, b) => a.ward_name.localeCompare(b.ward_name));

function WardSearch({ layer, bbmpWards, onSelect }: {
  layer:     WardLayer;
  bbmpWards: BbmpWardFeature[] | null;
  onSelect:  (wardNum: number) => void;
}) {
  const [query,         setQuery]         = useState('');
  const [open,          setOpen]          = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
  const wrapperRef = useRef<HTMLDivElement>(null);
  const isBbmp = layer === 'bbmp';

  const wards = useMemo(
    () => (isBbmp ? (bbmpWards ? bbmpSearchable(bbmpWards) : []) : GBA_SEARCHABLE),
    [isBbmp, bbmpWards],
  );

  // A name picked on one map means nothing on the other.
  useEffect(() => { setQuery(''); }, [layer]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length === 0) return wards;
    return wards.filter((w) =>
      w.ward_name.toLowerCase().includes(q) ||
      (w.ward_name_kn && w.ward_name_kn.includes(query.trim())) ||
      w.group.toLowerCase() === q);
  }, [query, wards]);

  const reposition = () => {
    if (!wrapperRef.current) return;
    const r = wrapperRef.current.getBoundingClientRect();
    setDropdownStyle({ position: 'fixed', top: r.bottom + 4, left: r.left, width: r.width });
  };

  const handleOpen = () => { reposition(); setOpen(true); };

  const choose = (wardNum: number, name: string) => {
    setQuery(name);
    setOpen(false);
    onSelect(wardNum);
  };

  return (
    <div ref={wrapperRef} className="mt-2">
      <div className="relative flex items-center">
        <Search className="absolute left-3 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
        <input
          type="text"
          value={query}
          placeholder={isBbmp ? 'Search BBMP ward by name…' : 'Search GBA ward by name…'}
          onChange={(e) => { setQuery(e.target.value); handleOpen(); }}
          onFocus={handleOpen}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && filtered.length > 0) {
              choose(filtered[0].ward_num, filtered[0].ward_name);
              (e.target as HTMLInputElement).blur();
            }
          }}
          className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg bg-white shadow-sm
                     focus:outline-none focus:ring-1 focus:ring-gray-300 text-gray-700 placeholder-gray-400"
        />
      </div>
      {open && createPortal(
        <div
          style={{ ...dropdownStyle, zIndex: 99999 }}
          className="bg-white border border-gray-200 rounded-lg shadow-xl max-h-52 overflow-y-auto"
        >
          {filtered.length === 0 && (
            <p className="px-3 py-2.5 text-xs text-gray-500">
              {isBbmp
                ? <>No BBMP ward named “{query.trim()}”. Try a nearby name.</>
                : <>No GBA ward named “{query.trim()}”. Older areas may now be split across differently named wards — try a nearby name, or switch to the BBMP map.</>}
            </p>
          )}
          {filtered.slice(0, 25).map((w) => (
            <button
              key={w.ward_num}
              className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center justify-between"
              onMouseDown={() => choose(w.ward_num, w.ward_name)}
            >
              <span>{w.ward_name}</span>
              <span className="text-[10px] ml-2 flex items-center gap-1 text-gray-400 shrink-0">
                <span className="h-2 w-2 rounded-full" style={{ background: w.color }} />
                {w.tag}
              </span>
            </button>
          ))}
        </div>,
        document.body,
      )}
    </div>
  );
}

// ── Selected-ward label (floats over the map) ─────────────────────────────────
// Replaces hover tooltips on touch screens: tapping a ward shows its name here.

function SelectedWardLabel({ layer, bbmpWards, wardNum, onClose }: {
  layer:     WardLayer;
  bbmpWards: BbmpWardFeature[] | null;
  wardNum:   number;
  onClose:   () => void;
}) {
  let name: string, nameKn = '', sub: string, color: string;
  if (layer === 'bbmp') {
    const ward = bbmpWards?.find((f) => f.properties.ward_num === wardNum)?.properties;
    if (!ward) return null;
    name  = ward.ward_name;
    sub   = `BBMP ward ${ward.ward_num} · ${ward.zone} zone`;
    color = bbmpZoneColor(ward.zone);
  } else {
    const ward = WARD_PROPS[wardNum];
    if (!ward) return null;
    const corp = CORPORATIONS[ward.corp_id];
    name   = ward.ward_name;
    nameKn = ward.ward_name_kn;
    sub    = `Ward ${ward.ward_id} · ${corp.name}`;
    color  = corp.color;
  }
  return (
    <div className="absolute bottom-7 left-1/2 -translate-x-1/2 z-[999] max-w-[calc(100%-1.5rem)]">
      <div
        className="flex items-center gap-2.5 bg-white/95 backdrop-blur border border-gray-200 rounded-xl shadow-lg pl-3 pr-1.5 py-2"
        style={{ borderLeft: `4px solid ${color}` }}
      >
        <div className="min-w-0">
          <p className="text-sm font-bold text-gray-900 leading-tight truncate" style={{ fontFamily: "'Archivo', sans-serif" }}>
            {name}
            {nameKn && <span className="ml-1.5 text-xs font-medium text-gray-400">{nameKn}</span>}
          </p>
          <p className="text-[11px] text-gray-500 truncate">{sub}</p>
        </div>
        <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 shrink-0" aria-label="Clear selected ward">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

// ── Testimonials carousel (below the map) ─────────────────────────────────────

type TestimonialFilter = 'all' | 'problems' | 'successes';

function TestimonialSlide({ t, wardNum, onShowWard, onOpenImages }: {
  t:            TestimonialDoc;
  wardNum:      number | null;
  onShowWard:   (wardNum: number) => void;
  onOpenImages: (images: string[], idx: number) => void;
}) {
  const positive = t.is_positive ?? false;
  const ward     = wardNum != null ? WARD_PROPS[wardNum] : undefined;
  const corp     = ward ? CORPORATIONS[ward.corp_id] : undefined;
  const thumb    = t.thumb_images?.[0] ?? t.images[0];

  // Long quotes are clamped to 5 lines; show a toggle only when they overflow.
  const [expanded,  setExpanded]  = useState(false);
  const [overflows, setOverflows] = useState(false);
  const quoteRef = useRef<HTMLQuoteElement>(null);

  useEffect(() => {
    const el = quoteRef.current;
    if (!el || expanded) return;
    const measure = () => setOverflows(el.scrollHeight > el.clientHeight + 1);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [expanded, t.quote]);

  return (
    <article
      className={`snap-start shrink-0 w-[85%] sm:w-[340px] flex flex-col rounded-xl border overflow-hidden bg-white ${
        positive ? 'border-green-200' : 'border-amber-200'
      }`}
    >
      {thumb ? (
        <button
          onClick={() => onOpenImages(t.images, 0)}
          className="relative h-36 w-full bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-400"
          aria-label={`View photos for ${t.title}`}
        >
          <img src={thumb} alt="" className="h-full w-full object-cover" loading="lazy" />
          {t.images.length > 1 && (
            <span className="absolute bottom-2 right-2 bg-black/60 text-white text-[10px] font-semibold rounded-full px-2 py-0.5">
              +{t.images.length - 1}
            </span>
          )}
        </button>
      ) : null}

      <div className={`flex-1 flex flex-col p-3.5 space-y-2 ${positive ? 'bg-green-50' : 'bg-amber-50'}`}>
        <span className={`self-start inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider rounded-full px-2 py-0.5 text-white ${
          positive ? 'bg-green-700' : 'bg-red-800'
        }`}>
          {positive ? '✓ Success story' : '! Problem'}
        </span>
        <p className="text-sm font-bold text-gray-800 leading-snug">{t.title}</p>
        <blockquote
          ref={quoteRef}
          className={`text-xs italic text-gray-600 leading-relaxed border-l-2 pl-2.5 whitespace-pre-line ${expanded ? '' : 'line-clamp-5'} ${positive ? 'border-green-500' : 'border-amber-400'}`}
        >
          "{renderWithLinks(t.quote)}"
        </blockquote>
        {(overflows || expanded) && (
          <button
            onClick={() => setExpanded((e) => !e)}
            aria-expanded={expanded}
            className={`self-start text-xs font-semibold underline underline-offset-2 ${positive ? 'text-green-800 hover:text-green-900' : 'text-amber-800 hover:text-amber-900'}`}
          >
            {expanded ? 'Show less' : 'Read more'}
          </button>
        )}
        <p className="text-[10px] text-gray-400">
          {t.source}{t.locality ? ` · ${t.locality}` : ''}{t.date ? ` · ${formatMonthYear(t.date)}` : ''}
        </p>
        {ward && corp && (
          <button
            onClick={() => onShowWard(ward.ward_num)}
            className="mt-auto self-start inline-flex items-center gap-1 text-[11px] font-semibold text-gray-700 bg-white border border-gray-200 rounded-full px-2.5 py-1 hover:bg-gray-50"
          >
            <MapPin className="h-3 w-3" style={{ color: corp.color }} />
            {ward.ward_name} · {corp.key}
          </button>
        )}
      </div>
    </article>
  );
}

function TestimonialsCarousel({ testimonials, onShowWard }: {
  testimonials: TestimonialDoc[];
  onShowWard:   (wardNum: number) => void;
}) {
  const [filter,   setFilter]   = useState<TestimonialFilter>('all');
  const [lightbox, setLightbox] = useState<{ images: string[]; idx: number } | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  const counts = useMemo(() => ({
    all:       testimonials.length,
    problems:  testimonials.filter((t) => !(t.is_positive ?? false)).length,
    successes: testimonials.filter((t) =>   t.is_positive ?? false).length,
  }), [testimonials]);

  // Newest first; critical problems ahead of others on the same date.
  const items = useMemo(() => testimonials
    .filter((t) => filter === 'all' || (filter === 'successes') === (t.is_positive ?? false))
    .sort((a, b) => (b.date ?? '').localeCompare(a.date ?? '') || Number(b.critical_or_not) - Number(a.critical_or_not))
    .map((t) => ({ t, wardNum: testimonialGbaWard(t) })),
  [testimonials, filter]);

  useEffect(() => { trackRef.current?.scrollTo({ left: 0 }); }, [filter]);

  const scrollBy = (dir: 1 | -1) => {
    const el = trackRef.current;
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: 'smooth' });
  };

  if (testimonials.length === 0) return null;

  const chip = (key: TestimonialFilter, label: string) => (
    <button
      key={key}
      onClick={() => setFilter(key)}
      aria-pressed={filter === key}
      className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
        filter === key ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
      }`}
    >
      {label} <span className="opacity-60">{counts[key]}</span>
    </button>
  );

  return (
    <section className="px-4 sm:px-6 pt-5 pb-8 border-t border-gray-100" aria-labelledby="testimonials-heading">
      {lightbox && (
        <ImageLightbox images={lightbox.images} initialIndex={lightbox.idx} onClose={() => setLightbox(null)} />
      )}

      <div className="flex items-end justify-between gap-3 mb-3">
        <div>
          <h2 id="testimonials-heading" className="text-lg font-bold text-gray-900" style={{ fontFamily: "'Archivo', sans-serif" }}>
            Citizen testimonials
          </h2>
          <p className="text-xs text-gray-500">Problems residents face and the wins they've had. Tap a ward to find it on the map.</p>
        </div>
        <div className="hidden sm:flex items-center gap-1 shrink-0">
          <button onClick={() => scrollBy(-1)} className="p-2 rounded-full border border-gray-200 hover:bg-gray-50" aria-label="Previous testimonials">
            <ChevronLeft className="h-4 w-4 text-gray-600" />
          </button>
          <button onClick={() => scrollBy(1)} className="p-2 rounded-full border border-gray-200 hover:bg-gray-50" aria-label="Next testimonials">
            <ChevronRight className="h-4 w-4 text-gray-600" />
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 mb-3" role="group" aria-label="Filter testimonials">
        {chip('all', 'All')}
        {chip('problems', 'Problems')}
        {chip('successes', 'Success stories')}
      </div>

      <div
        ref={trackRef}
        className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 scroll-px-4 sm:scroll-px-0"
      >
        {items.map(({ t, wardNum }) => (
          <TestimonialSlide
            key={t.id}
            t={t}
            wardNum={wardNum}
            onShowWard={onShowWard}
            onOpenImages={(images, idx) => setLightbox({ images, idx })}
          />
        ))}
      </div>
    </section>
  );
}

// ── GBA / Sahaaya complaint status card ──────────────────────────────────────
// Red by default (open/in-progress), yellow once GBA marks it closed (pending
// user confirmation), green once the user has verified it resolved.

function ComplaintStatusCard({ report }: { report: Report }) {
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
          GBA Complaint ID: <span className="font-mono">{sahaaya.grievanceId}</span>
        </p>
      )}

      {reportedOn && (
        <p className={`text-xs ${tone.text}`}>
          Reported on: {format(reportedOn, 'd MMM yyyy')}
        </p>
      )}

      {/* Interim remarks (e.g. "1st Assignment Based on Ward Mapping") aren't
          real updates — they're re-polled unchanged until GBA closes the
          complaint, so only show remarks once that's actually happened. */}
      {officiallyClosed && sahaaya?.staffRemarks && (
        <div className={`text-xs ${tone.text} leading-relaxed`}>
          <p className="font-semibold">
            GBA remarks{remarkDate ? ` · ${format(remarkDate, 'd MMM yyyy')}` : ''}
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

          {/* GBA / Sahaaya complaint status */}
          <ComplaintStatusCard report={report} />

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

// ── GBA / BBMP map toggle ─────────────────────────────────────────────────────

function WardLayerToggle({ layer, loading, onChange }: {
  layer:    WardLayer;
  loading:  boolean;
  onChange: (layer: WardLayer) => void;
}) {
  const options: { key: WardLayer; label: string; count: number }[] = [
    { key: 'gba',  label: 'GBA',  count: WARD_FEATURES.length },
    { key: 'bbmp', label: 'BBMP', count: BBMP_WARD_COUNT },
  ];
  return (
    <div role="radiogroup" aria-label="Ward map" className="inline-flex shrink-0 rounded-lg border border-gray-200 bg-gray-50 p-0.5 text-xs">
      {options.map((o) => (
        <button
          key={o.key}
          role="radio"
          aria-checked={layer === o.key}
          onClick={() => onChange(o.key)}
          className={`flex items-center gap-1 rounded-md px-2.5 py-1.5 font-semibold transition-colors ${
            layer === o.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-800'
          }`}
        >
          {o.label}
          <span className="font-normal text-gray-400 tabular-nums">{o.count}</span>
          {o.key === 'bbmp' && loading && <Loader2 className="h-3 w-3 animate-spin text-gray-400" />}
        </button>
      ))}
    </div>
  );
}

// ── Map legend ────────────────────────────────────────────────────────────────

function MapLegend({ layer }: { layer: WardLayer }) {
  const items = layer === 'bbmp'
    ? Object.entries(BBMP_ZONE_COLORS).map(([zone, color]) => ({ key: zone, label: zone, title: `${zone} zone`, color }))
    : CORPORATION_LIST.map((c) => ({ key: String(c.id), label: c.key, title: c.name, color: c.color }));
  return (
    <div className="flex items-center gap-0.5 flex-wrap text-[10px] text-gray-500">
      {items.map((c) => (
        <span key={c.key} className="flex items-center gap-1 mr-2" title={c.title}>
          <span className="inline-block h-2.5 w-4 rounded-sm border-2" style={{ borderColor: c.color, background: `${c.color}55` }} />
          {c.label}
        </span>
      ))}
      <ReportColorLegend />
    </div>
  );
}

// ── City-wide waste report stats (daily snapshot, 22:00 IST) ─────────────────

function CityReportStats() {
  // undefined = loading, null = unavailable (card hidden)
  const [stats, setStats] = useState<ReportStats | null | undefined>(undefined);
  useEffect(() => {
    let cancelled = false;
    fetchReportStats().then((s) => { if (!cancelled) setStats(s); });
    return () => { cancelled = true; };
  }, []);

  if (stats === null) return null;
  const city = stats?.city;
  const fmt = (n: number | undefined) => (n == null ? '—' : n.toLocaleString('en-IN'));

  const tiles: { label: string; value: number | undefined; tint: string; dot?: string }[] = [
    { label: 'Waste reports',                      value: city?.totalReports,    tint: 'bg-white border-gray-200' },
    { label: 'Official complaints on GBA Sahaaya', value: city?.sentToSahaaya,   tint: 'bg-blue-50 border-blue-200' },
    { label: 'Closed by officials',                value: city?.closedOnSahaaya, tint: 'bg-amber-50 border-amber-200', dot: APP_REPORT_STATUS_COLORS.verified },
    { label: 'Verified cleaned by residents',      value: city?.resolvedByUsers, tint: 'bg-green-50 border-green-200', dot: APP_REPORT_STATUS_COLORS.resolved },
  ];

  return (
    <section className="px-4 sm:px-6 pt-5 pb-6 border-t border-gray-100" aria-labelledby="city-stats-heading">
      <h2 id="city-stats-heading" className="text-lg font-bold text-gray-900" style={{ fontFamily: "'Archivo', sans-serif" }}>
        Waste reports across Bengaluru
      </h2>
      <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
        {tiles.map((s) => (
          <div key={s.label} className={`rounded-xl border px-3 py-3 shadow-sm ${s.tint}`}>
            <p className="text-2xl sm:text-3xl font-bold text-gray-900 tabular-nums leading-none" style={{ fontFamily: "'Archivo', sans-serif" }}>
              {fmt(s.value)}
            </p>
            <p className="mt-1.5 flex items-center gap-1.5 text-xs font-semibold text-gray-800 leading-tight">
              {s.dot && <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: s.dot }} />}
              {s.label}
            </p>
          </div>
        ))}
      </div>
      <p className="mt-2 text-[11px] text-gray-500">
        Updated daily at 10 PM IST
        {stats?.updatedAt && <> · Last updated {stats.updatedAt.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })} IST</>}
      </p>
    </section>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

const DashboardPage = () => {
  // ── Firebase data ─────────────────────────────────────────────────────────
  const { testimonials } = useTestimonialsDB();

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
        // GBA closed the complaint but the user hasn't confirmed it yet → yellow pin.
        sahaayaClosed: r.sahaaya?.status === 'closed',
      }));
  }, [authReady, reportsLoading, appReports]);

  // ── URL params ────────────────────────────────────────────────────────────
  const [searchParams] = useSearchParams();
  const urlWardHandled = useRef(false);

  // ── UI state ──────────────────────────────────────────────────────────────
  const [selectedWard,   setSelectedWard]   = useState<number | null>(null);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [sheetOpen,      setSheetOpen]      = useState(false);
  const [zoomRequest,  setZoomRequest]  = useState<{ wardNum: number; seq: number } | null>(null);
  const mapAnchorRef = useRef<HTMLDivElement>(null);
  const [fullscreen,   setFullscreen]   = useState(false);
  const [locating,     setLocating]     = useState(false);
  const [dashCopied,   setDashCopied]   = useState(false);

  // ── Ward map: GBA 369 (default) or former BBMP 198 ────────────────────────
  const [wardLayer,   setWardLayer]   = useState<WardLayer>('gba');
  const [bbmpWards,   setBbmpWards]   = useState<BbmpWardFeature[] | null>(null);
  const [bbmpLoading, setBbmpLoading] = useState(false);

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

  // Tapping a ward just highlights it and shows its name over the map.
  const handleWardSelect = (wardNum: number) => {
    setSelectedWard(wardNum);
    trackEvent('ward_selected', { ward_num: wardNum });
  };

  // Search / locate / carousel: highlight the ward and fly the map onto it.
  const focusWard = (wardNum: number) => {
    handleWardSelect(wardNum);
    setZoomRequest((z) => ({ wardNum, seq: (z?.seq ?? 0) + 1 }));
  };

  const changeWardLayer = (next: WardLayer) => {
    if (next === wardLayer) return;
    trackEvent('ward_layer', { layer: next });
    setSelectedWard(null);
    setZoomRequest(null);
    if (next === 'gba' || bbmpWards) { setWardLayer(next); return; }
    setBbmpLoading(true);
    loadBbmpWards()
      .then((features) => { setBbmpWards(features); setWardLayer('bbmp'); })
      .catch((err) => { console.error('BBMP wards failed to load:', err); alert('Could not load the BBMP ward map. Please try again.'); })
      .finally(() => setBbmpLoading(false));
  };

  // Testimonials are placed on GBA wards.
  const showWardFromTestimonial = (wardNum: number) => {
    if (wardLayer !== 'gba') setWardLayer('gba');
    focusWard(wardNum);
    if (!fullscreen) mapAnchorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
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

  // Auto-open ward from ?ward= URL param (GBA ward key)
  useEffect(() => {
    if (urlWardHandled.current) return;
    urlWardHandled.current = true;
    const wardNum = parseInt(searchParams.get('ward') ?? '', 10);
    if (WARD_PROPS[wardNum]) focusWard(wardNum);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    document.body.style.overflow = sheetOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [sheetOpen]);

  // ── Locate me ────────────────────────────────────────────────────────────
  const locateUser = () => {
    if (!navigator.geolocation) { alert('Geolocation is not supported by your browser.'); return; }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        const { latitude: lat, longitude: lng } = pos.coords;
        const wardNum = wardLayer === 'bbmp' && bbmpWards
          ? findBbmpWardForPoint(bbmpWards, lat, lng)
          : findWardForPoint(lat, lng);
        if (!wardNum) {
          alert(wardLayer === 'bbmp'
            ? 'Your current location appears to be outside the former BBMP area.'
            : 'Your current location appears to be outside the Greater Bengaluru Authority area.');
          return;
        }
        focusWard(wardNum);
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
    trackEvent('share_click', { target: 'dashboard' });
    const url  = `${window.location.origin}/dashboard`;
    const text = `🗺️ See garbage reports and citizen stories across Bengaluru's 369 GBA wards. Find your ward and see what residents can do about it →`;
    if (navigator.share) {
      try {
        await navigator.share({ title: 'GEODHA · Bengaluru Garbage Crisis Map', text, url });
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

  // ── Shared map block (used in both normal and fullscreen layouts) ──────────
  const mapBlock = (minH?: string) => (
    <div className={`relative ${!minH ? 'flex-1' : ''}`} style={minH ? { height: minH } : {}}>
      <div className="absolute inset-0">
        <MapErrorBoundary>
          <WardMap
            layer={wardLayer}
            bbmpWards={bbmpWards}
            selectedWard={selectedWard}
            onWardSelect={handleWardSelect}
            zoomRequest={zoomRequest}
            appReports={appReportPins}
            onReportSelect={handleReportSelect}
          />
        </MapErrorBoundary>
      </div>

      {/* Selected ward name — the way to see a ward's name on touch screens */}
      {selectedWard != null && (
        <SelectedWardLabel layer={wardLayer} bbmpWards={bbmpWards} wardNum={selectedWard} onClose={() => setSelectedWard(null)} />
      )}

      {/* Locate-me button — top-right corner */}
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
      {/* ── FULLSCREEN OVERLAY ─────────────────────────────────────────────── */}
      {fullscreen && (
        <div className="fixed inset-0 z-[9000] bg-white flex flex-col">
          {/* Compact header: search + exit */}
          <div className="px-3 py-2 bg-white border-b border-gray-100 flex items-center gap-2 shrink-0">
            <div className="flex-1 min-w-0 -mt-2">
              <WardSearch layer={wardLayer} bbmpWards={bbmpWards} onSelect={focusWard} />
            </div>
            <WardLayerToggle layer={wardLayer} loading={bbmpLoading} onChange={changeWardLayer} />
            <button
              onClick={() => setFullscreen(false)}
              title="Exit fullscreen"
              className="shrink-0 ml-auto p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
              aria-label="Exit fullscreen"
            >
              <Minimize2 className="h-4 w-4 text-gray-700" />
            </button>
          </div>

          {/* Map (fills remaining height) */}
          {mapBlock()}

          {/* Legend strip */}
          <div className="px-4 py-2 border-t border-gray-100 bg-white shrink-0">
            <MapLegend layer={wardLayer} />
          </div>
        </div>
      )}

      {/* ── NORMAL LAYOUT ─────────────────────────────────────────────────── */}
      <div className={`bg-white flex flex-col ${fullscreen ? 'invisible' : ''}`}>

        {/* Title section */}
        <div className="px-4 sm:px-6 pt-5 pb-3 bg-white">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight" style={{ fontFamily: "'Archivo', sans-serif" }}>
                Bengaluru · Garbage Crisis Map
              </h1>
              <p className="text-xs text-gray-500 mt-0.5">
                Live GEODHA app reports across the {WARD_FEATURES.length} wards of the Greater Bengaluru Authority's 5 city corporations
              </p>
            </div>
            <div className="flex items-center gap-1 shrink-0 mt-0.5">
              {/* Share dashboard */}
              <button
                onClick={shareDashboard}
                title={dashCopied ? 'Copied to clipboard!' : 'Share this map'}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                aria-label="Share dashboard"
              >
                {dashCopied
                  ? <Check  className="h-4 w-4 text-green-500" />
                  : <Share2 className="h-4 w-4 text-gray-500" />}
              </button>
              {/* Fullscreen */}
              <button
                onClick={() => setFullscreen(true)}
                title="Expand map to fullscreen"
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                aria-label="Expand to fullscreen"
              >
                <Maximize2 className="h-4 w-4 text-gray-500" />
              </button>
            </div>
          </div>

          <div className="flex items-end gap-2">
            <div className="flex-1 min-w-0">
              <WardSearch layer={wardLayer} bbmpWards={bbmpWards} onSelect={focusWard} />
            </div>
            <WardLayerToggle layer={wardLayer} loading={bbmpLoading} onChange={changeWardLayer} />
          </div>
        </div>

        {/* Legend — above map */}
        <div className="px-4 sm:px-6 py-2 border-y border-gray-100 bg-white">
          <MapLegend layer={wardLayer} />
        </div>

        {/* Map */}
        <div ref={mapAnchorRef} className="scroll-mt-16">
          {mapBlock('70vh')}
        </div>

        {/* Tap hint */}
        <div className="px-4 sm:px-6 border-t border-gray-50">
          {!sheetOpen && (
            <p className="py-2.5 text-center text-xs text-gray-400">
              Tap a ward to see its name, or a report pin to view its details
            </p>
          )}
          <p className="py-2 text-center text-[10px] text-gray-300 border-t border-gray-50 leading-relaxed">
            {wardLayer === 'bbmp'
              ? 'Ward boundaries: former BBMP 198 wards, shown for reference. Today\'s wards are the GBA 369.'
              : 'Ward boundaries: GBA final delimitation (369 wards, notified Nov 2025) via OpenCity.'}
            {' '}Testimonials without an exact location are assigned to the GBA ward covering their reported area.
          </p>
        </div>

        <CityReportStats />

        <TestimonialsCarousel testimonials={testimonials} onShowWard={showWardFromTestimonial} />

      </div>{/* end normal layout */}

      {/* Backdrop — outside invisible wrapper so it works in fullscreen mode too */}
      <div
        className={`fixed inset-0 bg-black/30 backdrop-blur-[1px] z-[9100] transition-opacity duration-300 ${
          sheetOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={handleClose}
      />

      {/* Bottom sheet — above fullscreen overlay (z-[9000]) and backdrop */}
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
  );
};

export default DashboardPage;
