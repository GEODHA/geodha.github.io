// Horizontally scrolling row that drifts slowly on its own. Items are
// rendered twice so the drift loops seamlessly; hovering, touching or
// focusing pauses it and the row stays swipeable / scrollable by hand.
// Honors prefers-reduced-motion (no auto drift).

import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';

interface Props<T> {
  items: T[];
  renderItem: (item: T, index: number) => ReactNode;
  getKey: (item: T) => string;
  /** Drift speed in px per second. */
  speed?: number;
  className?: string;
}

function AutoScrollRow<T>({ items, renderItem, getKey, speed = 22, className = '' }: Props<T>) {
  const ref    = useRef<HTMLDivElement>(null);
  const paused = useRef(false);
  const resumeTimer = useRef<ReturnType<typeof setTimeout>>();

  // Only loop (duplicate) when there's enough content to scroll.
  const loop = items.length >= 3;

  useEffect(() => {
    const el = ref.current;
    if (!el || !loop) return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;

    let raf = 0;
    let last = performance.now();
    let carry = 0; // sub-pixel accumulator (scrollLeft rounds to ints)

    const tick = (now: number) => {
      const dt = Math.min(now - last, 100);
      last = now;
      if (!paused.current && el.scrollWidth > el.clientWidth) {
        carry += (speed * dt) / 1000;
        const step = Math.floor(carry);
        if (step > 0) {
          carry -= step;
          // Distance from the first item to its duplicate = one full loop.
          const first = el.children[0] as HTMLElement | undefined;
          const dup   = el.children[items.length] as HTMLElement | undefined;
          const period = first && dup ? dup.offsetLeft - first.offsetLeft : el.scrollWidth / 2;
          const next = el.scrollLeft + step;
          el.scrollLeft = next >= period ? next - period : next;
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [loop, speed, items.length]);

  useEffect(() => () => clearTimeout(resumeTimer.current), []);

  const pause  = () => { clearTimeout(resumeTimer.current); paused.current = true; };
  const resume = (delay = 0) => {
    clearTimeout(resumeTimer.current);
    resumeTimer.current = setTimeout(() => { paused.current = false; }, delay);
  };

  const rendered = loop ? [...items, ...items] : items;

  return (
    <div
      ref={ref}
      className={`flex gap-4 overflow-x-auto pb-3 -mx-4 px-4 [scrollbar-width:thin] ${className}`}
      onMouseEnter={pause}
      onMouseLeave={() => resume()}
      onTouchStart={pause}
      onTouchEnd={() => resume(2500)}
      onFocus={pause}
      onBlur={() => resume()}
    >
      {rendered.map((item, i) => (
        <div
          key={`${getKey(item)}-${i < items.length ? 'a' : 'b'}`}
          className="shrink-0"
          // The duplicate half is decorative — hide it from assistive tech.
          aria-hidden={i >= items.length || undefined}
          // inert isn't in @types/react 18 yet; React 19 supports it as a boolean.
          {...((i >= items.length ? { inert: true } : {}) as Record<string, unknown>)}
        >
          {renderItem(item, i % items.length)}
        </div>
      ))}
    </div>
  );
}

export default AutoScrollRow;
