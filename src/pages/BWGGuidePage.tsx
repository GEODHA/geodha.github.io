import { Link } from 'react-router-dom';

// ── Colour tokens ─────────────────────────────────────────────────────────────
const C = {
  greenDark:  '#1B4332',
  green:      '#2D6A4F',
  greenMid:   '#52B788',
  greenLight: '#D8F3DC',
  blue:       '#1A5276',
  blueMid:    '#2E86C1',
  blueLight:  '#D6EAF8',
  red:        '#922B21',
  redMid:     '#E74C3C',
  redLight:   '#FADBD8',
  black:      '#1C1C1C',
  blackLight: '#E8E8E6',
  blackMid:   '#555555',
  amber:      '#B7410E',
  amberLight: '#FEF3C7',
  bg:         '#FAFAF7',
  border:     '#E5E5E0',
  text:       '#1A1A18',
  textSec:    '#5A5A56',
  white:      '#FFFFFF',
} as const;

// ── Data ──────────────────────────────────────────────────────────────────────

const THRESHOLDS = [
  { icon: '🗑', label: 'Waste generated', value: '> 100 kg / day', note: 'Includes all waste streams combined' },
  { icon: '🏗', label: 'Built-up area', value: '> 20,000 sq.m', note: 'Total built-up area of the premises' },
  { icon: '💧', label: 'Water consumption', value: '> 40,000 LPD', note: 'Litres per day from all sources' },
];

const WHO_QUALIFIES = [
  { icon: '🏢', label: 'Apartment complexes', desc: 'Large RWAs with more than ~200 units typically qualify.' },
  { icon: '🏨', label: 'Hotels & resorts', desc: 'Most mid-to-large hotels exceed the daily waste threshold.' },
  { icon: '🏥', label: 'Hospitals & clinics', desc: 'Also subject to biomedical waste rules in addition to BWG.' },
  { icon: '🏬', label: 'Malls & commercial complexes', desc: 'Large retail spaces routinely cross built-up area thresholds.' },
  { icon: '🎓', label: 'Educational institutions', desc: 'Colleges and large schools with hostels, canteens, and grounds.' },
  { icon: '🏭', label: 'Industrial & IT parks', desc: 'Office campuses and SEZs with large footprints or canteen operations.' },
];

const OBLIGATIONS = [
  {
    num: '01',
    title: 'Register with BBMP',
    desc: 'All BWGs must register with BBMP as a Bulk Waste Generator. Registration is mandatory before commencing self-processing. Unregistered BWGs face penalties under the SWM Rules.',
    badge: 'Mandatory',
    badgeColor: C.redMid,
  },
  {
    num: '02',
    title: 'On-site segregation',
    desc: 'Wet waste, dry waste, and sanitary waste must be segregated at source within the premises. Mixed waste cannot be handed to any transporter or BSWML. Individual units (flats, shops) are responsible for segregation before handover to the bulk point.',
    badge: 'Mandatory',
    badgeColor: C.redMid,
  },
  {
    num: '03',
    title: 'On-site wet waste processing',
    desc: 'Wet waste must be processed on the premises itself — through composting, biogas units, or other approved methods. BSWML will not collect wet waste from BWGs. Processed output (compost, biogas) is yours to use or give away.',
    badge: 'Mandatory',
    badgeColor: C.redMid,
  },
  {
    num: '04',
    title: 'Certified transporter for residual waste',
    desc: 'Dry waste and sanitary waste that cannot be processed on-site must be handed to a BBMP-certified or KSPCB-registered transporter. BSWML doorstep collection is not available for BWGs. Keep records of transporter receipts.',
    badge: 'Mandatory',
    badgeColor: C.redMid,
  },
  {
    num: '05',
    title: 'Digital monitoring & monthly reporting',
    desc: 'BWGs are required to submit monthly waste generation and processing reports to BBMP digitally. Incoming central government portal (expected within 3 months) will centralise this. Until then, check with your ward office for the current reporting format.',
    badge: 'Pending portal',
    badgeColor: C.amber,
  },
];

const PROCESSING_OPTIONS = [
  {
    title: 'Composting',
    icon: '🌿',
    suitableFor: 'Buildings with a garden or grounds',
    desc: 'Aerobic composting converts wet waste into usable compost in 30–45 days. Suitable for apartments with a garden. Compost output can be used for landscaping or donated to nearby parks.',
    pros: ['Low cost', 'Useful output', 'No daily operations'],
    cons: ['Space required', 'Slower processing'],
  },
  {
    title: 'Biogas Unit',
    icon: '⚡',
    suitableFor: 'High-volume buildings, canteens',
    desc: 'Anaerobic digestion converts wet waste into biogas (used for cooking/lighting) and slurry (used as fertiliser). Best for high-volume generators — >50 kg/day wet waste. Faster processing than composting.',
    pros: ['Energy recovery', 'Faster', 'Handles meat & cooked food'],
    cons: ['Higher capital cost', 'Requires maintenance'],
  },
  {
    title: 'Vermiculture',
    icon: '🪱',
    suitableFor: 'Medium-size premises',
    desc: 'Earthworm-based composting produces high-quality vermicompost. Lower odour than open composting. Works well for apartments with moderate waste volumes.',
    pros: ['Premium compost quality', 'Low odour', 'Compact'],
    cons: ['Temperature sensitive', 'Slow in monsoon'],
  },
];

