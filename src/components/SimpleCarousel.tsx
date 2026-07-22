// Minimal dependency-free carousel: auto-advance, arrows, dots.
// Used on the landing page for problem photos and app screenshots.

import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface CarouselSlide {
  src: string;
  /** Optional per-slide caption (kept minimal on the landing page). */
  caption?: string;
  alt?: string;
}

interface Props {
  slides: CarouselSlide[];
  /** Tailwind aspect class, e.g. 'aspect-[4/3]' or 'aspect-[9/16]'. */
  aspect?: string;
  /** 'cover' for photos, 'contain' for app screenshots. */
  fit?: 'cover' | 'contain';
  /** Auto-advance interval ms; 0 disables. */
  intervalMs?: number;
  className?: string;
}

const SimpleCarousel = ({ slides, aspect = 'aspect-[4/3]', fit = 'cover', intervalMs = 4000, className = '' }: Props) => {
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const n = slides.length;

  useEffect(() => {
    if (n < 2 || intervalMs === 0 || paused) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % n), intervalMs);
    return () => clearInterval(t);
  }, [n, intervalMs, paused]);

  if (n === 0) {
    return (
      <div className={`${aspect} ${className} border-[3px] border-dashed border-ink/40 rounded-2xl flex items-center justify-center bg-muted`}>
        <p className="mono-label text-center px-6">Images coming soon</p>
      </div>
    );
  }

  const slide = slides[idx];

  return (
    <div
      className={`relative ${className}`}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className={`relative ${aspect} border-[3px] border-ink rounded-2xl overflow-hidden bg-paper`} style={{ boxShadow: 'var(--shadow-offset-4)' }}>
        {/* Render all slides stacked for crossfade + preloading */}
        {slides.map((s, i) => (
          <img
            key={s.src}
            src={s.src}
            alt={s.alt ?? s.caption ?? `Slide ${i + 1}`}
            draggable={false}
            className={`absolute inset-0 w-full h-full transition-opacity duration-500 ${fit === 'cover' ? 'object-cover' : 'object-contain'} ${i === idx ? 'opacity-100' : 'opacity-0'}`}
            loading={i === 0 ? 'eager' : 'lazy'}
          />
        ))}

        {/* Per-slide caption chip */}
        {slide.caption && (
          <span
            className="absolute bottom-3 left-3 right-3 sm:right-auto bg-paper border-2 border-ink rounded-full px-3.5 py-1.5 font-mono text-[11px] font-bold uppercase tracking-[0.06em] text-ink"
            style={{ boxShadow: 'var(--shadow-offset-3)' }}
          >
            {slide.caption}
          </span>
        )}
      </div>

      {n > 1 && (
        <>
          {/* Arrows */}
          <button
            onClick={() => setIdx((i) => (i - 1 + n) % n)}
            aria-label="Previous"
            className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 bg-paper border-2 border-ink rounded-full flex items-center justify-center hover:bg-secondary transition-colors"
            style={{ boxShadow: 'var(--shadow-offset-3)' }}
          >
            <ChevronLeft className="h-4 w-4 text-ink" />
          </button>
          <button
            onClick={() => setIdx((i) => (i + 1) % n)}
            aria-label="Next"
            className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 bg-paper border-2 border-ink rounded-full flex items-center justify-center hover:bg-secondary transition-colors"
            style={{ boxShadow: 'var(--shadow-offset-3)' }}
          >
            <ChevronRight className="h-4 w-4 text-ink" />
          </button>

          {/* Dots */}
          <div className="absolute -bottom-5 left-0 right-0 flex justify-center gap-1.5">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => setIdx(i)}
                aria-label={`Go to slide ${i + 1}`}
                className={`w-2.5 h-2.5 rounded-full border-2 border-ink transition-colors ${i === idx ? 'bg-ink' : 'bg-paper'}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default SimpleCarousel;
