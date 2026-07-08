import { Link, useNavigate } from 'react-router-dom';
import { Flame, Bug, Truck, Wind, BarChart2, Database, FileText, Smartphone, CheckCircle, MapPin, Trash2 } from 'lucide-react';
import heroImage from '@/assets/hero-image.jpg';
import logoSquare from '@/assets/LOGO-SquareSVG.svg';
import ScrollingBanner from '@/components/ScrollingBanner';
import StoreButtons from '@/components/StoreButtons';

// Problem empathy cards — per-card colored icon boxes (matching UI_REFERENCE feature card style)
const problemCards = [
  {
    icon: Truck,
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    title: 'Garbage truck not arriving',
    description: 'Truck skips your street for days. Waste overflows.',
  },
  {
    icon: Bug,
    iconBg: 'bg-orange-100',
    iconColor: 'text-orange-600',
    title: 'Mosquito breeding near your home',
    description: 'Stagnant waste water turns into breeding grounds.',
  },
  {
    icon: Flame,
    iconBg: 'bg-purple-100',
    iconColor: 'text-purple-600',
    title: 'Open burning and smoke',
    description: 'Illegal burning chokes neighbourhoods. Children and elderly most at risk.',
  },
  {
    icon: Wind,
    iconBg: 'bg-teal-100',
    iconColor: 'text-teal-600',
    title: 'Foul smell from an illegal dump',
    description: 'Persistent stench from an unauthorised dumping site.',
  },
];

// Resources section
const resources = [
  {
    emoji: '♻️',
    title: 'Waste Segregation Guide',
    description: 'Which bin, what goes in, and the rules that matter. Practical guidance for every Bengaluru resident.',
    href: '/guide',
    available: true,
    cta: 'Read the guide →',
  },
  {
    emoji: '🤝',
    title: 'Volunteer for Cleanups',
    description: 'Check out which organisations are running local cleanups and how you can join in.',
    href: '/volunteer',
    available: true,
    cta: 'Get involved →',
  },
  {
    emoji: '🏗',
    title: 'BWG Disposal Guidelines',
    description: 'Mandatory compliance for apartments, hotels, and institutions that generate over 100 kg of waste per day.',
    href: '/guide2',
    available: false,
    cta: 'Coming Soon',
  },
  {
    emoji: '🌱',
    title: 'Waste to Value',
    description: 'Composting, biogas, and upcycling programmes open to residents, apartment complexes, and communities.',
    href: '/waste-to-value',
    available: false,
    cta: 'Coming Soon',
  },
];

