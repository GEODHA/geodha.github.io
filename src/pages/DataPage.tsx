import { Mail, TrendingUp, Flame, Truck, MapPin, BarChart2, Lock } from 'lucide-react';

// ── PREVIEW CARDS ──────────────────────────────────────────────────────────────

const analyses = [
  {
    icon: TrendingUp,
    iconBg: 'bg-emerald-100',
    iconColor: 'text-emerald-600',
    title: 'Waste Value Recovery',
    summary:
      'How much recoverable material (metals, paper, plastics) is being lost to open burning and illegal dumping across Bengaluru wards each year? This analysis models the economic and environmental value of waste being destroyed rather than recycled, and identifies the wards with the highest recovery potential.',
    preview: 'Mapping value loss by ward · Material type breakdown · Recovery opportunity index',
  },
  {
    icon: Flame,
    iconBg: 'bg-red-100',
    iconColor: 'text-red-600',
    title: 'Open Burning × Vulnerable Populations',
    summary:
      'Open burning disproportionately affects communities living near illegal dump sites, particularly children, the elderly, and residents of dense informal housing. This analysis cross-references burning complaint patterns with proximity to schools, healthcare facilities, and high-density residential zones.',
    preview: 'Ward-level exposure index · Proximity to schools & clinics · Seasonal burn patterns',
  },
  {
    icon: Truck,
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    title: 'Vehicle Route Optimisation',
    summary:
      'Garbage collection vehicles often miss streets or arrive unpredictably. By analysing complaint data alongside image evidence from GEODHA reports, we can predict the resources and manpower needed per ward and model more efficient route coverage to eliminate chronic blind spots.',
    preview: 'Image-based load estimation · Route coverage gaps · Manpower demand modelling',
  },
  {
    icon: MapPin,
    iconBg: 'bg-teal-100',
    iconColor: 'text-teal-600',
    title: 'Accessibility to Waste Infrastructure',
    summary:
      'How far are Bengaluru residents from the nearest landfill, waste processing centre, or recycling point? This analysis maps physical accessibility to waste infrastructure alongside problem hotspot density, revealing where service gaps and population need align most critically.',
    preview: 'Distance-to-facility mapping · Hotspot overlay · Underserved zone identification',
  },
  {
    icon: BarChart2,
    iconBg: 'bg-purple-100',
    iconColor: 'text-purple-600',
    title: 'Road Quality × Truck Reliability',
    summary:
      'Poor road conditions (narrow lanes, unpaved surfaces, high-density traffic) correlate strongly with irregular garbage truck coverage. This analysis examines whether road quality and network density can predict which wards are most likely to experience chronic collection failures.',
    preview: 'Road density index · Collection failure correlation · Infrastructure risk scoring',
  },
];

// ── NARRATIVE STATS ────────────────────────────────────────────────────────────

const narrativePoints = [
  {
    label: 'Civic reports',
    detail: 'Ground-truth data submitted by residents: location, category, and photo evidence.',
  },
  {
    label: 'Cross-referenced datasets',
    detail: 'Integrated with infrastructure, demographic, and environmental open data.',
  },
  {
    label: 'Actionable analysis',
    detail: 'Turned into ward-level insights for governments, researchers, and NGOs.',
  },
];

// ── COMPONENT ──────────────────────────────────────────────────────────────────

