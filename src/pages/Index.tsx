// GEODHA homepage — street-poster redesign (docs/ROADMAP.md §4a).
// Content discerned from the "Option 1A · Street Poster" mockups:
// real categories, honest early-stage stats, app marked as launched.

import { Link, useNavigate } from 'react-router-dom';
import {
  Camera, Map, Trash2, Flame, Truck, Recycle,
  BookOpen, HandHeart, LayoutDashboard, Database, Newspaper, ArrowUpRight,
} from 'lucide-react';
import heroImage from '@/assets/hero-image.jpg';
import StoreButtons from '@/components/StoreButtons';
import { useI18n } from '@/i18n';

// ── Honest early-stage stats ──────────────────────────────────────────────────
// TODO: wire statUsers to a real count (Firebase auth users / app installs)
// once available; update manually until then.
const STATS = { users: '100+', wards: '198', categories: '3' };

const Index = () => {
  const navigate = useNavigate();
  const { t } = useI18n();

  const tackleCards = [
    { title: t.home.cardDumpTitle,  body: t.home.cardDumpBody,  Icon: Trash2,  tile: 'bg-secondary',  card: 'bg-tint-yellow' },
    { title: t.home.cardBurnTitle,  body: t.home.cardBurnBody,  Icon: Flame,   tile: 'bg-primary',    card: 'bg-tint-green'  },
    { title: t.home.cardTruckTitle, body: t.home.cardTruckBody, Icon: Truck,   tile: 'bg-accent',     card: 'bg-tint-blue'   },
    { title: t.home.cardGuideTitle, body: t.home.cardGuideBody, Icon: Recycle, tile: 'bg-ink',        card: 'bg-paper', href: '/guide' },
  ];

  const go = (path: string) => { navigate(path); window.scrollTo(0, 0); };

  return (
    <div className="min-h-screen bg-background">

      {/* ── HERO — split: white copy | yellow striped photo panel ── */}
      <section className="bg-paper border-b-[3px] border-ink relative overflow-hidden">
        <div className="grid lg:grid-cols-2">
          {/* Left: copy */}
          <div className="relative px-5 sm:px-10 lg:pl-14 lg:pr-10 py-14 lg:py-20">
            {/* blue circle accent */}
            <div className="hidden lg:block absolute -top-16 right-[-90px] w-56 h-56 rounded-full bg-tint-blue pointer-events-none" />

            <p className="mono-label flex items-center gap-2 mb-6">
              <span className="inline-block w-2 h-2 rounded-full bg-ink" />
              {t.home.overline}
            </p>

            <h1 className="font-black tracking-[-0.035em] leading-[0.95] text-[52px] sm:text-[72px] lg:text-[80px]">
              {t.home.headline1}<br />
              <span className="text-primary">{t.home.headline2}</span><br />
              {t.home.headline3}
            </h1>

            <p className="mt-7 text-lg font-medium leading-relaxed max-w-md text-foreground/80">
              {t.home.heroBody}
            </p>

            <div className="mt-9 flex flex-col sm:flex-row gap-4 relative z-10">
              <button
                onClick={() => go('/report')}
                className="btn-poster inline-flex items-center justify-center gap-2.5 bg-primary text-primary-foreground text-base"
              >
                <Camera className="h-5 w-5" />
                {t.common.reportProblem}
              </button>
              <button
                onClick={() => go('/dashboard')}
                className="btn-poster inline-flex items-center justify-center gap-2.5 bg-paper text-foreground text-base"
              >
                <Map className="h-5 w-5" />
                {t.common.seeMap}
              </button>
            </div>
          </div>

          {/* Right: yellow striped panel + photo card */}
          <div className="bg-stripes-yellow border-t-[3px] lg:border-t-0 lg:border-l-[3px] border-ink flex items-center justify-center p-10 lg:p-14 min-h-[340px]">
            <div className="relative max-w-md w-full">
              <div
                className="bg-paper border-[3px] border-ink rounded-3xl overflow-hidden rotate-[2deg]"
                style={{ boxShadow: 'var(--shadow-offset-6)' }}
              >
                <img
                  src={heroImage}
                  alt="Citizen reporting a garbage issue on the GEODHA app"
                  className="w-full h-64 sm:h-80 object-cover"
                  loading="eager"
                />
              </div>
              {/* floating status chip */}
              <div
                className="absolute -bottom-4 left-6 bg-paper border-2 border-ink rounded-full px-4 py-2 flex items-center gap-2 rotate-[-1deg]"
                style={{ boxShadow: 'var(--shadow-offset-3)' }}
              >
                <span className="w-2.5 h-2.5 rounded-full bg-primary border border-ink" />
                <span className="font-mono text-xs font-bold uppercase tracking-[0.08em]">{t.home.heroChip}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS BAND — ink, huge numbers ── */}
      <section className="bg-ink text-white border-b-[3px] border-ink">
        <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-white/20">
          {[
            { value: STATS.users,      label: t.home.statUsers,      color: 'text-secondary' },
            { value: STATS.wards,      label: t.home.statWards,      color: 'text-primary'   },
            { value: STATS.categories, label: t.home.statCategories, color: 'text-accent'    },
          ].map((s) => (
            <div key={s.label} className="px-8 py-8">
              <div className="text-5xl sm:text-6xl font-black tracking-tight">{s.value}</div>
              <div className={`font-mono text-xs font-bold uppercase tracking-[0.1em] mt-2 ${s.color}`}>
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── WHAT WE TACKLE ── */}
      <section className="py-16 sm:py-20">
        <div className="container px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10">
            <h2 className="text-4xl sm:text-5xl font-black tracking-[-0.03em] leading-[1.02] max-w-md">
              {t.home.tackleTitle}
            </h2>
            <p className="mono-label sm:text-right shrink-0">{t.home.tackleCaption}</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {tackleCards.map(({ title, body, Icon, tile, card, href }) => {
              const inner = (
                <div
                  className={`${card} border-[3px] border-ink rounded-2xl p-6 h-full transition-transform hover:-translate-y-1`}
                  style={{ boxShadow: 'var(--shadow-offset-4)' }}
                >
                  <div className={`${tile} w-14 h-14 rounded-xl border-[3px] border-ink flex items-center justify-center mb-5`}>
                    <Icon className={`h-7 w-7 ${tile === 'bg-secondary' ? 'text-ink' : 'text-white'}`} />
                  </div>
                  <h3 className="text-xl font-extrabold mb-1.5">{title}</h3>
                  <p className="text-sm font-medium text-foreground/70 leading-relaxed">{body}</p>
                </div>
              );
              return href ? (
                <Link key={title} to={href} onClick={() => window.scrollTo(0, 0)} className="block">
                  {inner}
                </Link>
              ) : (
                <div key={title}>{inner}</div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── APP SECTION — blueprint blue, app is LIVE ── */}
      <section className="bg-blueprint text-white border-y-[3px] border-ink py-16 sm:py-20">
        <div className="container px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Copy + store buttons */}
            <div className="space-y-6">
              <span
                className="inline-block bg-secondary text-secondary-foreground border-[2.5px] border-ink rounded-full px-4 py-1.5 font-mono text-xs font-bold uppercase tracking-[0.08em]"
                style={{ boxShadow: 'var(--shadow-offset-3)' }}
              >
                {t.common.nowAvailable}
              </span>
              <h2 className="text-4xl sm:text-6xl font-black tracking-[-0.03em] leading-[0.98] max-w-md">
                {t.home.appTitle}
              </h2>
              <p className="text-lg font-medium text-white/85 leading-relaxed max-w-md">
                {t.home.appBody}
              </p>
              <StoreButtons placement="home_app_section" />
            </div>

            {/* CSS phone mockup — live map vignette */}
            <div className="flex justify-center">
              <div
                className="relative w-64 bg-paper border-[3px] border-ink rounded-[2.4rem] p-3 rotate-[2deg]"
                style={{ boxShadow: 'var(--shadow-offset-6)' }}
              >
                {/* notch */}
                <div className="absolute top-3 left-1/2 -translate-x-1/2 w-24 h-4 bg-ink rounded-b-xl z-10" />
                {/* screen */}
                <div className="bg-tint-blue border-2 border-ink rounded-[1.8rem] overflow-hidden">
                  <div className="flex items-center justify-between px-4 pt-6 pb-2">
                    <span className="font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-ink">
                      {t.home.phoneLiveMap}
                    </span>
                    <span className="bg-paper border-2 border-ink rounded-full px-2 py-0.5 font-mono text-[9px] font-bold text-ink">
                      WARD 112
                    </span>
                  </div>
                  {/* map area with pins */}
                  <div
                    className="relative h-56 mx-3 mb-3 bg-paper border-2 border-ink rounded-xl"
                    style={{
                      backgroundImage:
                        'linear-gradient(rgba(44,123,229,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(44,123,229,0.12) 1px, transparent 1px)',
                      backgroundSize: '22px 22px',
                    }}
                  >
                    {[
                      { top: '18%', left: '22%', bg: 'bg-destructive' },
                      { top: '42%', left: '55%', bg: 'bg-secondary'   },
                      { top: '62%', left: '30%', bg: 'bg-primary'     },
                      { top: '30%', left: '74%', bg: 'bg-destructive' },
                    ].map((p, i) => (
                      <span
                        key={i}
                        className={`absolute w-5 h-6 ${p.bg} border-2 border-ink`}
                        style={{ top: p.top, left: p.left, borderRadius: '50% 50% 50% 4px', transform: 'rotate(-45deg)' }}
                      />
                    ))}
                  </div>
                  {/* bottom report row */}
                  <div className="mx-3 mb-4 bg-paper border-2 border-ink rounded-xl px-3 py-2.5 flex items-center gap-2.5">
                    <span className="w-8 h-8 bg-tint-red border-2 border-ink rounded-lg flex items-center justify-center shrink-0">
                      <Trash2 className="h-4 w-4 text-ink" />
                    </span>
                    <span className="text-[11px] font-bold leading-tight text-ink">{t.home.phoneReported}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SPLIT: GET STARTED | EXPLORE THE DATA ── */}
      <section className="grid lg:grid-cols-2 border-b-[3px] border-ink">
        {/* For citizens */}
        <div className="bg-paper px-5 sm:px-10 lg:pl-14 py-14 lg:border-r-[3px] border-ink">
          <p className="mono-label text-primary mb-2">{t.home.getStartedKicker}</p>
          <h2 className="text-3xl sm:text-4xl font-black tracking-[-0.02em] mb-8">{t.home.getStartedTitle}</h2>
          <div className="space-y-4 max-w-lg">
            {[
              { title: t.home.guides,       sub: t.home.guidesSub,    Icon: BookOpen,  tile: 'bg-secondary', href: '/guide' },
              { title: t.home.volunteerRow, sub: t.home.volunteerSub, Icon: HandHeart, tile: 'bg-primary',   href: '/volunteer' },
            ].map(({ title, sub, Icon, tile, href }) => (
              <Link
                key={href}
                to={href}
                onClick={() => window.scrollTo(0, 0)}
                className="flex items-center gap-4 bg-paper border-[3px] border-ink rounded-2xl px-5 py-4 transition-transform hover:-translate-y-0.5"
                style={{ boxShadow: 'var(--shadow-offset-4)' }}
              >
                <span className={`${tile} w-11 h-11 rounded-xl border-[2.5px] border-ink flex items-center justify-center shrink-0`}>
                  <Icon className={`h-5 w-5 ${tile === 'bg-secondary' ? 'text-ink' : 'text-white'}`} />
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block font-extrabold">{title}</span>
                  <span className="block text-sm font-medium text-foreground/60">{sub}</span>
                </span>
                <ArrowUpRight className="h-5 w-5 shrink-0" />
              </Link>
            ))}
          </div>
        </div>

        {/* For everyone */}
        <div className="bg-tint-yellow px-5 sm:px-10 lg:pr-14 py-14 border-t-[3px] lg:border-t-0 border-ink">
          <p className="mono-label text-accent mb-2">{t.home.exploreKicker}</p>
          <h2 className="text-3xl sm:text-4xl font-black tracking-[-0.02em] mb-8">{t.home.exploreTitle}</h2>
          <div className="grid sm:grid-cols-2 gap-4 max-w-lg">
            {[
              { title: t.home.dashboardRow, sub: t.home.dashboardSub, Icon: LayoutDashboard, href: '/dashboard' },
              { title: t.home.openData,     sub: t.home.openDataSub,  Icon: Database,        href: '/data' },
              { title: t.home.blogRow,      sub: t.home.blogSub,      Icon: Newspaper,       href: '/blog', wide: true },
            ].map(({ title, sub, Icon, href, wide }) => (
              <Link
                key={href}
                to={href}
                onClick={() => window.scrollTo(0, 0)}
                className={`bg-paper border-[3px] border-ink rounded-2xl px-5 py-4 flex items-center gap-4 transition-transform hover:-translate-y-0.5 ${wide ? 'sm:col-span-2' : ''}`}
                style={{ boxShadow: 'var(--shadow-offset-4)' }}
              >
                <span className="w-11 h-11 rounded-xl border-[2.5px] border-ink bg-tint-blue flex items-center justify-center shrink-0">
                  <Icon className="h-5 w-5 text-ink" />
                </span>
                <span className="min-w-0">
                  <span className="block font-extrabold">{title}</span>
                  <span className="block text-sm font-medium text-foreground/60">{sub}</span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── GREEN CTA BAND ── */}
      <section className="bg-primary text-white py-16 sm:py-20 text-center px-4">
        <h2 className="text-4xl sm:text-6xl font-black tracking-[-0.03em]">{t.home.ctaTitle}</h2>
        <p className="mt-4 text-lg font-medium text-white/85">{t.home.ctaSub}</p>
        <button
          onClick={() => go('/report')}
          className="btn-poster mt-9 inline-flex items-center gap-2.5 bg-secondary text-secondary-foreground text-base"
        >
          <Camera className="h-5 w-5" />
          {t.home.ctaButton}
        </button>
      </section>
    </div>
  );
};

export default Index;