const PENALTIES = [
  { rule: 'Failure to register as BWG', penalty: 'Fine up to ₹25,000 + daily penalty for continued non-compliance' },
  { rule: 'Handing mixed/unsegregated waste', penalty: 'Fine up to ₹10,000 per instance; BSWML authorised to refuse collection' },
  { rule: 'Passing wet waste to BSWML', penalty: 'Refusal of collection + fine; BSWML is not obligated to collect wet waste from BWGs' },
  { rule: 'Using an uncertified transporter', penalty: 'Fine on both BWG and transporter; joint liability' },
  { rule: 'Missing monthly reporting', penalty: 'Accumulating penalty; can escalate to registration suspension' },
];

// ── Sub-components ─────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: string }) {
  return (
    <p style={{ color: C.textSec }} className="text-[11px] font-semibold tracking-[2px] uppercase mb-2">
      {children}
    </p>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2
      style={{ fontFamily: "'Archivo', sans-serif", color: C.text }}
      className="text-[28px] sm:text-[36px] font-bold leading-tight tracking-tight mb-2"
    >
      {children}
    </h2>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

// Sections pending bylaw finalisation — flip to true to re-enable.
const SHOW_PENDING_SECTIONS = false as boolean;

export default function BWGGuidePage() {
  return (
    <div style={{ background: C.bg, color: C.text, fontFamily: "'Inter', sans-serif", fontSize: 15, lineHeight: 1.6 }} className="min-h-screen">

      {/* ── WIP BANNER ─────────────────────────────────────────────────────── */}
      <div style={{ background: C.amberLight, borderBottom: `1px solid #F5DEB3` }} className="px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-start gap-3">
          <span className="text-[16px] shrink-0 mt-0.5">🚧</span>
          <p style={{ color: C.amber, fontSize: 12, lineHeight: 1.5 }}>
            <strong>Work in Progress.</strong> GBA and BSWML bylaws are expected by mid-May. The central government SWM compliance portal is launching within 3 months. This page will be updated as those are finalised.
          </p>
        </div>
      </div>

      {/* ── HERO ───────────────────────────────────────────────────────────── */}
      <div
        style={{ background: C.greenDark, position: 'relative', overflow: 'hidden' }}
        className="px-6 pt-12 pb-14 text-center"
      >
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: `radial-gradient(ellipse at 25% 60%, rgba(82,183,136,0.13) 0%, transparent 55%),
                       radial-gradient(ellipse at 75% 20%, rgba(82,183,136,0.07) 0%, transparent 50%)`,
        }} />
        <span
          style={{ border: `1px solid rgba(82,183,136,0.3)`, color: C.greenMid }}
          className="relative inline-block text-[11px] font-semibold tracking-[2px] uppercase mb-4 px-4 py-1.5 rounded-full"
        >
          SWM 2026 · Bulk Waste Generators
        </span>
        <h1
          style={{ fontFamily: "'Archivo', sans-serif", color: C.white, lineHeight: 1.05, letterSpacing: '-1px' }}
          className="relative text-[clamp(30px,6vw,50px)] font-bold mb-4"
        >
          You generate more waste<br />
          <span style={{ color: C.greenMid }}>than you might think.</span>
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.65)', maxWidth: 500, fontWeight: 300 }} className="relative text-[16px] mx-auto mb-8">
          Apartments, hotels, malls, and institutions that cross certain thresholds are classified as
          Bulk Waste Generators — with mandatory obligations beyond standard doorstep collection.
        </p>
        <Link
          to="/guide"
          style={{ color: C.greenMid, fontSize: 13, fontWeight: 600 }}
          className="relative hover:underline"
        >
          ← Back to the Waste Guide
        </Link>
      </div>

      {/* ── DO YOU QUALIFY? ─────────────────────────────────────────────────── */}
      <section style={{ borderBottom: `1px solid ${C.border}` }} className="py-14">
        <div className="max-w-3xl mx-auto px-5">
          <SectionLabel>Qualification thresholds</SectionLabel>
          <SectionTitle>Does this apply to you?</SectionTitle>
          <p style={{ color: C.textSec }} className="text-[15px] font-light mb-8">
            Meeting <strong>any one</strong> of the three thresholds below qualifies a premises as a Bulk Waste Generator.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
            {THRESHOLDS.map(t => (
              <div key={t.label} style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 14 }} className="p-5 text-center">
                <div className="text-[32px] mb-2">{t.icon}</div>
                <div style={{ fontFamily: "'Archivo', sans-serif", fontSize: 24, fontWeight: 700, color: C.green, marginBottom: 4 }}>
                  {t.value}
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 4 }}>{t.label}</div>
                <div style={{ fontSize: 12, color: C.textSec }}>{t.note}</div>
              </div>
            ))}
          </div>

          <SectionLabel>Who typically qualifies</SectionLabel>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {WHO_QUALIFIES.map(w => (
              <div key={w.label} style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 12 }} className="p-4 flex items-start gap-3">
                <span className="text-[22px] shrink-0">{w.icon}</span>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 2 }}>{w.label}</div>
                  <div style={{ fontSize: 13, color: C.textSec }}>{w.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WORK IN PROGRESS ────────────────────────────────────────────────── */}
      <section className="py-14">
        <div className="max-w-3xl mx-auto px-5">
          <div style={{ background: C.greenDark, borderRadius: 16 }} className="p-8 sm:p-10 text-center">
            <div className="text-[48px] mb-4">🚧</div>
            <h2
              style={{ fontFamily: "'Archivo', sans-serif", fontSize: 28, fontWeight: 700, color: C.white, marginBottom: 12 }}
            >
              Detailed guidance coming soon
            </h2>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 1.7, maxWidth: 480, margin: '0 auto 20px' }}>
              We are finalising the obligations, processing options, penalty framework, and step-by-step
              registration guide — pending the GBA/BSWML bylaw updates expected by mid-May and the central
              government SWM portal launching within 3 months.
            </p>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 24 }}>
              In the meantime, contact your GBA/BBMP/BSWML zonal office.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link
                to="/guide"
                style={{ background: 'rgba(255,255,255,0.1)', color: C.white, fontWeight: 600, fontSize: 13, padding: '10px 22px', borderRadius: 8, textDecoration: 'none', display: 'inline-block', border: '1px solid rgba(255,255,255,0.2)' }}
              >
                ← Back to Waste Guide
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── DISABLED SECTIONS (pending bylaw finalisation) ─────────────────── */}
      {SHOW_PENDING_SECTIONS && (
        <>
          {/* ── OBLIGATIONS ── */}
          <section style={{ borderBottom: `1px solid ${C.border}` }} className="py-14">
            <div className="max-w-3xl mx-auto px-5">
              <SectionLabel>What is required</SectionLabel>
              <SectionTitle>BWG obligations</SectionTitle>
              <div className="flex flex-col gap-4">
                {OBLIGATIONS.map(o => (
                  <div key={o.num} style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 14 }} className="p-6">
                    <div className="flex items-start gap-4">
                      <div style={{ fontFamily: "'Archivo', sans-serif", fontSize: 28, fontWeight: 700, color: C.greenMid, lineHeight: 1, minWidth: 40, flexShrink: 0 }}>
                        {o.num}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-2">
                          <h3 style={{ fontWeight: 700, fontSize: 15, color: C.text }}>{o.title}</h3>
                          <span style={{ fontSize: 10, fontWeight: 700, background: o.badgeColor + '22', color: o.badgeColor, padding: '2px 8px', borderRadius: 4 }}>
                            {o.badge}
                          </span>
                        </div>
                        <p style={{ fontSize: 13.5, color: C.textSec, lineHeight: 1.6 }}>{o.desc}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ── ON-SITE PROCESSING OPTIONS ── */}
          <section style={{ borderBottom: `1px solid ${C.border}` }} className="py-14">
            <div className="max-w-3xl mx-auto px-5">
              <SectionLabel>On-site wet waste processing</SectionLabel>
              <SectionTitle>Processing options</SectionTitle>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {PROCESSING_OPTIONS.map(opt => (
                  <div key={opt.title} style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 14 }} className="p-5">
                    <div className="text-[30px] mb-3">{opt.icon}</div>
                    <h3 style={{ fontFamily: "'Archivo', sans-serif", fontSize: 20, fontWeight: 700, color: C.text, marginBottom: 8 }}>{opt.title}</h3>
                    <p style={{ fontSize: 13, color: C.textSec, lineHeight: 1.55 }}>{opt.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ── PENALTIES ── */}
          <section style={{ borderBottom: `1px solid ${C.border}` }} className="py-14">
            <div className="max-w-3xl mx-auto px-5">
              <SectionLabel>Enforcement</SectionLabel>
              <SectionTitle>Penalties for non-compliance</SectionTitle>
              <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 14, overflow: 'hidden' }}>
                {PENALTIES.map((p, i) => (
                  <div key={p.rule} style={{ borderBottom: i < PENALTIES.length - 1 ? `1px solid ${C.border}` : 'none' }} className="px-5 py-4 sm:flex sm:items-start sm:gap-6">
                    <div style={{ fontSize: 13.5, fontWeight: 600, color: C.text, minWidth: 220, flexShrink: 0 }}>{p.rule}</div>
                    <div style={{ fontSize: 13, color: C.redMid }}>{p.penalty}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ── NEXT STEPS ── */}
          <section className="py-14">
            <div className="max-w-3xl mx-auto px-5">
              <SectionLabel>Getting started</SectionLabel>
              <SectionTitle>What to do now</SectionTitle>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
