import { useEffect, useMemo, useState } from 'react';
import { Loader2, Map as MapIcon, Search, ClipboardList, Phone } from 'lucide-react';
import WardMap from '@/components/WardMap';
import type { TestimonialMarkerInfo } from '@/components/WardMap';
import MapErrorBoundary from '@/components/MapErrorBoundary';
import { BandBadge } from '@/components/dashboard/shared';
import type { WardData, RecommendedActionDoc, ProblemCategory, TestimonialDoc } from '@/services/geodhaService';
import { findWardForPoint } from '@/lib/geo';
import {
  GBA_SOURCE_URL, gbaWardsForBbmp, findGbaWardForPoint, loadGbaGeometries,
} from '@/lib/wards';
import { trackEvent } from '@/lib/analytics';
import ScorecardSearch from './ScorecardSearch';
import TestimonialsFeed from './TestimonialsFeed';
import WardScorecard from './WardScorecard';
import type { Scales, ScorecardPick, ScorecardSelection } from './types';
import { selectionFromBbmp, selectionFromGba } from './selection';

interface Props {
  wardDataMap:        Record<number, WardData>;
  scales:             Scales;
  actions:            Record<ProblemCategory, RecommendedActionDoc> | null;
  testimonials:       TestimonialDoc[];
  testimonialMarkers: TestimonialMarkerInfo[];
  selection:          ScorecardSelection | null;
  onSelectionChange:  (sel: ScorecardSelection | null) => void;
}

const HOW_IT_WORKS = [
  { Icon: Search,        title: 'Find your area',     body: 'Old BBMP ward, new GBA ward, a landmark, an address or a Google Maps link.' },
  { Icon: ClipboardList, title: 'See the report card', body: 'Reported garbage issues, how your ward compares, and what residents say.' },
  { Icon: Phone,         title: 'Know who to call',    body: 'Your corporation, ward marshal, zonal officials and complaint channels.' },
];

