// FourElements v2 — "Drag to restore" (street-poster redesign, 2026-07).
// Each element is a poster card showing REALITY (photo set 3). Dragging the
// divider wipes in the IDEAL (photo set 2) — the city we're owed. The status
// pill flips red→green as you cross halfway. Replaces the old 3-step slideshow.
// TODO(i18n): route strings through src/i18n once the About page is translated.

import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Camera, Flame, Mountain, Droplets, Wind } from 'lucide-react';

// Ideal ("what they should look like") — old imageSet2
import ideal1 from '@/assets/image5.jpg';
import ideal2 from '@/assets/image6.jpg';
import ideal3 from '@/assets/image7.jpg';
import ideal4 from '@/assets/image8.jpg';
// Reality ("what they actually look like") — old imageSet3
import real1 from '@/assets/image9.jpg';
import real2 from '@/assets/image10.jpg';
import real3 from '@/assets/image11.jpg';
import real4 from '@/assets/image12.jpg';

const ELEMENTS = [
  { label: 'Fire',  Icon: Flame,    ideal: ideal1, real: real1, tile: 'bg-destructive' },
  { label: 'Earth', Icon: Mountain, ideal: ideal2, real: real2, tile: 'bg-secondary'   },
  { label: 'Water', Icon: Droplets, ideal: ideal3, real: real3, tile: 'bg-accent'      },
  { label: 'Air',   Icon: Wind,     ideal: ideal4, real: real4, tile: 'bg-primary'     },
];

function RevealCard({ label, Icon, ideal, real, tile }: (typeof ELEMENTS)[number]) {
  const [pct, setPct] = useState(14); // % of ideal revealed
  const dragging = useRef(false);
  const areaRef = useRef<HTMLDivElement>(null);

  const setFromClientX = (clientX: number) => {
    const rect = areaRef.current?.getBoundingClientRect();
    if (!rect) return;
    const p = ((clientX - rect.left) / rect.width) * 100;
    setPct(Math.min(100, Math.max(0, p)));
  };

  const restored = pct >= 50;

  return (
    <div
      className="bg-paper border-[3px] border-ink rounded-2xl overflow-hidden select-none"
      style={{ boxShadow: 'var(--shadow-offset-4)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b-[2.5px] border-ink">
        <span className="flex items-center gap-2.5">
          <span className={`${tile} w-8 h-8 rounded-lg border-2 border-ink flex items-center justify-center`}>
            <Icon className={`h-4 w-4 ${tile === 'bg-secondary' ? 'text-ink' : 'text-white'}`} />
          </span>
          <span className="font-extrabold">{label}</span>
        </span>
        <span
          className={`border-2 border-ink rounded-full px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-[0.06em] flex items-center gap-1.5 transition-colors ${
            restored ? 'bg-tint-green' : 'bg-tint-red'
          }`}
        >
          <span className={`w-2 h-2 rounded-full border border-ink ${restored ? 'bg-primary' : 'bg-destructive'}`} />
          {restored ? 'What it should be' : 'Today'}
        </span>
      </div>

      {/* Reveal area */}
      <div
        ref={areaRef}
        className="relative aspect-square cursor-ew-resize touch-none"
        onPointerDown={(e) => { dragging.current = true; setFromClientX(e.clientX); e.currentTarget.setPointerCapture(e.pointerId); }}
        onPointerMove={(e) => { if (dragging.current) setFromClientX(e.clientX); }}
        onPointerUp={() => { dragging.current = false; }}
        aria-label={`${label}: drag to compare today with how it should be`}
        role="slider"
        aria-valuenow={Math.round(pct)}
        aria-valuemin={0}
        aria-valuemax={100}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'ArrowRight') setPct((p) => Math.min(100, p + 10));
          if (e.key === 'ArrowLeft')  setPct((p) => Math.max(0, p - 10));
        }}
      >
        {/* Reality (base) */}
        <img src={real} alt={`${label} — today`} className="absolute inset-0 w-full h-full object-cover" loading="lazy" draggable={false} />
        {/* Ideal (clipped overlay) */}
        <img
          src={ideal}
          alt={`${label} — how it should be`}
          className="absolute inset-0 w-full h-full object-cover"
          style={{ clipPath: `inset(0 ${100 - pct}% 0 0)` }}
          loading="lazy"
          draggable={false}
        />
        {/* Divider + handle */}
        <div className="absolute top-0 bottom-0 w-[3px] bg-ink" style={{ left: `${pct}%` }} />
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 bg-secondary border-[2.5px] border-ink rounded-full w-9 h-9 flex items-center justify-center pointer-events-none"
          style={{ left: `${pct}%`, boxShadow: 'var(--shadow-offset-3)' }}
        >
          <span className="font-black text-ink text-xs tracking-tighter">⇄</span>
        </div>
      </div>
    </div>
  );
}

const FourElements = () => {
  return (
    <section className="py-20 bg-background border-y-[3px] border-ink">
      <div className="container px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10">
          <h2 className="text-4xl sm:text-5xl font-black tracking-[-0.03em] leading-[1.02]">
            Four elements.<br />
            <span className="text-primary">One city to restore.</span>
          </h2>
          <p className="mono-label sm:text-right shrink-0">Drag each card → see the city we're owed</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {ELEMENTS.map((el) => (
            <RevealCard key={el.label} {...el} />
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-lg font-medium text-foreground/70 max-w-2xl mx-auto">
            The gap between the two pictures is exactly what GEODHA exists to close —
            one report, one ward at a time.
          </p>
          <Link
            to="/report"
            onClick={() => window.scrollTo(0, 0)}
            className="btn-poster mt-7 inline-flex items-center gap-2.5 bg-primary text-primary-foreground text-base"
          >
            <Camera className="h-5 w-5" />
            Help close the gap
          </Link>
        </div>
      </div>
    </section>
  );
};

export default FourElements;
