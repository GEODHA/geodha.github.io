import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Database, Code2, Megaphone, Building2, ArrowRight, Github, Mail, MessageCircle,
  Linkedin, Instagram, MessageSquare, Unlock, MapPin, ShieldCheck, HeartHandshake,
  Smartphone, Map as MapIcon, FileSpreadsheet,
} from 'lucide-react';
import FourElements from '@/components/FourElements';
import {
  CONTACT_EMAIL, WHATSAPP_COMMUNITY_URL, GITHUB_REPO_URL, INTEREST_FORM_URL,
} from '@/config/community';

const mailto = (subject: string, body = '') =>
  `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}${body ? `&body=${encodeURIComponent(body)}` : ''}`;

interface Track {
  id:      string;
  Icon:    typeof Database;
  tone:    string;
  iconBg:  string;
  kicker:  string;
  title:   string;
  who:     string;
  ideas:   string[];
  cta:     { label: string; href: string; external?: boolean };
  alt?:    { label: string; href: string; external?: boolean };
}

const TRACKS: Track[] = [
  {
    id: 'data',
    Icon: Database,
    tone: 'bg-tint-blue',
    iconBg: 'bg-accent',
    kicker: 'Track 01',
    title: 'Data',
    who: 'Researchers, journalists, students and civic-data folks.',
    ideas: [
      'Use our ward-level waste data in your research or reporting',
      'Share datasets we can map — grievances, waste infrastructure, contacts',
      'Help validate the old (198) ↔ new (369) ward matches',
      'Co-author analyses for the blog',
    ],
    cta: { label: 'Talk data with us', href: mailto('Data collaboration', 'Hi GEODHA team,\n\nI work on … and would like to …') },
    alt: { label: 'Explore the scorecard', href: '/dashboard?view=scorecard' },
  },
  {
    id: 'development',
    Icon: Code2,
    tone: 'bg-tint-green',
    iconBg: 'bg-primary',
    kicker: 'Track 02',
    title: 'Development',
    who: 'Developers, designers, GIS and accessibility folks.',
    ideas: [
      'Improve this website (React + Vite + Leaflet) — it\'s all on GitHub',
      'Maps, data pipelines and ward-boundary tooling',
      'Design, accessibility and Kannada translations',
      'Help on the GEODHA reporting app',
    ],
    cta: { label: 'Open the repo', href: GITHUB_REPO_URL, external: true },
    alt: { label: 'Browse open issues', href: `${GITHUB_REPO_URL}/issues`, external: true },
  },
  {
    id: 'community',
    Icon: Megaphone,
    tone: 'bg-tint-yellow',
    iconBg: 'bg-secondary',
    kicker: 'Track 03',
    title: 'Community & socials',
    who: 'Content creators, RWAs, ward champions, photographers.',
    ideas: [
      'Run or create for our Instagram, LinkedIn and Reddit',
      'Write a ward story or how-to for the blog',
      'Become a ward champion — onboard neighbours, verify reports',
      'Organise a ward walk or a reporting drive',
    ],
    cta: { label: 'Join the WhatsApp community', href: WHATSAPP_COMMUNITY_URL, external: true },
    alt: { label: 'Write for the blog', href: '/blog' },
  },
  {
    id: 'organisations',
    Icon: Building2,
    tone: 'bg-tint-red',
    iconBg: 'bg-destructive',
    kicker: 'Track 04',
    title: 'Organisations — build on GEODHA',
    who: 'NGOs, RWAs, CSR teams, research groups and government bodies.',
    ideas: [
      'Run a custom reporting module on our app and reach our users',
      'Examples: mosquito-breeding spots, footpath or streetlight audits, tree census, waterlogging',
      'Get a live map + dashboard for your campaign, by ward',
      'Keep the data open for your community and the city',
    ],
    cta: { label: 'Propose a module', href: mailto('Custom module partnership', 'Organisation:\nWhat we want to track:\nWhere (wards / area):\nTimeline:\n') },
    alt: { label: 'Express interest', href: INTEREST_FORM_URL, external: true },
  },
];