export default function NeighbourhoodScorecard({
  wardDataMap, scales, actions, testimonials, testimonialMarkers, selection, onSelectionChange,
}: Props) {
  const [resolving, setResolving] = useState(false);
  const [resolveError, setResolveError] = useState<string | null>(null);
  const [highlight, setHighlight] = useState<{ id: string; geometry: GeoJSON.Geometry } | null>(null);

  const gbaId = selection?.gbaId ?? null;

  // Outline the selected GBA ward on the map (boundaries load lazily).
  useEffect(() => {
    if (!gbaId) { setHighlight(null); return; }
    let cancelled = false;
    loadGbaGeometries()
      .then((geoms) => { if (!cancelled && geoms[gbaId]) setHighlight({ id: gbaId, geometry: geoms[gbaId] }); })
      .catch(() => { if (!cancelled) setHighlight(null); });
    return () => { cancelled = true; };
  }, [gbaId]);

  const select = (sel: ScorecardSelection | null) => {
    onSelectionChange(sel);
    if (sel) window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePick = async (pick: ScorecardPick) => {
    setResolveError(null);
    if (pick.kind === 'bbmp') return select(selectionFromBbmp(pick.num));
    if (pick.kind === 'gba')  return select(selectionFromGba(pick.id));

    setResolving(true);
    try {
      const bbmpNum = findWardForPoint(pick.lat, pick.lng);
      let gba = null;
      try { gba = await findGbaWardForPoint(pick.lat, pick.lng); } catch { /* fall back to crosswalk */ }
      if (bbmpNum == null && !gba) {
        setResolveError("We couldn't match that spot to a ward. Try a nearby landmark or your ward name.");
        return;
      }
      select({
        bbmpNum: bbmpNum ?? gba?.bbmp[0]?.[0] ?? null,
        gbaId:   gba?.id ?? (bbmpNum != null ? gbaWardsForBbmp(bbmpNum)[0]?.ward.id ?? null : null),
        place:   { label: pick.label, lat: pick.lat, lng: pick.lng },
      });
    } finally {
      setResolving(false);
    }
  };

  const mostReported = useMemo(() =>
    Object.values(wardDataMap).sort((a, b) => b.total_reports - a.total_reports).slice(0, 6),
  [wardDataMap]);

  const onMapWard = (num: number) => {
    trackEvent('ward_selected', { ward_num: num, source: 'scorecard_map' });
    select(selectionFromBbmp(num));
  };

  const map = (
    <div className="relative h-[55vh] lg:h-full min-h-[320px] rounded-2xl border-[3px] border-ink overflow-hidden" style={{ boxShadow: 'var(--shadow-offset-4)' }}>
      <MapErrorBoundary>
        <WardMap
          wardDataMap={wardDataMap}
          selectedWard={selection?.bbmpNum ?? null}
          onWardSelect={onMapWard}
          zoomToWard={highlight ? null : selection?.bbmpNum ?? null}
          testimonialMarkers={testimonialMarkers}
          mode="stats"
          highlight={highlight}
        />
      </MapErrorBoundary>
      <div className="absolute left-2 bottom-2 z-[999] bg-paper/95 border-2 border-ink rounded-lg px-2.5 py-1.5 text-[10px] font-bold leading-tight max-w-[70%]">
        Fill = reported issues (198 wards){highlight && <><br /><span className="text-accent">- - -</span> GBA ward boundary</>}
      </div>
    </div>
  );

  return (
    <div className="container px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)] gap-6 lg:gap-8">
        {/* ── Left: search + content ──────────────────────────────────────── */}
        <div className="min-w-0 space-y-8">
          {!selection ? (
            <section className="bg-stripes-yellow border-[3px] border-ink rounded-2xl p-5 sm:p-8" style={{ boxShadow: 'var(--shadow-offset-6)' }}>
              <p className="mono-label !text-ink/70 mb-2">Neighbourhood scorecard</p>
              <h2 className="text-3xl sm:text-4xl font-black tracking-[-0.03em] leading-[1.05] mb-2">How's your neighbourhood doing?</h2>
              <p className="font-semibold text-ink/75 mb-5 max-w-xl">
                Search by your ward — old (198) or new (369) — or any place in Bengaluru to see its garbage report card,
                which corporation it falls under and who to contact.
              </p>
              <div className="bg-paper/90 rounded-2xl p-3 sm:p-4 border-2 border-ink">
                <ScorecardSearch onPick={handlePick} />
              </div>
              {resolving && <p className="mt-3 text-sm font-bold flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Finding your ward…</p>}
              {resolveError && <p className="mt-3 text-sm font-bold text-destructive">{resolveError}</p>}
            </section>
          ) : (
            <div className="space-y-2">
              <ScorecardSearch onPick={handlePick} compact />
              {resolving && <p className="text-sm font-bold flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Finding your ward…</p>}
              {resolveError && <p className="text-sm font-bold text-destructive">{resolveError}</p>}
            </div>
          )}

          {selection ? (
            <WardScorecard
              selection={selection}
              wardDataMap={wardDataMap}
              scales={scales}
              actions={actions}
              testimonials={testimonials}
              onChange={select}
              onClear={() => select(null)}
            />
          ) : (
            <>
              <TestimonialsFeed testimonials={testimonials} onSelectWard={(n) => select(selectionFromBbmp(n))} />

              <section>
                <p className="mono-label mb-1">Quick picks</p>
                <h2 className="text-xl font-black mb-3">Most-reported wards</h2>
                <div className="grid sm:grid-cols-2 gap-2.5">
                  {mostReported.map((w) => (
                    <button
                      key={w.ward_num}
                      onClick={() => select(selectionFromBbmp(w.ward_num))}
                      className="flex items-center justify-between gap-3 text-left bg-paper border-[2.5px] border-ink rounded-xl px-4 py-3 hover:bg-tint-yellow transition-colors"
                    >
                      <span className="min-w-0">
                        <span className="block font-bold truncate">{w.ward_name}</span>
                        <span className="block text-xs text-foreground/60">BBMP ward {w.ward_num} · {w.total_reports} reports</span>
                      </span>
                      <BandBadge band={scales.total(w.total_reports)} />
                    </button>
                  ))}
                </div>
              </section>

              <section className="grid sm:grid-cols-3 gap-3">
                {HOW_IT_WORKS.map(({ Icon, title, body }) => (
                  <div key={title} className="bg-paper border-[2.5px] border-ink rounded-xl p-4">
                    <span className="h-9 w-9 rounded-lg bg-primary border-2 border-ink flex items-center justify-center mb-2">
                      <Icon className="h-4 w-4 text-white" />
                    </span>
                    <p className="font-extrabold text-sm">{title}</p>
                    <p className="text-xs text-foreground/65 leading-relaxed mt-0.5">{body}</p>
                  </div>
                ))}
              </section>
            </>
          )}
        </div>

        {/* ── Right: map (sticky on desktop) ──────────────────────────────── */}
        <aside className="min-w-0 lg:sticky lg:top-20 lg:h-[calc(100vh-7rem)] space-y-2">
          <p className="mono-label flex items-center gap-1.5 lg:hidden"><MapIcon className="h-3.5 w-3.5" /> Tap any ward on the map</p>
          {map}
          <p className="text-[10px] text-foreground/50 leading-relaxed">
            GBA ward boundaries: GBA Wards Delimitation 2025 via{' '}
            <a href={GBA_SOURCE_URL} target="_blank" rel="noopener noreferrer" className="underline">OpenCity</a>.
            Old ↔ new ward matches are approximate (by area overlap).
          </p>
        </aside>
      </div>
    </div>
  );
}
