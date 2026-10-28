// Tap-to-interact wrapper for embedded maps on touch screens. While locked, a
// transparent overlay sits over the map so a one-finger swipe scrolls the page
// instead of panning the map (no scroll trap). Tapping unlocks the map; "Done"
// locks it again. Mouse/trackpad devices never see the overlay.

import { useState } from 'react';
import { Hand } from 'lucide-react';
import { cn } from '@/lib/utils';

const isCoarsePointer = () =>
  typeof window !== 'undefined' && !!window.matchMedia?.('(pointer: coarse)').matches;

interface Props {
  exploreLabel: string;
  doneLabel:    string;
  className?:   string;
  style?:       React.CSSProperties;
  children:     React.ReactNode;
}

const MapTouchGuard = ({ exploreLabel, doneLabel, className, style, children }: Props) => {
  const [coarse] = useState(isCoarsePointer);
  const [unlocked, setUnlocked] = useState(false);

  return (
    <div className={cn('relative', className)} style={style}>
      {children}
      {coarse && !unlocked && (
        <button
          onClick={() => setUnlocked(true)}
          className="absolute inset-0 z-[1100] flex items-end justify-center pb-4"
          aria-label={exploreLabel}
        >
          <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-ink bg-paper px-3.5 py-1.5 text-sm font-extrabold shadow">
            <Hand className="h-4 w-4" /> {exploreLabel}
          </span>
        </button>
      )}
      {coarse && unlocked && (
        <button
          onClick={() => setUnlocked(false)}
          className="absolute bottom-3 left-1/2 -translate-x-1/2 z-[1100] rounded-full border-2 border-ink bg-paper px-4 py-1.5 text-sm font-extrabold shadow"
        >
          {doneLabel}
        </button>
      )}
    </div>
  );
};

export default MapTouchGuard;
