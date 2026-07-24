// GEODHA landing page — compact narrative sequence (mockup-informed):
// Announcement → Mission (animated globe) → marquee → The Problem (photo strip)
// → Our Solutions: 01 app (+stats right below) · 02 dashboard → Blog/Learn/
// Volunteer → Contribute.
// Fully wired to i18n — all copy comes from t.landing.* (see src/i18n/en.ts, kn.ts).

import { Link } from 'react-router-dom';
import {
  Mail, MessageCircle, Newspaper, Recycle, HandHeart, ArrowRight, Send, CheckCircle2,
} from 'lucide-react';

import SimpleCarousel from '@/components/SimpleCarousel';
import type { CarouselSlide } from '@/components/SimpleCarousel';
import DashboardPreview from '@/components/DashboardPreview';
import StoreButtons from '@/components/StoreButtons';
import { CONTACT_EMAIL, WHATSAPP_COMMUNITY_URL } from '@/config/community';
import { PLAY_STORE_URL, IOS_APP_URL } from '@/config/appLinks';
import { useI18n } from '@/i18n';
import type { Dict } from '@/i18n';

// ── App screenshots (swap/reorder freely; captions stay minimal) ─────────────
import shot1 from '@/assets/screenshot1.jpg';
import shot2 from '@/assets/screenshot2.jpg';
import shot3 from '@/assets/screenshot3.jpg';
import shot4 from '@/assets/screenshot4.jpg';

// ── Problem photos — drop real app photos into src/assets/problem/ ───────────
const problemModules = import.meta.glob('../assets/problem/*.{jpg,jpeg,png,webp}', {
  eager: true,
  import: 'default',
}) as Record<string, string>;
const PROBLEM_SLIDES: CarouselSlide[] = Object.keys(problemModules)
  .sort()
  .map((k) => ({ src: problemModules[k], alt: 'Reported garbage issue in Bengaluru' }));

// ── Thin infinite-scroll banner ──────────────────────────────────────────────
function MarqueeBanner({ t }: { t: Dict['landing'] }) {
  const words = (
    <span className="inline-block font-mono text-xs font-bold uppercase tracking-[0.14em] px-2">
      <span className="text-secondary px-4">{t.marquee1}</span>
      <span className="text-primary px-4">{t.marquee2}</span>
      <span className="text-accent px-4">{t.marquee3}</span>
    </span>
  );
  return (
    <div className="bg-ink py-2 overflow-hidden whitespace-nowrap border-y-[3px] border-ink" aria-hidden="true">
      <div className="inline-block animate-scroll">{words}{words}{words}{words}</div>
    </div>
  );
}

// ── Animated wireframe globe — GEO + ಧಾ/धरा (dharā, earth) ───────────────────
function HeroGlobe() {
  const stroke = '#cfcfca';
  return (
    <svg
      viewBox="0 0 400 400"
      aria-hidden="true"
      className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[420px] sm:w-[540px] max-w-none opacity-70 pointer-events-none"
    >
      <g fill="none" stroke={stroke} strokeWidth="1.5">
        <circle cx="200" cy="200" r="180" strokeWidth="2.5" />
        {/* meridians */}
        <ellipse cx="200" cy="200" rx="180" ry="180" />
        <ellipse cx="200" cy="200" rx="126" ry="180" />
        <ellipse cx="200" cy="200" rx="63"  ry="180" />
        <line x1="200" y1="20" x2="200" y2="380" />
        {/* parallels */}
        <ellipse cx="200" cy="200" rx="180" ry="126" />
        <ellipse cx="200" cy="200" rx="180" ry="63" />
        <line x1="20" y1="200" x2="380" y2="200" />
      </g>
    </svg>
  );
}

// ── Report thread — sample lifecycle of a submitted report ───────────────────
function ReportThread({ t }: { t: Dict['landing'] }) {
  const cardShadow = { boxShadow: 'var(--shadow-offset-3)' };
  return (
    <div className="mt-8 max-w-sm mx-auto flex flex-col gap-3">
      <div
        className="self-start bg-tint-blue border-[3px] border-ink rounded-2xl px-4 py-3 max-w-[88%]"
        style={cardShadow}
      >
        <p className="font-mono text-[10px] font-bold uppercase tracking-[0.1em] text-accent mb-1 flex items-center gap-1.5">
          <Send className="h-3 w-3" /> {t.threadSubmittedLabel}
        </p>
        <p className="text-sm font-bold text-foreground">{t.threadSubmittedBody}</p>
      </div>

      <div
        className="self-end bg-tint-green border-[3px] border-ink rounded-2xl px-4 py-3 max-w-[88%]"
        style={cardShadow}
      >
        <p className="font-mono text-[10px] font-bold uppercase tracking-[0.1em] text-primary mb-1 flex items-center gap-1.5">
          <CheckCircle2 className="h-3 w-3" /> {t.threadUpdateLabel}
        </p>
        <p className="text-sm font-semibold leading-snug">"{t.threadUpdate1Quote}"</p>
        <p className="text-[11px] font-medium text-foreground/50 mt-1">{t.threadRemarks}</p>
      </div>

      <div
        className="self-start bg-tint-yellow border-[3px] border-ink rounded-2xl px-4 py-3 max-w-[88%]"
        style={cardShadow}
      >
        <p className="font-mono text-[10px] font-bold uppercase tracking-[0.1em] text-secondary mb-1 flex items-center gap-1.5">
          <CheckCircle2 className="h-3 w-3" /> {t.threadUpdateLabel}
        </p>
        <p className="text-sm font-semibold leading-snug">"{t.threadUpdate2Quote}"</p>
        <p className="text-[11px] font-medium text-foreground/50 mt-1">{t.threadRemarks}</p>
      </div>

      <p className="mt-2 text-sm font-medium text-foreground/60 text-center leading-relaxed">
        {t.threadCaption}
      </p>
    </div>
  );
}

