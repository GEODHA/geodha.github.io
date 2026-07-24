import { useState, useMemo, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Link, useSearchParams } from 'react-router-dom';
import {
  X, Camera, AlertTriangle, ArrowRight, Search, Loader2, AlertCircle,
  Maximize2, Minimize2, LocateFixed, Share2, Check, ExternalLink,
  ChevronLeft, ChevronRight, Info,
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
import { ZONE_LOOKUP, WARD_CENTROIDS, findWardForPoint } from '@/lib/geo';
import { trackEvent } from '@/lib/analytics';

// ── Firebase hooks ────────────────────────────────────────────────────────────
import { useWardStats }            from '@/hooks/useWardStats';
import { useRecommendedActionsDB } from '@/hooks/useRecommendedActionsDB';
import { useTestimonialsDB }       from '@/hooks/useTestimonialsDB';

// ── Shared types ──────────────────────────────────────────────────────────────
import type { WardData, RecommendedActionDoc, ProblemCategory, TestimonialDoc } from '@/services/geodhaService';

// ── Severity scale ────────────────────────────────────────────────────────────
import { computeScale, BAND } from '@/lib/severity';
import type { BandLevel, ClassifyFn } from '@/lib/severity';

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

// ── Date formatter — "2026-04-15" → "April 2026" ─────────────────────────────

function formatMonthYear(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00'); // force local-date parse
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
}

// ── Action-step template resolver ─────────────────────────────────────────────
// Supported placeholders (set in Firestore, resolved at render time):
//   {ward_num}   → raw ward number, e.g. "12"
//   {ward_phone} → ward marshal phone, e.g. "9448197012"  (9448197 + 3-digit padded ward_num)

function resolveStep(text: string, wardNum: number): string {
  const phone = `9448197${String(wardNum).padStart(3, '0')}`;
  return text.replace(/\{ward_num\}/g, String(wardNum)).replace(/\{ward_phone\}/g, phone);
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

// ── Sub-components ────────────────────────────────────────────────────────────

function GarbageMoundIcon({ size = 20 }: { size?: number }) {
  const h = Math.round(size * 0.88);
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={h} viewBox="0 0 18 16" aria-hidden="true">
      <ellipse cx="9" cy="14.5" rx="8.5" ry="1.5" fill="#57534e" />
      <path d="M1.5 14.5 C2 9.5 5 7 9 6.5 C13 7 16 9.5 16.5 14.5 Z" fill="#78716c" />
      <line x1="6"  y1="9" x2="5"  y2="5" stroke="#a8a29e" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="9"  y1="7" x2="9"  y2="3" stroke="#a8a29e" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="12" y1="9" x2="13" y2="5" stroke="#a8a29e" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

function ProblemIcon({ category, size }: { category: ProblemCategory; size?: number }) {
  if (category === 'garbage_dump') return <GarbageMoundIcon size={size ?? 22} />;
  const emoji = category === 'burning_of_garbage' ? '🔥' : '🚛';
  return <span style={{ fontSize: size ? `${size}px` : '1.375rem', lineHeight: 1 }}>{emoji}</span>;
}

function BandBadge({ band, size = 'sm' }: { band: BandLevel; size?: 'sm' | 'lg' }) {
  const cfg = BAND[band];
  return (
    <span
      className={`inline-block font-bold rounded-full ${size === 'lg' ? 'text-sm px-3 py-1' : 'text-[11px] px-2 py-0.5'}`}
      style={{ background: cfg.badgeBg, color: cfg.badgeFg }}
    >
      {cfg.label}
    </span>
  );
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

function WardSearch({
  wardDataMap,
  onSelect,
}: {
  wardDataMap: Record<number, WardData>;
  onSelect: (wardNum: number, data: WardData, zone: string) => void;
}) {
  const [query,         setQuery]         = useState('');
  const [open,          setOpen]          = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
  const wrapperRef = useRef<HTMLDivElement>(null);

  const sorted = useMemo(
    () => Object.values(wardDataMap).sort((a, b) => a.ward_name.localeCompare(b.ward_name)),
    [wardDataMap],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q.length === 0 ? sorted : sorted.filter((w) => w.ward_name.toLowerCase().includes(q));
  }, [query, sorted]);

  const reposition = () => {
    if (!wrapperRef.current) return;
    const r = wrapperRef.current.getBoundingClientRect();
    setDropdownStyle({ position: 'fixed', top: r.bottom + 4, left: r.left, width: r.width });
  };

  const handleOpen = () => { reposition(); setOpen(true); };

  const choose = (w: WardData) => {
    setQuery(w.ward_name);
    setOpen(false);
    onSelect(w.ward_num, w, ZONE_LOOKUP[w.ward_num] ?? '');
  };

  return (
    <div ref={wrapperRef} className="mt-2">
      <div className="relative flex items-center">
        <Search className="absolute left-3 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
        <input
          type="text"
          value={query}
          placeholder="Search ward by name…"
          onChange={(e) => { setQuery(e.target.value); handleOpen(); }}
          onFocus={handleOpen}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg bg-white shadow-sm
                     focus:outline-none focus:ring-1 focus:ring-gray-300 text-gray-700 placeholder-gray-400"
        />
      </div>
      {open && filtered.length > 0 && createPortal(
        <div
          style={{ ...dropdownStyle, zIndex: 99999 }}
          className="bg-white border border-gray-200 rounded-lg shadow-xl max-h-52 overflow-y-auto"
        >
          {filtered.slice(0, 25).map((w) => (
            <button
              key={w.ward_num}
              className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center justify-between"
              onMouseDown={() => choose(w)}
            >
              <span>{w.ward_name}</span>
              <span className="text-[10px] text-gray-400 ml-2">#{w.ward_num}</span>
            </button>
          ))}
        </div>,
        document.body,
      )}
    </div>
  );
}

// ── Ward detail bottom sheet ──────────────────────────────────────────────────

interface WardSheetProps {
  data:            WardData;
  zone:            string;
  scales:          { dump: ClassifyFn; veh: ClassifyFn; burn: ClassifyFn; total: ClassifyFn };
  actions:         Record<ProblemCategory, RecommendedActionDoc> | null;
  allTestimonials: TestimonialDoc[];
  onClose:         () => void;
}

function WardSheet({ data, zone, scales, actions, allTestimonials, onClose }: WardSheetProps) {
  const overallBand  = scales.total(data.total_reports) as BandLevel;
  const testimonials = allTestimonials.filter(
    (t) => t.ward_num === data.ward_num || (t.extra_ward_nums ?? []).includes(data.ward_num),
  );

  // Share state
  const [copied, setCopied] = useState(false);

  // Image lightbox state
  // allImages = full-resolution URLs for the lightbox
  // allThumbs = 300px thumbnails for the preview strip (falls back to full URL)
  const allImages = testimonials.flatMap((t) => t.images);
  const allThumbs = testimonials.flatMap((t) =>
    t.images.map((url, i) => t.thumb_images?.[i] ?? url)
  );
  const [lightbox, setLightbox] = useState<{ idx: number } | null>(null);

  // Active problem (for recommended-action selection)
  const [activeCategory, setActiveCategory] = useState<ProblemCategory | null>(null);
  useEffect(() => { setActiveCategory(null); }, [data.ward_num]);

  const handleShare = async () => {
    trackEvent('share_click', { target: 'ward', ward_num: data.ward_num });
    const url  = `${window.location.origin}/dashboard?ward=${data.ward_num}`;
    const text = `📍 ${data.ward_name} (BBMP Ward ${data.ward_num}) — see garbage-related issues reported in this ward on GEODHA`;
    if (navigator.share) {
      try {
        await navigator.share({ title: data.ward_name, text, url });
        return;
      } catch (err) {
        // User dismissed the share sheet — don't fall through to clipboard
        if ((err as Error).name === 'AbortError') return;
        // Any other error → fall through to clipboard
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch { /* ignore */ }
  };

  const problems: { category: ProblemCategory; label: string; band: BandLevel; count: number }[] = [
    { category: 'garbage_dump',               label: 'Garbage Dumps',      band: scales.dump(data.garbage_dump)                as BandLevel, count: data.garbage_dump },
    { category: 'garbage_vehicle_not_arrived', label: 'Missed Collections', band: scales.veh(data.garbage_vehicle_not_arrived) as BandLevel, count: data.garbage_vehicle_not_arrived },
    { category: 'burning_of_garbage',         label: 'Open Burning',       band: scales.burn(data.burning_of_garbage)          as BandLevel, count: data.burning_of_garbage },
  ].sort((a, b) => b.band !== a.band ? b.band - a.band : b.count - a.count);

  const top      = problems[0];
  const others   = problems.slice(1).filter((p) => p.band >= 2);
  const allClean = problems.every((p) => p.band <= 1);

  // Which problem's recommended action to show — defaults to #1
  const shownCategory   = activeCategory ?? top.category;
  const shownProblem    = problems.find((p) => p.category === shownCategory) ?? top;
  const action          = actions?.[shownCategory] ?? null;

  return (
    <>
      {/* Image lightbox portal */}
      {lightbox && allImages.length > 0 && (
        <ImageLightbox
          images={allImages}
          initialIndex={lightbox.idx}
          onClose={() => setLightbox(null)}
        />
      )}

      <div className="flex flex-col">
        <div className="flex items-start justify-between px-5 pt-3 pb-3 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-bold leading-tight" style={{ fontFamily: "'Archivo', sans-serif" }}>
              {data.ward_name}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Ward {data.ward_num}{zone ? ` · ${zone}` : ''}
            </p>
          </div>
          <div className="flex items-center gap-1.5 ml-3 mt-0.5">
            <BandBadge band={overallBand} size="sm" />
            {/* Share ward */}
            <button
              onClick={handleShare}
              title={copied ? 'Link copied!' : 'Share this ward'}
              className="p-1.5 rounded-full hover:bg-gray-100 transition-colors"
              aria-label="Share"
            >
              {copied
                ? <Check className="h-3.5 w-3.5 text-green-500" />
                : <Share2 className="h-3.5 w-3.5 text-gray-400" />}
            </button>
            <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-700" aria-label="Close">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto" style={{ maxHeight: 'calc(82vh - 100px)', paddingBottom: 'env(safe-area-inset-bottom, 1.5rem)' }}>

          {/* Problems */}
          <div className="px-5 pt-4 pb-3">
            {allClean ? (
              <div className="space-y-3">
                {/* Clean status */}
                <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl px-4 py-3.5">
                  <span className="text-2xl">✅</span>
                  <div>
                    <p className="text-sm font-semibold text-green-800">Low reported issues</p>
                    <p className="text-xs text-green-700 mt-0.5">This ward has minimal complaints across all waste categories.</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {/* #1 Problem card — clickable to re-select */}
                <button
                  className={`w-full text-left rounded-xl border-2 p-4 transition-all ${shownCategory === top.category ? 'ring-2 ring-offset-1' : 'opacity-90 hover:opacity-100'}`}
                  style={{
                    borderColor: BAND[top.band].dot,
                    background:  BAND[top.band].cardBg,
                    ...(shownCategory === top.category ? { outlineColor: BAND[top.band].dot } : {}),
                  }}
                  onClick={() => setActiveCategory(top.category)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="leading-none flex items-center"><ProblemIcon category={top.category} size={24} /></span>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">#1 Problem</p>
                        <p className="text-base font-bold text-gray-900 leading-tight">{top.label}</p>
                      </div>
                    </div>
                    <BandBadge band={top.band} size="lg" />
                  </div>
                  {top.band >= 4 && (
                    <p className="text-xs text-gray-600 mt-1 flex items-start gap-1.5">
                      <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" style={{ color: BAND[top.band].dot }} />
                      Among the highest affected wards in the city for this issue.
                    </p>
                  )}
                </button>

                {/* Secondary problems — clickable to view their recommended action */}
                {others.map((p, i) => (
                  <button
                    key={p.category}
                    onClick={() => setActiveCategory(p.category)}
                    className={`w-full flex items-center justify-between py-2.5 px-3 rounded-lg border transition-all ${
                      shownCategory === p.category
                        ? 'bg-blue-50 border-blue-200 ring-1 ring-blue-200'
                        : 'bg-gray-50 border-gray-100 hover:bg-gray-100 hover:border-gray-200'
                    }`}
                  >
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <span className="leading-none opacity-80 flex items-center"><ProblemIcon category={p.category} size={18} /></span>
                      <span className="font-medium">
                        <span className="text-[10px] text-gray-400 font-semibold mr-1">#{i + 2}</span>
                        {p.label}
                      </span>
                    </div>
                    <BandBadge band={p.band} />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="mx-5 border-t border-gray-100" />
          
          

          {/* Photos */}
          {allImages.length > 0 ? (
            <section className="px-5 pt-4 pb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Photos</h3>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {allImages.map((_src, i) => (
                  <button
                    key={i}
                    onClick={() => setLightbox({ idx: i })}
                    className="flex-shrink-0 rounded-lg overflow-hidden border border-gray-200 hover:border-gray-400 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400"
                    aria-label={`View photo ${i + 1}`}
                  >
                    <img
                      src={allThumbs[i]}
                      alt={`Ward photo ${i + 1}`}
                      className="h-28 w-28 object-cover"
                      loading="lazy"
                    />
                  </button>
                ))}
              </div>
            </section>
          ) : (
            <section className="px-5 pt-4 pb-2">
              <div className="flex items-center gap-2 text-xs text-gray-400 bg-gray-50 rounded-lg px-3 py-2.5 border border-dashed border-gray-200">
                <Camera className="h-3.5 w-3.5" />
                Photos will appear here when available for this ward.
              </div>
            </section>
          )}

          {/* Testimonials — split into negative (amber) and positive (green) */}
          {testimonials.length > 0 && (() => {
            const negative = testimonials.filter((t) => !(t.is_positive ?? false));
            const positive = testimonials.filter((t) =>   t.is_positive ?? false);
            return (
              <>
                {negative.length > 0 && (
                  <>
                    <div className="mx-5 mt-3 border-t border-gray-100" />
                    <section className="px-5 pt-4 pb-2">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Citizen Testimonials &amp; Insights</h3>
                      <div className="space-y-3">
                        {negative.map((c) => (
                          <div key={c.id} className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 space-y-2">
                            <p className="text-xs font-bold text-gray-800 leading-snug">{c.title}</p>
                            <blockquote className="text-xs italic text-gray-600 leading-relaxed border-l-2 border-amber-400 pl-2.5">
                              "{renderWithLinks(c.quote)}"
                            </blockquote>
                            <p className="text-[10px] text-gray-400">
                              {c.source}{c.locality ? ` · ${c.locality}` : ''}{c.date ? ` · ${formatMonthYear(c.date)}` : ''}
                            </p>
                          </div>
                        ))}
                      </div>
                    </section>
                  </>
                )}
                {positive.length > 0 && (
                  <>
                    <div className="mx-5 mt-3 border-t border-gray-100" />
                    <section className="px-5 pt-4 pb-2">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3 flex items-center gap-1.5">
                        <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-green-700 text-white text-[9px] font-black">✓</span>
                        Success Stories
                      </h3>
                      <div className="space-y-3">
                        {positive.map((c) => (
                          <div key={c.id} className="bg-green-50 border border-green-200 rounded-xl p-3.5 space-y-2">
                            <p className="text-xs font-bold text-gray-800 leading-snug">{c.title}</p>
                            <blockquote className="text-xs italic text-gray-600 leading-relaxed border-l-2 border-green-500 pl-2.5">
                              "{renderWithLinks(c.quote)}"
                            </blockquote>
                            <p className="text-[10px] text-gray-400">
                              {c.source}{c.locality ? ` · ${c.locality}` : ''}{c.date ? ` · ${formatMonthYear(c.date)}` : ''}
                            </p>
                          </div>
                        ))}
                      </div>
                    </section>
                  </>
                )}
              </>
            );
          })()}

          {/* Recommended Action */}
          {!allClean && action && (
            <>
              <div className="mx-5 mt-3 border-t border-gray-100" />
              <section className="px-5 pt-4 pb-2">
                {/* Violation context card */}
                <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 flex items-start gap-2 mb-3">
                  <span className="leading-none mt-0.5 flex items-center shrink-0"><ProblemIcon category={shownCategory} size={20} /></span>
                  <div>
                    <p className="text-sm font-bold text-gray-800">{action.label}</p>
                    <p className="text-xs mt-0.5 leading-relaxed text-gray-500">{action.violation}</p>
                  </div>
                </div>

                {/* Steps */}
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
                  Recommended Actions
                </h3>
                <div className="bg-gray-50 border border-gray-200 rounded-xl overflow-hidden">
                  <div className="divide-y divide-gray-100">
                    {action.steps.map((s, i) => {
                      const heading  = resolveStep(s.heading,          data.ward_num);
                      const detail   = resolveStep(s.detail,           data.ward_num);
                      const url      = s.url     ? resolveStep(s.url,     data.ward_num) : undefined;
                      const urlText  = s.urlText ? resolveStep(s.urlText, data.ward_num) : undefined;
                      return (
                        <div key={i} className="flex gap-3 px-4 py-3">
                          <span className="text-base leading-none mt-0.5 shrink-0">{s.emoji}</span>
                          <div>
                            <p className="text-xs font-semibold text-gray-800">{heading}</p>
                            <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{detail}</p>
                            {url && (
                              <a
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 hover:underline mt-1"
                              >
                                {urlText?.trim() || 'Learn more'} <ExternalLink className="h-2.5 w-2.5" />
                              </a>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </section>
            </>
          )}

          <div className="px-5 pt-4 pb-3">
            {allClean ? (
              <div className="space-y-3">
                {/* Report a problem */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3.5 space-y-1.5">
                  <p className="text-xs font-bold text-blue-800">🗑️ See a garbage problem?</p>
                  <p className="text-xs text-blue-700 leading-relaxed">
                    File a complaint on{' '}
                    <a href="https://nammabengaluru.org.in" target="_blank" rel="noopener noreferrer"
                      className="underline font-semibold">nammabengaluru.org.in</a>
                    {' '}or call your Ward {data.ward_num} Marshall directly at{' '}
                    <a href={`tel:9448197${String(data.ward_num).padStart(3, '0')}`}
                      className="underline font-semibold text-blue-900">
                      9448197{String(data.ward_num).padStart(3, '0')}
                    </a>.
                  </p>
                </div>

                {/* Segregation guide */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3.5 space-y-1.5">
                  <p className="text-xs font-bold text-blue-800">♻️ Practising good waste habits?</p>
                  <p className="text-xs text-blue-700 leading-relaxed">
                    Learn the 4-stream segregation rules for Bengaluru — wet, dry, sanitary, and hazardous.<br />{' '}
                    <Link to="/guide" className="underline font-semibold text-blue-900">
                      Read our segregation guide →
                    </Link>
                  </p>
                </div>
              </div>
            ) : null}
          </div>

          {/* CTA */}
          <div className="px-5 pt-4 pb-6">
            <Link
              to="/report"
              onClick={() => window.scrollTo(0, 0)}
              className="flex items-center justify-between w-full bg-white border border-gray-200 rounded-xl px-4 py-3.5 shadow-sm hover:shadow transition-shadow"
            >
              <div>
                <p className="text-sm font-semibold text-gray-800">Need more guidance?</p>
                <p className="text-xs text-gray-500 mt-0.5">Want to add a report or tell us about an issue in your area?</p>
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

// ── Map legend ────────────────────────────────────────────────────────────────

function MapLegend({ mode = 'stats' }: { mode?: 'stats' | 'reports' }) {
  if (mode === 'reports') {
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

  const bands: BandLevel[] = [1, 2, 3, 4, 5];
  return (
    <div className="flex items-center gap-0.5 flex-wrap text-[10px] text-gray-500">
      {bands.map((b) => (
        <span key={b} className="flex items-center gap-1 mr-2">
          <span className="inline-block h-2.5 w-4 rounded-sm border border-black/8" style={{ background: BAND[b].mapColor }} />
          {BAND[b].label}
        </span>
      ))}
      <span className="flex items-center gap-1 mr-2 ml-1 pl-2 border-l border-gray-200">
        <GarbageMoundIcon size={14} /><span>🚛🔥</span><span>Top-affected</span>
      </span>
      <span className="flex items-center gap-1 ml-1 pl-2 border-l border-gray-200">
        <span className="inline-flex items-center justify-center h-3.5 w-3.5 rounded-full bg-red-600 text-white text-[8px] font-bold">!</span>
        <span>Reported cases</span>
      </span>
      <span className="flex items-center gap-1 ml-1">
        <span className="inline-flex items-center justify-center h-3.5 w-3.5 rounded-full bg-green-700 text-white text-[8px] font-bold">✓</span>
        <span>Success stories</span>
      </span>
      <ReportColorLegend suffix="(zoom in)" />
    </div>
  );
}

// ── View-mode toggle ──────────────────────────────────────────────────────────

function ViewModeToggle({ mode, onChange }: {
  mode:     'stats' | 'reports';
  onChange: (m: 'stats' | 'reports') => void;
}) {
  const btnCls = (active: boolean) =>
    `px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
      active ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
    }`;
  return (
    <div className="inline-flex items-center bg-gray-100 rounded-full p-1 shrink-0" role="tablist" aria-label="Dashboard view mode">
      <button role="tab" aria-selected={mode === 'reports'} className={btnCls(mode === 'reports')} onClick={() => onChange('reports')}>
        View Only Reports
      </button>
      <button role="tab" aria-selected={mode === 'stats'} className={btnCls(mode === 'stats')} onClick={() => onChange('stats')}>
        View All Statistics
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

  // ── URL params ────────────────────────────────────────────────────────────
  const [searchParams] = useSearchParams();
  const urlWardHandled = useRef(false);

  // ── UI state ──────────────────────────────────────────────────────────────
  const [selectedWard,   setSelectedWard]   = useState<{ num: number; data: WardData; zone: string } | null>(null);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [sheetOpen,      setSheetOpen]      = useState(false);
  const [zoomToWard,   setZoomToWard]   = useState<number | null>(null);
  const [fullscreen,   setFullscreen]   = useState(false);
  const [locating,     setLocating]     = useState(false);
  const [dashCopied,   setDashCopied]   = useState(false);
  const [viewMode,     setViewMode]     = useState<'stats' | 'reports'>('reports');

  const handleViewModeChange = (m: 'stats' | 'reports') => {
    setViewMode(m);
    trackEvent('dashboard_view_mode', { mode: m });
  };

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

  const handleWardSelect = (wardNum: number, data: WardData, zone: string) => {
    setSelectedReport(null);
    setSelectedWard({ num: wardNum, data, zone });
    setSheetOpen(true);
    trackEvent('ward_selected', { ward_num: wardNum });
  };

  const handleSearchSelect = (wardNum: number, data: WardData, zone: string) => {
    setSelectedReport(null);
    setSelectedWard({ num: wardNum, data, zone });
    setSheetOpen(true);
    setZoomToWard(wardNum);
  };

  const handleReportSelect = (reportId: string) => {
    const report = appReports.find((r) => r.id === reportId);
    if (!report) return;
    setSelectedWard(null);
    setSelectedReport(report);
    setSheetOpen(true);
    trackEvent('report_pin_tap', { report_id: reportId, category: report.category });
  };

  const handleClose = () => {
    setSheetOpen(false);
    setTimeout(() => { setSelectedWard(null); setSelectedReport(null); }, 320);
  };

  // Auto-open ward from ?ward= URL param once data is loaded
  useEffect(() => {
    if (urlWardHandled.current) return;
    const wardCount = Object.keys(wardDataMap).length;
    if (wardCount === 0) return;
    urlWardHandled.current = true;
    const param = searchParams.get('ward');
    if (!param) return;
    const wardNum = parseInt(param, 10);
    if (isNaN(wardNum)) return;
    const wardData = wardDataMap[wardNum];
    if (wardData) handleSearchSelect(wardNum, wardData, ZONE_LOOKUP[wardNum] ?? '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wardDataMap]);

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
        // Check within Bangalore bounding box
        if (lat < 12.68 || lat > 13.20 || lng < 77.30 || lng > 77.90) {
          alert('Your current location appears to be outside Bengaluru.');
          return;
        }
        const wardNum = findWardForPoint(lat, lng);
        if (!wardNum) { alert('Could not match your location to a ward boundary.'); return; }
        const wardData = wardDataMap[wardNum];
        if (wardData) handleSearchSelect(wardNum, wardData, ZONE_LOOKUP[wardNum] ?? '');
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
    const text = `🗺️ See Bengaluru's ward-by-ward garbage problem map. Find your area and see what residents can do about it →`;
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

  // ── Testimonial markers for the map ───────────────────────────────────────
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

  // ── Shared map block (used in both normal and fullscreen layouts) ──────────
  const mapBlock = (minH?: string) => (
    <div className={`relative ${!minH ? 'flex-1' : ''}`} style={minH ? { height: minH } : {}}>
      <div className="absolute inset-0">
        <MapErrorBoundary>
          <WardMap
            wardDataMap={wardDataMap}
            selectedWard={selectedWard?.num ?? null}
            onWardSelect={handleWardSelect}
            zoomToWard={zoomToWard}
            testimonialMarkers={testimonialMarkers}
            appReports={appReportPins}
            onReportSelect={handleReportSelect}
            mode={viewMode}
          />
        </MapErrorBoundary>
      </div>

      {/* Locate-me button — bottom-right corner */}
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
          {/* Compact header: mode toggle + search + exit */}
          <div className="px-3 py-2 bg-white border-b border-gray-100 flex items-center gap-2 shrink-0">
            <ViewModeToggle mode={viewMode} onChange={handleViewModeChange} />
            {viewMode === 'stats' && (
              <div className="flex-1 min-w-0">
                <WardSearch wardDataMap={wardDataMap} onSelect={handleSearchSelect} />
              </div>
            )}
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
            <MapLegend mode={viewMode} />
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
                {viewMode === 'reports'
                  ? 'Live reports from the GEODHA app, plotted on the ward map'
                  : 'May 2026 · Select any ward or area to view more details'}
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

          {/* View mode toggle */}
          <div className="mt-3">
            <ViewModeToggle mode={viewMode} onChange={handleViewModeChange} />
          </div>

          {viewMode === 'stats' && <WardSearch wardDataMap={wardDataMap} onSelect={handleSearchSelect} />}
        </div>

        {/* Legend — above map */}
        <div className="px-4 sm:px-6 py-2 border-y border-gray-100 bg-white">
          <MapLegend mode={viewMode} />
        </div>

        {/* Map */}
        {mapBlock('70vh')}

        {/* Tap hint + severity disclaimer */}
        <div className="px-4 sm:px-6 border-t border-gray-50">
          {!sheetOpen && (
            <p className="py-2.5 text-center text-xs text-gray-400">
              {viewMode === 'reports'
                ? 'Tap a report pin to view its details'
                : 'Tap any ward to explore issues and recommended actions'}
            </p>
          )}
          {viewMode === 'stats' && (
            <p className="py-2 text-center text-[10px] text-gray-300 border-t border-gray-50 leading-relaxed">
              Severity ratings are relative — assessed by percentile intensity across Bengaluru's wards and aggregated from multiple citizen report sources.
            </p>
          )}
        </div>

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
          {selectedReport ? (
            <ReportSheet report={selectedReport} onClose={handleClose} />
          ) : selectedWard ? (
            <WardSheet
              data={selectedWard.data}
              zone={selectedWard.zone}
              scales={scales}
              actions={actions}
              allTestimonials={testimonials}
              onClose={handleClose}
            />
          ) : null}
        </div>
      </div>
    </>
  );
};

export default DashboardPage;