const MODULE_STEPS = [
  { n: '01', title: 'Talk',        body: 'Tell us what you want to track, where and why.' },
  { n: '02', title: 'Co-design',   body: 'We shape the report form, categories and who gets notified.' },
  { n: '03', title: 'Pilot',       body: 'Launch in a few wards with our users and your network.' },
  { n: '04', title: 'Open results', body: 'A public map and dashboard, plus the data — for you and the city.' },
];

const OFFER = [
  { Icon: Smartphone,      title: 'A live reporting app', body: 'Photo + GPS reports in 30 seconds, on Android and iOS.' },
  { Icon: MapIcon,         title: 'Maps & scorecards',    body: 'Ward-level dashboards on old and new ward boundaries.' },
  { Icon: FileSpreadsheet, title: 'Open data',            body: 'Aggregated, privacy-respecting datasets anyone can reuse.' },
];

const PRINCIPLES = [
  { Icon: Unlock,         title: 'Open by default', body: 'Our code is public and our aggregated data is meant to be reused. No copyright walls.' },
  { Icon: MapPin,         title: 'Ward-first',      body: 'Problems get solved locally, so everything we build starts from the ward.' },
  { Icon: ShieldCheck,    title: 'Privacy-respecting', body: 'We publish patterns, not people. Personal details are never part of open data.' },
  { Icon: HeartHandshake, title: 'Volunteer-run',   body: "GEODHA isn't a company (yet). It's people giving time — and we decide its future together." },
];

