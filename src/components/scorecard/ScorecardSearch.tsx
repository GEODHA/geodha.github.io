import { useEffect, useMemo, useRef, useState } from 'react';
import { Search, LocateFixed, Loader2, MapPin, X, CornerDownLeft } from 'lucide-react';
import { searchWards, isInBengaluru } from '@/lib/wards';
import type { WardHit } from '@/lib/wards';
import { searchPlaces, isShortMapsLink, parseCoordinates, placeProvider } from '@/lib/placeSearch';
import type { PlaceResult } from '@/lib/placeSearch';
import { trackEvent } from '@/lib/analytics';
import type { ScorecardPick } from './types';

type ListFilter = 'all' | 'bbmp' | 'gba';

const FILTERS: { key: ListFilter; label: string }[] = [
  { key: 'all',  label: 'All wards' },
  { key: 'bbmp', label: '198 BBMP wards' },
  { key: 'gba',  label: '369 GBA wards' },
];

/**
 * One search box for three ways of finding a neighbourhood:
 * ward names from either ward list (live, offline) and places/addresses
 * (on Enter — Google Places when configured, else OpenStreetMap).
 */
export default function ScorecardSearch({ onPick, autoFocus = false, compact = false }: {
  onPick:     (pick: ScorecardPick) => void;
  autoFocus?: boolean;
  compact?:   boolean;
}) {
  const [query,    setQuery]    = useState('');
  const [filter,   setFilter]   = useState<ListFilter>('all');
  const [open,     setOpen]     = useState(false);
  const [places,   setPlaces]   = useState<PlaceResult[] | null>(null);
  const [busy,     setBusy]     = useState(false);
  const [message,  setMessage]  = useState<string | null>(null);
  const [locating, setLocating] = useState(false);
  const [active,   setActive]   = useState(0);
  const boxRef = useRef<HTMLDivElement>(null);

  const wardHits = useMemo(() => searchWards(query, filter, 10), [query, filter]);

  // New query → previous place results are stale.
  useEffect(() => { setPlaces(null); setMessage(null); setActive(0); }, [query]);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const finish = (pick: ScorecardPick, label: string) => {
    setQuery(label);
    setOpen(false);
    onPick(pick);
  };

  const pickWard = (h: WardHit) => {
    trackEvent('scorecard_search', { method: h.kind });
    if (h.kind === 'bbmp') finish({ kind: 'bbmp', num: h.ward.num }, h.ward.name);
    else finish({ kind: 'gba', id: h.ward.id }, h.ward.name);
  };

  const pickPlace = (p: PlaceResult) => {
    trackEvent('scorecard_search', { method: p.source });
    finish({ kind: 'point', lat: p.lat, lng: p.lng, label: p.label }, p.label);
  };

  const runPlaceSearch = async () => {
    const q = query.trim();
    if (q.length < 3) return;
    if (isShortMapsLink(q)) {
      setMessage('Short maps.app.goo.gl links can\'t be read directly — open the link, then copy the full URL from your browser (or tap "Share → Copy coordinates").');
      return;
    }
    const coords = parseCoordinates(q);
    if (coords) {
      if (!isInBengaluru(coords.lat, coords.lng)) { setMessage('That location is outside Bengaluru.'); return; }
      trackEvent('scorecard_search', { method: 'coords' });
      finish({ kind: 'point', lat: coords.lat, lng: coords.lng, label: 'Pinned location' }, q);
      return;
    }
    setBusy(true); setMessage(null); setOpen(true);
    try {
      const res = await searchPlaces(q);
      setPlaces(res);
      setActive(wardHits.length);
      if (res.length === 0) setMessage('No places found in Bengaluru for that search. Try a nearby landmark or your ward name.');
    } catch {
      setMessage('Place search is unavailable right now. Try searching by ward name instead.');
    } finally {
      setBusy(false);
    }
  };

  const locate = () => {
    if (!navigator.geolocation) { setMessage('Location is not supported by your browser.'); return; }
    setLocating(true); setMessage(null);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setLocating(false);
        if (!isInBengaluru(coords.latitude, coords.longitude)) {
          setMessage('Your current location appears to be outside Bengaluru.');
          return;
        }
        trackEvent('scorecard_search', { method: 'locate' });
        finish({ kind: 'point', lat: coords.latitude, lng: coords.longitude, label: 'Your location' }, 'Your location');
      },
      (err) => {
        setLocating(false);
        if (err.code !== 1) setMessage('Could not get your location. Please try again.');
      },
      { enableHighAccuracy: true, timeout: 10_000 },
    );
  };

  // Keyboard: ↑/↓ through ward hits (then place hits), Enter picks or searches places.
  const items: ({ type: 'ward'; hit: WardHit } | { type: 'place'; place: PlaceResult })[] = [
    ...wardHits.map((hit) => ({ type: 'ward' as const, hit })),
    ...(places ?? []).map((place) => ({ type: 'place' as const, place })),
  ];
  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setOpen(true); setActive((a) => Math.min(items.length - 1, a + 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(0, a - 1)); }
    else if (e.key === 'Escape') setOpen(false);
    else if (e.key === 'Enter') {
      e.preventDefault();
      const it = items[active];
      // Enter on the first row when nothing was navigated → place search if
      // there's no good ward-name match, else pick the ward.
      if (it && (it.type === 'place' || it.hit.score >= 60 || places)) {
        if (it.type === 'ward') pickWard(it.hit); else pickPlace(it.place);
      } else {
        runPlaceSearch();
      }
    }
  };

  const showDropdown = open && query.trim().length > 0;

  return (
    <div ref={boxRef} className="relative">
      <div className="flex gap-2">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/50 pointer-events-none" />
          <input
            type="search"
            value={query}
            autoFocus={autoFocus}
            onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
            onKeyDown={onKeyDown}
            placeholder={compact ? 'Search another ward or place…' : 'Ward, area, landmark or Maps link…'}
            aria-label="Search for your neighbourhood"
            className={`w-full pl-10 pr-9 ${compact ? 'py-2.5 text-sm' : 'py-3.5 text-base'} font-medium bg-paper border-[2.5px] border-ink rounded-full
                        focus:outline-none focus:ring-4 focus:ring-secondary/60 placeholder:text-foreground/40`}
          />
          {query && (
            <button
              onClick={() => { setQuery(''); setOpen(false); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-muted"
              aria-label="Clear search"
            >
              <X className="h-4 w-4 text-foreground/50" />
            </button>
          )}
        </div>
        <button
          onClick={locate}
          disabled={locating}
          className={`shrink-0 inline-flex items-center gap-1.5 ${compact ? 'px-3 py-2.5' : 'px-4 py-3.5'} rounded-full border-[2.5px] border-ink bg-secondary font-extrabold text-sm disabled:opacity-60`}
          style={{ boxShadow: 'var(--shadow-offset-3)' }}
          title="Use my location"
        >
          {locating ? <Loader2 className="h-4 w-4 animate-spin" /> : <LocateFixed className="h-4 w-4" />}
          <span className="hidden sm:inline">Near me</span>
        </button>
      </div>

      {!compact && (
        <div className="mt-3 flex flex-wrap gap-1.5" role="group" aria-label="Which ward list to search">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`text-xs font-bold rounded-full px-3 py-1 border-2 transition-colors ${
                filter === f.key ? 'bg-ink text-white border-ink' : 'bg-paper border-ink/25 hover:border-ink'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      )}

      {message && !showDropdown && (
        <p className="mt-2 text-xs font-medium text-destructive">{message}</p>
      )}

      {showDropdown && (
        <div
          className="absolute z-[1200] left-0 right-0 mt-2 bg-paper border-[2.5px] border-ink rounded-2xl overflow-hidden max-h-[60vh] overflow-y-auto"
          style={{ boxShadow: 'var(--shadow-offset-4)' }}
          role="listbox"
        >
          {wardHits.length > 0 && (
            <div className="py-1.5">
              <p className="mono-label !text-[10px] px-4 pt-1.5 pb-1">Wards</p>
              {wardHits.map((h, i) => (
                <button
                  key={`${h.kind}-${h.kind === 'bbmp' ? h.ward.num : h.ward.id}`}
                  role="option"
                  aria-selected={active === i}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => pickWard(h)}
                  className={`w-full text-left px-4 py-2.5 flex items-center justify-between gap-3 ${active === i ? 'bg-tint-yellow' : ''}`}
                >
                  <span className="min-w-0">
                    <span className="block font-bold text-sm truncate">{h.ward.name}</span>
                    <span className="block text-xs text-foreground/60 truncate">
                      {h.kind === 'bbmp'
                        ? `BBMP ward ${h.ward.num}${h.ward.zone ? ` · ${h.ward.zone} zone` : ''}`
                        : `GBA ward ${h.ward.no} · ${h.ward.corp} Corporation · ${h.ward.ac}`}
                    </span>
                  </span>
                  <span className={`shrink-0 text-[10px] font-black rounded-full px-2 py-0.5 border-2 border-ink ${h.kind === 'bbmp' ? 'bg-tint-green' : 'bg-tint-blue'}`}>
                    {h.kind === 'bbmp' ? '198' : '369'}
                  </span>
                </button>
              ))}
            </div>
          )}

          {places && places.length > 0 && (
            <div className="py-1.5 border-t-2 border-ink/10">
              <p className="mono-label !text-[10px] px-4 pt-1.5 pb-1">Places</p>
              {places.map((p, j) => {
                const i = wardHits.length + j;
                return (
                  <button
                    key={`${p.lat},${p.lng},${j}`}
                    role="option"
                    aria-selected={active === i}
                    onMouseEnter={() => setActive(i)}
                    onClick={() => pickPlace(p)}
                    className={`w-full text-left px-4 py-2.5 flex items-start gap-2.5 ${active === i ? 'bg-tint-yellow' : ''}`}
                  >
                    <MapPin className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
                    <span className="min-w-0">
                      <span className="block font-bold text-sm truncate">{p.label}</span>
                      {p.sublabel && <span className="block text-xs text-foreground/60 truncate">{p.sublabel}</span>}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Place-search trigger row */}
          {!places && (
            <button
              onClick={runPlaceSearch}
              disabled={busy || query.trim().length < 3}
              className="w-full text-left px-4 py-3 border-t-2 border-ink/10 flex items-center gap-2.5 text-sm font-bold hover:bg-tint-blue disabled:opacity-50"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <MapPin className="h-4 w-4 text-accent" />}
              <span className="flex-1 truncate">Find “{query.trim()}” on the map</span>
              <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-mono text-foreground/50">
                <CornerDownLeft className="h-3 w-3" /> Enter
              </span>
            </button>
          )}

          {message && <p className="px-4 py-3 text-xs font-medium text-destructive border-t-2 border-ink/10">{message}</p>}

          <p className="px-4 py-2 text-[10px] text-foreground/45 border-t-2 border-ink/10 bg-muted/40">
            Place search by {placeProvider === 'google' ? 'Google Maps' : 'OpenStreetMap (Photon)'} · You can also paste a Google Maps link or “lat, lng”.
          </p>
        </div>
      )}
    </div>
  );
}
