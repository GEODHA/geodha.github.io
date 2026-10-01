import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Shuffle, ArrowRight } from 'lucide-react';
import type { TestimonialDoc } from '@/services/geodhaService';
import { formatMonthYear, renderWithLinks } from '@/components/dashboard/format';

function shuffled<T>(items: T[]): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

type Tone = 'all' | 'problems' | 'wins';
const AUTO_ADVANCE_MS = 6000;

/**
 * "Voices from the wards" — every citizen testimonial in a random order,
 * as a horizontally scrolling strip that gently auto-advances. Tapping a
 * card opens that ward's scorecard.
 */
export default function TestimonialsFeed({ testimonials, onSelectWard }: {
  testimonials: TestimonialDoc[];
  onSelectWard: (wardNum: number) => void;
}) {
  const [seed, setSeed]   = useState(0);
  const [tone, setTone]   = useState<Tone>('all');
  const [paused, setPaused] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);

  const items = useMemo(() => {
    const list = testimonials.filter((t) =>
      tone === 'all' ? true : tone === 'wins' ? t.is_positive : !t.is_positive);
    return shuffled(list);
    // `seed` re-shuffles on demand.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [testimonials, tone, seed]);

  const scrollByCard = (dir: 1 | -1) => {
    const el = trackRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>('[data-card]');
    const step = (card?.offsetWidth ?? 300) + 16;
    const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 8;
    if (dir === 1 && atEnd) el.scrollTo({ left: 0, behavior: 'smooth' });
    else el.scrollBy({ left: dir * step, behavior: 'smooth' });
  };

  useEffect(() => {
    trackRef.current?.scrollTo({ left: 0 });
  }, [items]);

  useEffect(() => {
    if (paused || items.length < 2) return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    const id = window.setInterval(() => scrollByCard(1), AUTO_ADVANCE_MS);
    return () => window.clearInterval(id);
  }, [paused, items]);

  if (testimonials.length === 0) return null;

  const toneBtn = (t: Tone, label: string) => (
    <button
      onClick={() => setTone(t)}
      className={`text-xs font-bold rounded-full px-3 py-1 border-2 transition-colors ${
        tone === t ? 'bg-ink text-white border-ink' : 'bg-paper border-ink/25 hover:border-ink'
      }`}
    >
      {label}
    </button>
  );

  return (
    <section aria-label="Citizen testimonials">
      <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
        <div>
          <p className="mono-label mb-1">Voices from the wards</p>
          <h2 className="text-2xl sm:text-3xl font-black tracking-[-0.02em]">What residents are saying</h2>
        </div>
        <div className="flex items-center gap-1.5">
          {toneBtn('all', 'All')}
          {toneBtn('problems', 'Problems')}
          {toneBtn('wins', 'Success stories')}
          <button
            onClick={() => setSeed((s) => s + 1)}
            className="ml-1 p-2 rounded-full border-2 border-ink bg-paper hover:bg-tint-yellow"
            aria-label="Shuffle testimonials" title="Shuffle"
          >
            <Shuffle className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div
        className="relative"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onTouchStart={() => setPaused(true)}
        onFocusCapture={() => setPaused(true)}
        onBlurCapture={() => setPaused(false)}
      >
        <div
          ref={trackRef}
          className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-4 -mx-4 px-4 sm:mx-0 sm:px-0 scroll-smooth"
          style={{ scrollbarWidth: 'thin' }}
        >
          {items.map((t) => {
            const positive = t.is_positive ?? false;
            const thumb = t.thumb_images?.[0] ?? t.images?.[0];
            return (
              <article
                key={t.id}
                data-card
                className={`snap-start shrink-0 w-[82vw] sm:w-[340px] flex flex-col rounded-2xl border-[2.5px] border-ink overflow-hidden ${
                  positive ? 'bg-tint-green' : 'bg-tint-yellow'
                }`}
                style={{ boxShadow: 'var(--shadow-offset-3)' }}
              >
                {thumb && <img src={thumb} alt="" className="h-36 w-full object-cover border-b-[2.5px] border-ink" loading="lazy" />}
                <div className="p-4 flex flex-col gap-2 flex-1">
                  <span className={`self-start text-[10px] font-black uppercase tracking-wider rounded-full px-2 py-0.5 border-2 border-ink ${
                    positive ? 'bg-primary text-white' : 'bg-paper'
                  }`}>
                    {positive ? '✓ Success story' : '! Reported problem'}
                  </span>
                  <h3 className="font-extrabold leading-snug">{t.title}</h3>
                  <blockquote className="text-sm text-foreground/75 leading-relaxed line-clamp-5 italic">
                    “{renderWithLinks(t.quote)}”
                  </blockquote>
                  <p className="text-[11px] text-foreground/55 mt-auto pt-1">
                    {t.source}{t.locality ? ` · ${t.locality}` : ''}{t.date ? ` · ${formatMonthYear(t.date)}` : ''}
                  </p>
                  <button
                    onClick={() => onSelectWard(t.ward_num)}
                    className="self-start inline-flex items-center gap-1 text-xs font-extrabold underline underline-offset-2 hover:text-primary"
                  >
                    {t.ward_name || `Ward ${t.ward_num}`} scorecard <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </div>

      {items.length > 1 && (
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-foreground/50">
            {items.length} testimonials · shown in random order{paused ? ' · paused' : ''}
          </p>
          <div className="flex gap-1.5">
            <button onClick={() => scrollByCard(-1)} className="p-2 rounded-full border-2 border-ink bg-paper hover:bg-tint-yellow" aria-label="Previous">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button onClick={() => scrollByCard(1)} className="p-2 rounded-full border-2 border-ink bg-paper hover:bg-tint-yellow" aria-label="Next">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