function CtaLink({ href, external, className, children }: {
  href: string; external?: boolean; className: string; children: React.ReactNode;
}) {
  if (href.startsWith('/')) return <Link to={href} className={className}>{children}</Link>;
  return (
    <a href={href} className={className} {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
      {children}
    </a>
  );
}

const About = () => {
  // Honour /about#collaborate links (the router's ScrollToTop resets scroll).
  const { hash } = useLocation();
  useEffect(() => {
    if (!hash) return;
    const t = setTimeout(() => document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'smooth' }), 50);
    return () => clearTimeout(t);
  }, [hash]);

  return (
    <div className="min-h-screen bg-background">

      {/* ── Hero ───────────────────────────────────────────────────────────── */}
      <section className="bg-paper border-b-[3px] border-ink py-12 sm:py-16">
        <div className="container px-4 sm:px-6 lg:px-8 max-w-5xl">
          <p className="mono-label mb-3">About · An open community project</p>
          <h1 className="text-4xl sm:text-6xl font-black tracking-[-0.035em] leading-[1.02] mb-5">
            Built in the open.<br />
            <span className="text-primary">Better with you.</span>
          </h1>
          <p className="text-lg sm:text-xl text-foreground/75 font-medium max-w-3xl leading-relaxed">
            GEODHA is a volunteer-run civic-tech project from Bengaluru. Residents report garbage problems with
            our app; we turn those reports into open maps and ward scorecards that communities and institutions
            can act on. Everything we make is meant to be reused, improved and built upon.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <a href="#collaborate" className="btn-poster inline-flex items-center gap-2 bg-secondary text-ink text-sm">
              Find your way in <ArrowRight className="h-4 w-4" />
            </a>
            <a href={GITHUB_REPO_URL} target="_blank" rel="noopener noreferrer" className="btn-poster inline-flex items-center gap-2 bg-paper text-sm">
              <Github className="h-4 w-4" /> See the code
            </a>
          </div>
        </div>
      </section>

      {/* ── What we've built ──────────────────────────────────────────────── */}
      <section className="py-12">
        <div className="container px-4 sm:px-6 lg:px-8 max-w-5xl">
          <div className="grid md:grid-cols-[1.2fr_1fr] gap-6 items-stretch">
            <div className="card-poster p-6 sm:p-8">
              <p className="mono-label mb-2">What exists today</p>
              <h2 className="text-2xl sm:text-3xl font-black tracking-[-0.02em] mb-5">A small stack you can plug into</h2>
              <div className="space-y-4">
                {OFFER.map(({ Icon, title, body }) => (
                  <div key={title} className="flex gap-3">
                    <span className="h-10 w-10 shrink-0 rounded-xl bg-primary border-[2.5px] border-ink flex items-center justify-center">
                      <Icon className="h-5 w-5 text-white" />
                    </span>
                    <div>
                      <p className="font-extrabold">{title}</p>
                      <p className="text-sm text-foreground/70">{body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-stripes-yellow border-[3px] border-ink rounded-2xl p-6 sm:p-8 flex flex-col" style={{ boxShadow: 'var(--shadow-offset-6)' }}>
              <p className="mono-label !text-ink/70 mb-2">Where we stand</p>
              <p className="text-xl font-black leading-snug mb-3">
                Not a company. Not a registered NGO — yet. Just people who want cleaner, more liveable neighbourhoods.
              </p>
              <p className="text-sm font-semibold text-ink/80 leading-relaxed">
                That means no copyright walls and no gatekeeping: if our data or code helps your work, use it.
                If you want to shape what GEODHA becomes, there's room at the table.
              </p>
              <Link to="/dashboard?view=scorecard" className="mt-auto pt-5 inline-flex items-center gap-1.5 font-extrabold underline underline-offset-4">
                Try the neighbourhood scorecard <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Ways to collaborate ───────────────────────────────────────────── */}
      <section id="collaborate" className="py-12 bg-muted/40 border-y-[3px] border-ink scroll-mt-20">
        <div className="container px-4 sm:px-6 lg:px-8 max-w-5xl">
          <p className="mono-label mb-2">Collaborate</p>
          <h2 className="text-3xl sm:text-4xl font-black tracking-[-0.03em] mb-2">Four ways in</h2>
          <p className="text-foreground/70 font-medium max-w-2xl mb-8">
            Pick whatever fits — an hour a month or a full partnership. Every track starts with a short conversation.
          </p>

          <div className="grid md:grid-cols-2 gap-6">
            {TRACKS.map((t) => (
              <article
                key={t.id}
                id={t.id}
                className={`${t.tone} border-[3px] border-ink rounded-2xl p-6 flex flex-col scroll-mt-20`}
                style={{ boxShadow: 'var(--shadow-offset-4)' }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <span className={`h-11 w-11 rounded-xl ${t.iconBg} border-[2.5px] border-ink flex items-center justify-center`}>
                    <t.Icon className={`h-5 w-5 ${t.iconBg === 'bg-secondary' ? 'text-ink' : 'text-white'}`} />
                  </span>
                  <div>
                    <p className="mono-label !text-[10px]">{t.kicker}</p>
                    <h3 className="text-xl font-black leading-tight">{t.title}</h3>
                  </div>
                </div>
                <p className="text-sm font-bold text-foreground/80 mb-3">{t.who}</p>
                <ul className="space-y-2 mb-5">
                  {t.ideas.map((idea) => (
                    <li key={idea} className="flex gap-2 text-sm text-foreground/75 leading-relaxed">
                      <span className="mt-2 h-1.5 w-1.5 rounded-full bg-ink shrink-0" />
                      {idea}
                    </li>
                  ))}
                </ul>
                <div className="mt-auto flex flex-wrap gap-2">
                  <CtaLink href={t.cta.href} external={t.cta.external}
                    className="inline-flex items-center gap-1.5 text-sm font-extrabold rounded-full px-4 py-2 border-[2.5px] border-ink bg-ink text-white hover:opacity-90">
                    {t.cta.label} <ArrowRight className="h-3.5 w-3.5" />
                  </CtaLink>
                  {t.alt && (
                    <CtaLink href={t.alt.href} external={t.alt.external}
                      className="inline-flex items-center gap-1.5 text-sm font-extrabold rounded-full px-4 py-2 border-[2.5px] border-ink bg-paper hover:bg-tint-yellow">
                      {t.alt.label}
                    </CtaLink>
                  )}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── Custom module flow ────────────────────────────────────────────── */}
      <section className="py-12">
        <div className="container px-4 sm:px-6 lg:px-8 max-w-5xl">
          <p className="mono-label mb-2">For organisations</p>
          <h2 className="text-3xl sm:text-4xl font-black tracking-[-0.03em] mb-2">How a custom module works</h2>
          <p className="text-foreground/70 font-medium max-w-2xl mb-8">
            Want residents to report something specific in your area? We can run it as a module inside the
            GEODHA app — no new app for people to install.
          </p>
          <ol className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {MODULE_STEPS.map((s) => (
              <li key={s.n} className="bg-paper border-[2.5px] border-ink rounded-2xl p-5">
                <span className="font-mono text-sm font-bold text-primary">{s.n}</span>
                <p className="text-lg font-black mt-1">{s.title}</p>
                <p className="text-sm text-foreground/70 mt-1 leading-relaxed">{s.body}</p>
              </li>
            ))}
          </ol>
          <div className="mt-6">
            <a href={mailto('Custom module partnership')} className="btn-poster inline-flex items-center gap-2 bg-primary text-primary-foreground text-sm">
              <Mail className="h-4 w-4" /> Start the conversation
            </a>
          </div>
        </div>
      </section>

      {/* ── Why: four elements ────────────────────────────────────────────── */}
      <FourElements />

      {/* ── Principles ────────────────────────────────────────────────────── */}
      <section className="py-12">
        <div className="container px-4 sm:px-6 lg:px-8 max-w-5xl">
          <p className="mono-label mb-2">How we work</p>
          <h2 className="text-3xl sm:text-4xl font-black tracking-[-0.03em] mb-8">Principles</h2>
          <div className="grid sm:grid-cols-2 gap-5">
            {PRINCIPLES.map(({ Icon, title, body }) => (
              <div key={title} className="flex gap-4">
                <span className="h-11 w-11 shrink-0 rounded-xl bg-paper border-[2.5px] border-ink flex items-center justify-center">
                  <Icon className="h-5 w-5" />
                </span>
                <div>
                  <p className="font-extrabold text-lg">{title}</p>
                  <p className="text-sm text-foreground/70 leading-relaxed">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Contact ───────────────────────────────────────────────────────── */}
      <section className="pb-14">
        <div className="container px-4 sm:px-6 lg:px-8 max-w-5xl">
          <div className="bg-ink text-white rounded-2xl p-7 sm:p-10 border-[3px] border-ink" style={{ boxShadow: '6px 6px 0 hsl(var(--primary))' }}>
            <h2 className="text-3xl sm:text-4xl font-black tracking-[-0.03em] mb-2">Say hello.</h2>
            <p className="text-white/75 font-medium max-w-xl mb-6">
              Not sure which track fits? Write to us anyway — or fill the short interest form and we'll reach out.
            </p>
            <div className="flex flex-wrap gap-3">
              <a href={`mailto:${CONTACT_EMAIL}`} className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 bg-secondary text-ink font-extrabold border-[2.5px] border-white/0">
                <Mail className="h-4 w-4" /> {CONTACT_EMAIL}
              </a>
              <a href={INTEREST_FORM_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 bg-white text-ink font-extrabold">
                Express interest
              </a>
              <a href={WHATSAPP_COMMUNITY_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 border-[2.5px] border-white font-extrabold">
                <MessageCircle className="h-4 w-4" /> WhatsApp
              </a>
            </div>
            <div className="mt-6 flex gap-2">
              {[
                { href: 'https://www.linkedin.com/company/geodha', label: 'LinkedIn', Icon: Linkedin },
                { href: 'https://www.instagram.com/geodha_org', label: 'Instagram', Icon: Instagram },
                { href: 'https://www.reddit.com/r/geodha', label: 'Reddit', Icon: MessageSquare },
                { href: GITHUB_REPO_URL, label: 'GitHub', Icon: Github },
              ].map(({ href, label, Icon }) => (
                <a key={label} href={href} target="_blank" rel="noopener noreferrer" aria-label={label}
                  className="p-2.5 rounded-xl border-2 border-white/30 hover:border-secondary hover:text-secondary transition-colors">
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;
