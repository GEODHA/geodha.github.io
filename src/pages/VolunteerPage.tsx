
// ── Org data ──────────────────────────────────────────────────────────────────

interface OrgAction {
  label: string;
  href:  string;
  type:  'primary' | 'secondary' | 'email';
}

interface Org {
  id:      number;
  name:    string;
  tagline: string;
  desc:    string;
  note?:   string;
  actions: OrgAction[];
  meta?:   string;
}

const ORGS: Org[] = [
  {
    id:      1,
    name:    'Youth For Parivarthan',
    tagline: 'Weekend spot-fixes, recyclothons & lake cleanups',
    desc:    'Very active group running weekend spot-fixes, wall art projects, recyclothons, and lake cleanups across Bengaluru. Recyclothon 2026 happened in April. ₹200 membership fee gets you into the WhatsApp community for event updates.',
    actions: [
      { label: 'Fill the registration form', href: 'https://docs.google.com/forms/d/e/1FAIpQLScxvyzQwiMoXOcjQSU-dFCp8JPffHT5_SBgEyMXZjhEs7w0Wg/viewform', type: 'primary' },
      { label: 'youthforparivarthan.org.in',  href: 'https://youthforparivarthan.org.in', type: 'secondary' },
    ],
    meta: '₹200 membership · WhatsApp community · Open to all',
  },
  {
    id:      2,
    name:    'Indian Ploggers Army',
    tagline: 'Jog + pick up litter — solo or group',
    desc:    'Plogging: jogging while picking up litter. Join solo or at group events. Bags and gloves are provided at group runs. Attend 3+ events to get added to the core community group.',
    actions: [
      { label: 'Join entry WhatsApp group', href: 'https://chat.whatsapp.com/I9QvHWsEr7Y1wqux4w9yhu', type: 'primary' },
    ],
    meta: '@theindianploggersarmy on Instagram · Bags & gloves provided at group events',
  },
  {
    id:      3,
    name:    'Reap Benefit',
    tagline: 'Beyond cleanup — understand and fix the systemic issue',
    desc:    'Runs Solver Jams: hands-on community events where citizens identify, investigate, and prototype solutions to hyper-local civic and environmental problems (waste, water, sanitation). HQ in J.P. Nagar, Bengaluru.',
    note:    'Their Solve Ninja movement connects you to a network of mentors, peer community, knowledge toolkits, and local data — all tied together through their tech platform. Good fit if you want to go beyond picking up litter and actually understand and fix the systemic issue.',
    actions: [
      { label: 'reapbenefit.org', href: 'http://reapbenefit.org', type: 'primary' },
    ],
    meta: 'Solver Jams · Solve Ninja network across India',
  },
  {
    id:      4,
    name:    'The Ugly Indian',
    tagline: 'The OG neighbourhood spot-fix',
    desc:    "Invitation-only weekend \"spotfixes\" — 7 to 10 AM. No fees, no fanfare. Email to register as a volunteer and you'll be invited to a fix in your neighbourhood. There are also local area \"Rising\" groups so you don't have to travel across the city.",
    actions: [
      { label: 'theuglyindian@gmail.com', href: 'mailto:theuglyindian@gmail.com', type: 'email' },
      { label: 'Facebook',       href: 'https://www.facebook.com/theugl.yindian/',       type: 'secondary' },
    ],
    meta: 'No fees · Invitation-only · Local area groups available',
  },
  
  {
    id:      5,
    name:    'Team Everest',
    tagline: 'One of India\'s largest volunteer networks',
    desc:    "One of India's largest volunteer networks with 25,000+ volunteers and events running year-round across cities. In Bengaluru their environment events include lake cleanups, plogging, and park restoration — with a Bengaluru event coming up.",
    note:    "Beyond environment, they also run volunteering across education, elder care, and virtual opportunities, so there's something for everyone. Sign up event-by-event — no ongoing commitment, no membership fee.",
    actions: [
      { label: 'Browse upcoming events', href: 'https://teameverest.ngo/events', type: 'primary' },
    ],
    meta: 'No commitment, no fees · Gloves & bags provided at cleanup events',
  },
];

// ── Action button ─────────────────────────────────────────────────────────────

function ActionBtn({ action }: { action: OrgAction }) {
  const isEmail = action.type === 'email';

  const base = 'inline-flex items-center gap-1.5 text-sm font-semibold rounded-lg px-4 py-2 transition-opacity hover:opacity-85 no-underline';
  const variant: Record<OrgAction['type'], string> = {
    primary:   'bg-primary text-primary-foreground',
    secondary: 'border border-primary text-primary bg-transparent',
    email:     'border border-border text-foreground bg-transparent',
  };

  return (
    <a
      href={action.href}
      target={isEmail ? undefined : '_blank'}
      rel={isEmail ? undefined : 'noopener noreferrer'}
      className={`${base} ${variant[action.type]}`}
      style={{ textDecoration: 'none' }}
    >
      {isEmail && <span className="text-sm">✉</span>}
      {action.label}
      {!isEmail && <span className="text-[11px] opacity-50">↗</span>}
    </a>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function VolunteerPage() {
  return (
    <div className="min-h-screen bg-background">

      {/* ── PAGE HEADER ─────────────────────────────────────────────────────── */}
      <section className="bg-muted/40 border-b border-border py-10 sm:py-14">
        <div className="container px-4 sm:px-6 lg:px-8 max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-3">
            Community Action · Bengaluru
          </p>
          <h1
            className="text-4xl sm:text-5xl font-bold text-foreground mb-3"
            style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
          >
            🧹 Volunteer for Cleanups
          </h1>
          <p className="text-muted-foreground max-w-xl text-base">
            Organisations operating in Bengaluru running regular cleanup drives.
            Pick the one that fits how you want to show up.
          </p>
        </div>
      </section>

      {/* ── ORG CARDS ──────────────────────────────────────────────────────── */}
      <section className="py-12">
        <div className="container px-4 sm:px-6 lg:px-8 max-w-3xl flex flex-col gap-5">
          {ORGS.map((org) => (
            <div
              key={org.id}
              className="bg-card border border-border rounded-2xl p-6 sm:p-7 border-l-4"
              style={{ borderLeftColor: 'hsl(var(--primary))' }}
            >
              {/* Header */}
              <div className="flex items-start gap-3 mb-3">
                <span className="bg-primary/10 text-primary text-[11px] font-bold rounded-full flex items-center justify-center shrink-0 mt-0.5"
                  style={{ minWidth: 24, height: 24 }}>
                  {org.id}
                </span>
                <div>
                  <h2
                    className="text-xl font-bold text-foreground leading-tight mb-1"
                    style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '1.35rem' }}
                  >
                    {org.name}
                  </h2>
                  <p className="text-xs font-semibold text-primary uppercase tracking-wide">
                    {org.tagline}
                  </p>
                </div>
              </div>

              {/* Description */}
              <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                {org.desc}
              </p>

              {/* Optional note */}
              {org.note && (
                <p className="text-sm text-muted-foreground leading-relaxed mb-4 px-3.5 py-3 bg-primary/5 border-l-2 border-primary/30 rounded-r-lg">
                  {org.note}
                </p>
              )}

              {/* Actions */}
              <div className="flex flex-wrap gap-2.5 mb-4">
                {org.actions.map(a => (
                  <ActionBtn key={a.label} action={a} />
                ))}
              </div>

              {/* Meta */}
              {org.meta && (
                <p className="text-xs text-muted-foreground border-t border-border pt-3 mt-1">
                  {org.meta}
                </p>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