const DataPage = () => {
  return (
    <div className="min-h-screen bg-background">

      {/* ── PAGE HEADER ── */}
      <div className="border-b border-border bg-card">
        <div className="container px-4 sm:px-6 lg:px-8 py-8">
          <div className="max-w-2xl">
            <p className="text-primary font-semibold text-sm uppercase tracking-widest mb-2">
              Data &amp; Analytics
            </p>
            <h1
              className="text-4xl sm:text-5xl font-bold text-foreground mb-3"
              style={{ fontFamily: "'Archivo', sans-serif" }}
            >
              Turning civic data into
              <span className="bg-gradient-primary bg-clip-text text-transparent"> actionable insight.</span>
            </h1>
            <p className="text-muted-foreground leading-relaxed">
              Every garbage report, every complaint, every image submitted through GEODHA becomes a data
              point. Aggregated across wards and cross-referenced with public datasets, this data has the
              potential to drive smarter policy, better resource allocation, and fairer service delivery.
            </p>
          </div>
        </div>
      </div>

      <div className="container px-4 sm:px-6 lg:px-8 py-12 space-y-16">

        {/* ── HOW DATA GENERATES VALUE ── 
        <section>
          <div className="grid lg:grid-cols-3 gap-6">
            {narrativePoints.map((point, i) => (
              <div key={i} className="relative rounded-xl bg-card border border-border p-6 group hover:border-primary/30 hover:shadow-soft transition-all duration-200">
                <div className="flex items-start gap-3">
                  <div className="h-7 w-7 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold shrink-0 mt-0.5">
                    {i + 1}
                  </div>
                  <div>
                    <h3
                      className="font-bold text-foreground mb-1"
                      style={{ fontFamily: "'Archivo', sans-serif", fontSize: '1.1rem' }}
                    >
                      {point.label}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{point.detail}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 rounded-xl bg-primary/5 border border-primary/15 px-6 py-5">
            <p className="text-foreground leading-relaxed max-w-3xl">
              The analyses below represent the <strong>data explorations we are building towards.</strong>{' '}
              As we integrate additional datasets, more interactive analyses will be available. For now, they are
              previews of what is possible, and an open invitation to researchers and organisations
              who want to collaborate.
            </p>
          </div>
        </section>*/}

        {/* ── ANALYSIS PREVIEW CARDS ── */}
        <section>
          <div className="mb-8">
            <h2
              className="text-2xl sm:text-3xl font-bold text-foreground mb-2"
              style={{ fontFamily: "'Archivo', sans-serif" }}
            >
              Analysis Previews
            </h2>
            <p className="text-muted-foreground max-w-xl">
              Five data explorations in development. Each will become a live, interactive module as the data pipeline matures.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {analyses.map((analysis) => (
              <div
                key={analysis.title}
                className="relative rounded-xl bg-card border border-border p-6 hover:border-primary/30 hover:shadow-soft transition-all duration-200 flex flex-col group"
              >
                {/* Coming Soon badge */}
                <span className="absolute top-4 right-4 flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-secondary text-muted-foreground">
                  <Lock className="h-3 w-3" />
                  Coming Soon
                </span>

                {/* Icon */}
                <div className={`w-12 h-12 rounded-xl ${analysis.iconBg} flex items-center justify-center mb-4 group-hover:scale-105 transition-transform shrink-0`}>
                  <analysis.icon className={`h-6 w-6 ${analysis.iconColor}`} />
                </div>

                {/* Title */}
                <h3
                  className="font-bold text-foreground mb-3 pr-20 leading-tight"
                  style={{ fontFamily: "'Archivo', sans-serif", fontSize: '1.15rem' }}
                >
                  {analysis.title}
                </h3>

                {/* Summary */}
                <p className="text-sm text-muted-foreground leading-relaxed mb-4 flex-1">
                  {analysis.summary}
                </p>

                {/* Preview tags */}
                <div className="pt-4 border-t border-border">
                  <p className="text-xs text-muted-foreground/70 uppercase tracking-wide font-medium mb-2">
                    What this will include
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {analysis.preview.split(' · ').map((tag) => (
                      <span
                        key={tag}
                        className="text-xs px-2.5 py-1 rounded-md bg-muted text-muted-foreground font-medium"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}

            {/* "More coming" placeholder card */}
            <div className="rounded-xl border border-dashed border-border p-6 flex flex-col items-center justify-center text-center min-h-[200px] bg-muted/20 hover:bg-muted/40 transition-colors">
              <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center mb-3">
                <span className="text-2xl text-muted-foreground font-light">+</span>
              </div>
              <p className="text-sm font-semibold text-muted-foreground mb-1">More analyses</p>
              <p className="text-xs text-muted-foreground max-w-[160px]">
                As the data pipeline grows, new explorations will be added here.
              </p>
            </div>
          </div>
        </section>

        {/* ── RESEARCHER / NGO CTA ── */}
        <section className="rounded-2xl bg-slate-900 relative overflow-hidden px-8 py-10 sm:py-14">
          {/* Subtle green tint */}
          <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-primary/15 to-transparent pointer-events-none" />

          <div className="relative max-w-2xl">
            <p className="text-primary font-semibold text-sm uppercase tracking-widest mb-3">
              For Researchers &amp; NGOs
            </p>
            <h2
              className="text-3xl sm:text-4xl font-bold text-white mb-4"
              style={{ fontFamily: "'Archivo', sans-serif" }}
            >
              Want to collaborate on this data?
            </h2>
            <p className="text-slate-400 leading-relaxed mb-6 max-w-lg">
              If you are a researcher, urban planner, public health organisation, or NGO working on
              waste management, air quality, or civic infrastructure, we want to hear from you.
              These analyses are more powerful with your expertise and datasets.
            </p>
            <div className="flex flex-wrap gap-4">
              <a
                href="mailto:contact@geodha.org?subject=Data collaboration enquiry"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-white font-semibold text-sm transition-opacity hover:opacity-90"
                style={{ background: 'var(--gradient-hero)' }}
              >
                <Mail className="h-4 w-4" />
                Get in touch: contact@geodha.org
              </a>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
};

export default DataPage;
