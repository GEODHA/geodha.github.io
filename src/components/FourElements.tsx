// FourElements v3 — single toggle (About page).
// One switch flips ALL four element cards between "Today" (reality) and
// "What it should be" (ideal) with a crossfade. Replaces the per-card drag.

import { useState } from 'react';
import { Flame, Mountain, Droplets, Wind } from 'lucide-react';

// Ideal ("what they should look like") — image set 2
import ideal1 from '@/assets/image5.jpg';
import ideal2 from '@/assets/image6.jpg';
import ideal3 from '@/assets/image7.jpg';
import ideal4 from '@/assets/image8.jpg';
// Reality ("what they actually look like") — image set 3
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

const FourElements = () => {
  // false = reality ("Today"), true = ideal ("What it should be")
  const [restored, setRestored] = useState(false);

  return (
    <section className="py-10 bg-background border-y-[3px] border-ink">
      <div className="container px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 mb-6">
          <h2 className="text-3xl sm:text-4xl font-black tracking-[-0.03em] leading-[1.02]">
            Four elements. <span className="text-primary">One city to restore.</span>
          </h2>
          <span className="mono-label">Flip the switch below</span>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {ELEMENTS.map(({ label, Icon, ideal, real, tile }) => (
            <div
              key={label}
              className="bg-paper border-[3px] border-ink rounded-2xl overflow-hidden"
              style={{ boxShadow: 'var(--shadow-offset-4)' }}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-3 sm:px-4 py-2.5 border-b-[2.5px] border-ink">
                <span className="flex items-center gap-2">
                  <span className={`${tile} w-7 h-7 rounded-lg border-2 border-ink flex items-center justify-center`}>
                    <Icon className={`h-4 w-4 ${tile === 'bg-secondary' ? 'text-ink' : 'text-white'}`} />
                  </span>
                  <span className="font-extrabold text-sm sm:text-base">{label}</span>
                </span>
                <span
                  className={`hidden sm:inline-block w-2.5 h-2.5 rounded-full border border-ink transition-colors ${
                    restored ? 'bg-primary' : 'bg-destructive'
                  }`}
                />
              </div>

              {/* Crossfading images */}
              <div className="relative aspect-square">
                <img src={real} alt={`${label} — today`} className="absolute inset-0 w-full h-full object-cover" loading="lazy" draggable={false} />
                <img
                  src={ideal}
                  alt={`${label} — how it should be`}
                  className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${restored ? 'opacity-100' : 'opacity-0'}`}
                  loading="lazy"
                  draggable={false}
                />
              </div>
            </div>
          ))}
        </div>

        {/* The toggle — big and clear */}
        <div className="mt-8 flex flex-col items-center gap-4">
          <button
            role="switch"
            aria-checked={restored}
            onClick={() => setRestored((r) => !r)}
            className="flex items-center gap-4 bg-paper border-[3px] border-ink rounded-full p-2 pr-7 cursor-pointer select-none transition-transform active:translate-x-[2px] active:translate-y-[2px]"
            style={{ boxShadow: 'var(--shadow-offset-6)' }}
          >
            <span className={`relative flex items-center border-[2.5px] border-ink rounded-full w-24 h-12 transition-colors ${restored ? 'bg-tint-green' : 'bg-tint-red'}`}>
              <span
                className={`absolute top-1 w-9 h-9 rounded-full border-[2.5px] border-ink transition-all duration-300 ${
                  restored ? 'left-[calc(100%-2.5rem)] bg-primary' : 'left-1 bg-destructive'
                }`}
              />
            </span>
            <span className="text-lg sm:text-xl font-black whitespace-nowrap">
              {restored ? 'What it should be' : 'Today'}
            </span>
          </button>
          <p className="text-sm font-medium text-foreground/60 max-w-md text-center">
            The gap between the two is what GEODHA exists to close — one report,
            one ward at a time.
          </p>
        </div>
      </div>
    </section>
  );
};

export default FourElements;