// Services section
const services = [
  {
    icon: Smartphone,
    title: 'Reporting App',
    description: 'Powerful tools to arrange for cleanups and report in less than 30 seconds.',
    href: '/report',
    cta: 'Get the app →',
    launchingSoon: false,
  },
  {
    icon: BarChart2,
    title: 'Civic Dashboard',
    description: 'Ward-level heatmaps and report cards for Bengaluru wards.',
    href: '/dashboard',
    cta: 'View the dashboard →',
    launchingSoon: false,
  },
  {
    icon: Database,
    title: 'Data & Analytics',
    description: 'Open burning cross-referenced with vulnerable communities.',
    href: '/data',
    cta: 'Explore the data →',
    launchingSoon: false,
  },
  {
    icon: FileText,
    title: 'Blog & Guides',
    description: "Disposal guides, what to do when the truck doesn't come, and more.",
    href: '/blog',
    cta: 'Read the blog →',
    launchingSoon: false,
  },
];

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">

      {/* ── HERO — gradient-subtle bg + subtle grid pattern ── */}
      <section className="relative overflow-hidden bg-gradient-subtle">
        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              'repeating-linear-gradient(0deg, transparent, transparent 39px, rgba(0,0,0,0.04) 39px, rgba(0,0,0,0.04) 40px), repeating-linear-gradient(90deg, transparent, transparent 39px, rgba(0,0,0,0.04) 39px, rgba(0,0,0,0.04) 40px)',
          }}
        />

        <div className="relative container px-4 py-8 sm:py-10 lg:py-14 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-6 lg:gap-8 items-center">

            {/* Left: text */}
            <div className="space-y-6">
              <p className="flex items-center gap-1.5 text-primary font-semibold text-sm uppercase tracking-widest">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                Bengaluru
              </p>
              <h1
                className="text-5xl sm:text-6xl lg:text-7xl font-bold text-gray-900 leading-[1.05]"
                style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
              >
                See garbage around you?
                <br />
                <span className="bg-gradient-primary bg-clip-text text-transparent">
                  Solve it with GEODHA.
                </span>
              </h1>
              <p className="text-lg sm:text-xl text-gray-600 max-w-lg leading-relaxed">
                Real data on what's being reported, what's getting fixed, and what's being ignored.
              </p>

              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  onClick={() => { navigate('/dashboard'); window.scrollTo(0, 0); }}
                  className="px-6 py-3 bg-primary text-primary-foreground font-semibold rounded-md hover:bg-primary/90 transition-colors text-sm"
                >
                  View Civic Dashboard →
                </button>
              </div>

              {/* App store buttons — the reporting app is live */}
              <StoreButtons placement="hero" />
            </div>

            {/* Right: hero image + two floating badges (matching UI_REFERENCE) */}
            <div className="relative mt-6 lg:mt-0">
              <div className="absolute inset-0 bg-gradient-primary opacity-20 rounded-2xl" />
              <img
                src={heroImage}
                alt="Citizens reporting civic issues"
                className="relative rounded-2xl shadow-glow object-cover w-full h-[280px] sm:h-[380px] lg:h-[420px]"
              />

              {/* Bottom-left: "Issue Reported!" badge (red trash icon, UI_REFERENCE style) */}
              <div className="absolute -bottom-5 -left-4 sm:-bottom-6 sm:-left-6 bg-card p-4 rounded-xl shadow-soft border">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                    <Trash2 className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground font-medium">Issue Reported</div>
                    <div className="font-semibold text-foreground text-sm">Garbage Dump</div>
                  </div>
                </div>
              </div>

              {/* Top-right: "Status Update: Cleaned & Verified" badge (green check icon) */}
              <div className="absolute -top-4 -right-4 sm:-top-6 sm:-right-6 bg-card p-4 rounded-xl shadow-soft border">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground font-medium">Status Update</div>
                    <div className="font-semibold text-foreground text-sm">Cleaned &amp; Verified</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SCROLLING BANNER ── */}
      <ScrollingBanner />

      {/* ── PROBLEM EMPATHY — light shadow cards with colored icons ── */}
      <section className="py-16 sm:py-20 bg-background">
        <div className="container px-4 sm:px-6 lg:px-8">
          <div className="mb-10">
            <h2
              className="text-3xl sm:text-4xl font-bold text-foreground mb-3"
              style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
            >
              Are you facing any of these?
            </h2>
            <p className="text-muted-foreground max-w-xl">
              These are the most common solid waste problems reported by Bengaluru residents. If you're experiencing one, you're not alone.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
            {problemCards.map((card) => (
              <div
                key={card.title}
                className="group p-4 rounded-xl bg-muted/40 hover:bg-muted/60 border border-border hover:border-primary/20 shadow-sm hover:shadow-md transition-all duration-300 flex items-start gap-3"
              >
                <div className={`w-10 h-10 rounded-lg ${card.iconBg} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}>
                  <card.icon className={`h-5 w-5 ${card.iconColor}`} />
                </div>
                <div>
                  <h3
                    className="font-bold text-foreground mb-1"
                    style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '1rem' }}
                  >
                    {card.title}
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {card.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Single CTA */}
          <div className="flex justify-center">
            <Link
              to="/report"
              onClick={() => window.scrollTo(0, 0)}
              className="inline-block px-6 py-3.5 bg-primary text-primary-foreground font-semibold rounded-md hover:bg-primary/90 transition-colors text-sm text-center"
            >
              Tell us more about the problem you are facing and learn about real solutions →
            </Link>
          </div>
        </div>
      </section>

      {/* ── RESOURCES ── */}
      <section className="py-16 sm:py-20 bg-muted/40 border-t border-border">
        <div className="container px-4 sm:px-6 lg:px-8">
          <div className="mb-10">
            <h2
              className="text-3xl sm:text-4xl font-bold mb-3"
              style={{ fontFamily: "'Barlow Condensed', sans-serif", color: '#1A1A18' }}
            >
              Resources
            </h2>
            <p className="max-w-xl" style={{ color: '#5A5A56' }}>
              Guides and community programmes to help you act — whether you're a resident, an apartment complex, or a local volunteer.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {resources.map((res) => (
              <Link
                key={res.title}
                to={res.href}
                onClick={() => window.scrollTo(0, 0)}
                className={`group block p-5 rounded-xl border transition-all duration-200 ${
                  res.available
                    ? 'bg-white border-l-4 hover:shadow-md cursor-pointer'
                    : 'bg-white/60 border border-dashed cursor-default pointer-events-none'
                }`}
                style={res.available ? { borderLeftColor: '#2D6A4F', borderTopColor: '#E5E5E0', borderRightColor: '#E5E5E0', borderBottomColor: '#E5E5E0' } : { borderColor: '#D1D5DB' }}
              >
                <div className="text-[32px] mb-3 leading-none">{res.emoji}</div>
                <h3
                  className="font-bold mb-2"
                  style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '1.1rem', color: res.available ? '#1A1A18' : '#9CA3AF' }}
                >
                  {res.title}
                </h3>
                <p className="text-sm leading-relaxed mb-4" style={{ color: res.available ? '#5A5A56' : '#9CA3AF' }}>
                  {res.description}
                </p>
                {res.available ? (
                  <span className="text-xs font-semibold" style={{ color: '#2D6A4F' }}>
                    {res.cta}
                  </span>
                ) : (
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: '#F3F4F6', color: '#9CA3AF' }}>
                    Coming Soon
                  </span>
                )}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── SERVICES ── */}
      <section className="py-16 sm:py-20 bg-background border-t border-border">
        <div className="container px-4 sm:px-6 lg:px-8">
          <div className="mb-10">
            <h2
              className="text-3xl sm:text-4xl font-bold text-foreground mb-3"
              style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
            >
              Our Services
            </h2>
            <p className="text-muted-foreground max-w-xl">
              GEODHA connects citizen evidence to institutional accountability, from street-level reporting to ward-level data.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {services.map((svc) => (
              <Link
                key={svc.title}
                to={svc.href}
                className="group block p-6 rounded-xl bg-card border border-border hover:border-primary/40 hover:shadow-soft transition-all duration-200"
                onClick={() => window.scrollTo(0, 0)}
              >
                <div className="mb-4 p-2.5 w-fit rounded-lg bg-secondary">
                  <svc.icon className="h-6 w-6 text-primary" />
                </div>
                <h3
                  className="font-bold text-foreground mb-2"
                  style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '1.15rem' }}
                >
                  {svc.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                  {svc.description}
                </p>
                {svc.launchingSoon ? (
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-secondary text-muted-foreground">
                    Launching soon
                  </span>
                ) : (
                  <span className="text-xs font-semibold text-primary group-hover:underline">
                    {svc.cta}
                  </span>
                )}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── BOTTOM CTA ── */}
      <section className="py-16 sm:py-20 border-t border-border" style={{ background: '#F0FAF4' }}>
        <div className="container px-4 sm:px-6 lg:px-8 text-center">
          <h2
            className="text-3xl sm:text-4xl font-bold text-foreground mb-4"
            style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
          >
            Bengaluru's waste problem is visible. So is the data.
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Our philosophy is using data to solve problems, raise awareness on challenges and connect people to organizations and solutions. Be a part of the movement to make our cities clean and more livable.
          </p>
        </div>
      </section>

      {/* ── REPORTING APP — NOW AVAILABLE — dark section, very last, UI_REFERENCE style ── */}
      <section className="py-16 sm:py-20 bg-slate-900 relative overflow-hidden">
        {/* Subtle green tint gradient on right */}
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-primary/10 to-transparent pointer-events-none" />

        <div className="relative container px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">

            {/* Left: copy + store buttons */}
            <div className="space-y-6">
              <span className="inline-block px-4 py-1 rounded-full bg-primary/20 text-primary text-sm font-semibold border border-primary/30">
                Now Available
              </span>
              <h2
                className="text-4xl sm:text-5xl font-bold text-white"
                style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
              >
                Reporting App
              </h2>
              <p className="text-xl text-slate-400 leading-relaxed max-w-lg">
                The GEODHA app is here — report garbage issues in under 30 seconds, endorse reports in your area, and track them to resolution.
              </p>
              <StoreButtons placement="home_app_section" />
            </div>

            {/* Right: CSS phone mockup from UI_REFERENCE (no screenshots) */}
            <div className="flex justify-center">
              {/* Phone shell */}
              <div className="relative w-56 h-[460px] bg-slate-800 rounded-[2.8rem] border-8 border-slate-700 shadow-2xl overflow-hidden">
                {/* Notch */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-5 bg-slate-700 rounded-b-xl z-20" />
                {/* Screen */}
                <div className="w-full h-full bg-slate-900 flex flex-col items-center justify-center text-center px-6 pt-6 pb-4">
                  {/* App icon */}
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 bg-white overflow-hidden"
                    style={{ boxShadow: '0 8px 24px rgba(34,197,94,0.3)' }}
                  >
                    <img src={logoSquare} alt="GEODHA" className="w-12 h-12 object-contain" />
                  </div>
                  <h3 className="text-white font-bold text-xl mb-2">GEODHA</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    Building better communities together.
                  </p>
                  {/* Progress bar — full: the app has launched */}
                  <div className="mt-8 w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                    <div className="w-full h-full bg-primary rounded-full" />
                  </div>
                  <p className="text-xs text-slate-500 mt-2">Now on Android &amp; iOS</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;