// ── Section head ─────────────────────────────────────────────────────────────
function SectionHead({ kicker, kickerColor = 'text-primary', title, caption }: {
  kicker?: string; kickerColor?: string; title: string; caption?: string;
}) {
  return (
    <div className="mb-7">
      {kicker && <p className={`mono-label ${kickerColor} mb-1.5`}>{kicker}</p>}
      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <h2 className="text-3xl sm:text-4xl font-black tracking-[-0.03em] leading-[1.02]">{title}</h2>
        {caption && <span className="mono-label">{caption}</span>}
      </div>
    </div>
  );
}

const Index = () => {
  const { t } = useI18n();
  const l = t.landing;

  // ── Honest early-stage stats — update as they grow ─────────────────────────
  const STATS = [
    { value: '150+', label: l.statUsers,       color: 'text-secondary' },
    { value: '100+', label: l.statReports,     color: 'text-primary' },
    { value: '~10',  label: l.statCaseStudies, color: 'text-accent' },
  ];

  const APP_SLIDES: { src: string; title: string; sub: string }[] = [
    { src: shot1, title: l.appSlide1Title, sub: l.appSlide1Sub },
    { src: shot2, title: l.appSlide2Title, sub: l.appSlide2Sub },
    { src: shot3, title: l.appSlide3Title, sub: l.appSlide3Sub },
    { src: shot4, title: l.appSlide4Title, sub: l.appSlide4Sub },
  ];

  return (
    <div className="min-h-screen bg-background">

      {/* ── APP ANNOUNCEMENT BANNER ── */}
      <div className="bg-secondary border-b-[3px] border-ink py-2 px-4 text-center">
        <p className="text-xs sm:text-sm font-bold text-ink">
          📱 {l.bannerAvailable}{' '}
          <a href={PLAY_STORE_URL} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 font-extrabold">{l.bannerGooglePlay}</a>
          {' '}·{' '}
          <a href={IOS_APP_URL} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 font-extrabold">{l.bannerAppStore}</a>
        </p>
      </div>

      {/* ── MISSION — with animated globe ── */}
      <section className="relative bg-paper border-b-[3px] border-ink py-14 sm:py-16 text-center px-4 overflow-hidden">
        <HeroGlobe />
        <div className="relative">
          <p className="font-mono text-base sm:text-lg font-bold uppercase tracking-[0.18em] text-muted-foreground mb-4">
            {l.missionKicker}
          </p>
          <h1 className="mx-auto max-w-4xl font-black tracking-[-0.035em] leading-[1.02] text-[38px] sm:text-[56px] lg:text-[64px]">
            {l.missionPart1} <span className="text-primary">{l.missionLiveable}</span> {l.missionPart2}{' '}
            <span className="text-accent">{l.missionSustainable}</span> {l.missionPart3}
          </h1>
        </div>
      </section>

      {/* ── MARQUEE ── */}
      <MarqueeBanner t={l} />

      {/* ── THE PROBLEM ── */}
      <section className="bg-tint-yellow py-10 sm:py-12 border-b-[3px] border-ink">
        <div className="container px-4 sm:px-6 lg:px-8">
          <SectionHead title={l.problemTitle} caption={l.problemCaption} />
          <div className="max-w-3xl mx-auto">
            <SimpleCarousel slides={PROBLEM_SLIDES} aspect="aspect-[16/10]" fit="cover" />
          </div>
          <p className="mono-label text-center mt-8">
            {l.problemCredit}
          </p>
        </div>
      </section>

      {/* ── SOLUTIONS 01 · REPORTING APP ── */}
      <section className="bg-paper py-10 sm:py-12">
        <div className="container px-4 sm:px-6 lg:px-8">
          <SectionHead kicker={l.solutions1Kicker} title={l.solutions1Title} />

          {/* Screenshot strip — phone cards with captions below */}
          <div className="flex gap-5 overflow-x-auto pb-3 snap-x">
            {APP_SLIDES.map(({ src, title, sub }) => (
              <div key={title} className="shrink-0 w-48 sm:w-56 snap-start">
                <div
                  className="bg-ink border-[3px] border-ink rounded-[1.6rem] p-1.5"
                  style={{ boxShadow: 'var(--shadow-offset-4)' }}
                >
                  <img
                    src={src}
                    alt={title}
                    className="w-full aspect-[1/2.055] object-cover rounded-[1.2rem] bg-paper"
                    loading="lazy"
                    draggable={false}
                  />
                </div>
                <p className="font-extrabold text-center mt-3 leading-tight">{title}</p>
                <p className="text-xs font-medium text-foreground/60 text-center mt-0.5">{sub}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 flex justify-center">
            <StoreButtons placement="landing_solutions" />
          </div>

          <ReportThread t={l} />
        </div>
      </section>

      {/* ── APP STATS — right below the app ── */}
      <section className="bg-ink text-white border-y-[3px] border-ink">
        <div className="grid grid-cols-3 divide-x divide-white/20">
          {STATS.map((s) => (
            <div key={s.label} className="px-3 sm:px-8 py-5 text-center">
              <div className="text-3xl sm:text-5xl font-black tracking-tight">{s.value}</div>
              <div className={`font-mono text-[10px] sm:text-xs font-bold uppercase tracking-[0.1em] mt-1.5 ${s.color}`}>
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── SOLUTIONS 02 · LIVE CITY DASHBOARD ── */}
      <section className="bg-tint-blue py-10 sm:py-12 border-b-[3px] border-ink">
        <div className="container px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-5 gap-8 items-center">
            <div className="lg:col-span-2">
              <p className="mono-label text-accent mb-1.5">{l.solutions2Kicker}</p>
              <h2 className="text-3xl sm:text-4xl font-black tracking-[-0.03em] leading-[1.05]">
                {l.solutions2Title}
              </h2>
              <p className="mt-3 text-foreground/70 font-medium leading-relaxed max-w-sm">
                {l.solutions2Body}
              </p>
            </div>
            <div className="lg:col-span-3">
              <DashboardPreview />
            </div>
          </div>
        </div>
      </section>

      {/* ── BLOG / LEARN / VOLUNTEER ── */}
      <section className="py-10 sm:py-12 border-b-[3px] border-ink">
        <div className="container px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-3 gap-5">
            {[
              {
                Icon: Newspaper, tile: 'bg-accent', card: 'bg-tint-blue', href: '/blog',
                title: l.blogTitle,
                body: l.blogBody,
              },
              {
                Icon: Recycle, tile: 'bg-primary', card: 'bg-tint-green', href: '/guide',
                title: l.segregateTitle,
                body: l.segregateBody,
              },
              {
                Icon: HandHeart, tile: 'bg-secondary', card: 'bg-tint-yellow', href: '/volunteer',
                title: l.volunteerTitle,
                body: l.volunteerBody,
              },
            ].map(({ Icon, tile, card, href, title, body }) => (
              <Link
                key={href}
                to={href}
                onClick={() => window.scrollTo(0, 0)}
                className={`${card} border-[3px] border-ink rounded-2xl p-5 transition-transform hover:-translate-y-1 flex items-start gap-4`}
                style={{ boxShadow: 'var(--shadow-offset-4)' }}
              >
                <span className={`${tile} w-11 h-11 rounded-xl border-[2.5px] border-ink flex items-center justify-center shrink-0`}>
                  <Icon className={`h-5 w-5 ${tile === 'bg-secondary' ? 'text-ink' : 'text-white'}`} />
                </span>
                <span className="min-w-0">
                  <span className="font-extrabold flex items-center gap-1.5">{title} <ArrowRight className="h-4 w-4" /></span>
                  <span className="block text-sm font-medium text-foreground/70 leading-snug mt-0.5">{body}</span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── CONTRIBUTE CTA ── */}
      <section className="bg-primary text-white py-12 sm:py-14 text-center px-4">
        <h2 className="text-3xl sm:text-5xl font-black tracking-[-0.03em]">{l.ctaTitle}</h2>
        <p className="mt-3 text-lg font-medium text-white/85 max-w-xl mx-auto">
          {l.ctaBody}
        </p>
        <div className="mt-7 flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="btn-poster inline-flex items-center justify-center gap-2.5 bg-secondary text-secondary-foreground text-base"
          >
            <Mail className="h-5 w-5" />
            {CONTACT_EMAIL}
          </a>
          {WHATSAPP_COMMUNITY_URL && (
            <a
              href={WHATSAPP_COMMUNITY_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-poster inline-flex items-center justify-center gap-2.5 bg-paper text-foreground text-base"
            >
              <MessageCircle className="h-5 w-5" />
              {l.ctaWhatsapp}
            </a>
          )}
        </div>
      </section>
    </div>
  );
};

export default Index;
