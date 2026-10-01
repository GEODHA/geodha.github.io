// Small UI pieces shared by the dashboard map sheets and the
// Neighbourhood Scorecard.

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { BAND } from '@/lib/severity';
import type { BandLevel } from '@/lib/severity';
import type { ProblemCategory } from '@/services/geodhaService';

// ── Sub-components ────────────────────────────────────────────────────────────

export function GarbageMoundIcon({ size = 20 }: { size?: number }) {
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

export function ProblemIcon({ category, size }: { category: ProblemCategory; size?: number }) {
  if (category === 'garbage_dump') return <GarbageMoundIcon size={size ?? 22} />;
  const emoji = category === 'burning_of_garbage' ? '🔥' : '🚛';
  return <span style={{ fontSize: size ? `${size}px` : '1.375rem', lineHeight: 1 }}>{emoji}</span>;
}

export function BandBadge({ band, size = 'sm' }: { band: BandLevel; size?: 'sm' | 'lg' }) {
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

export function ImageLightbox({ images, initialIndex, onClose }: {
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

