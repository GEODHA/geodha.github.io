import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Share2, Check, X, Phone, Mail, Building2, MapPin, ExternalLink, Camera,
  Users, Landmark, ArrowRight, AlertTriangle, Info,
} from 'lucide-react';
import { BAND } from '@/lib/severity';
import type { BandLevel } from '@/lib/severity';
import type { WardData, RecommendedActionDoc, ProblemCategory, TestimonialDoc } from '@/services/geodhaService';
import { BBMP_BY_NUM, GBA_BY_ID, gbaWardsForBbmp } from '@/lib/wards';
import {
  CORPORATIONS, CONTACTS_AS_OF, CONTACTS_SOURCE, CITY_HELPLINE, COMPLAINT_PORTAL_URL,
  wardMarshalPhone, telHref,
} from '@/data/gbaContacts';
import type { Official } from '@/data/gbaContacts';
import { BandBadge, ProblemIcon, ImageLightbox } from '@/components/dashboard/shared';
import { renderWithLinks, resolveStep, formatMonthYear } from '@/components/dashboard/format';
import { trackEvent } from '@/lib/analytics';
import type { Scales, ScorecardSelection } from './types';

const PROBLEM_LABELS: Record<ProblemCategory, string> = {
  garbage_dump:                'Garbage dumps',
  garbage_vehicle_not_arrived: 'Missed collections',
  burning_of_garbage:          'Open burning',
};

// ── Small building blocks ─────────────────────────────────────────────────────

function Panel({ title, kicker, children, tone = 'bg-paper' }: {
  title: string; kicker?: string; children: React.ReactNode; tone?: string;
}) {
  return (
    <section className={`${tone} border-[3px] border-ink rounded-2xl p-5 sm:p-6`} style={{ boxShadow: 'var(--shadow-offset-4)' }}>
      {kicker && <p className="mono-label !text-[11px] mb-1">{kicker}</p>}
      <h3 className="text-lg sm:text-xl font-black tracking-[-0.01em] mb-4">{title}</h3>
      {children}
    </section>
  );
}

/** 5-segment severity meter. */
function Meter({ band }: { band: BandLevel }) {
  return (
    <span className="inline-flex gap-0.5" aria-label={`Severity ${band} of 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          className="h-2.5 w-4 sm:w-5 rounded-sm border border-ink/30"
          style={{ background: i <= band ? BAND[band].dot : 'transparent' }}
        />
      ))}
    </span>
  );
}

function ContactRow({ icon: Icon, label, value, href, sub }: {
  icon: typeof Phone; label: string; value: string; href?: string; sub?: string;
}) {
  return (
    <div className="flex items-start gap-3 py-2.5">
      <span className="h-8 w-8 shrink-0 rounded-lg border-2 border-ink bg-paper flex items-center justify-center">
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <p className="text-[11px] font-bold uppercase tracking-wide text-foreground/55">{label}</p>
        {href
          ? <a href={href} className="font-extrabold hover:text-primary underline-offset-2 hover:underline break-words">{value}</a>
          : <p className="font-extrabold break-words">{value}</p>}
        {sub && <p className="text-xs text-foreground/60 leading-snug">{sub}</p>}
      </div>
    </div>
  );
}

function OfficialRow({ o }: { o: Official }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <div className="min-w-0">
        <p className="text-[11px] font-bold uppercase tracking-wide text-foreground/55">{o.role}</p>
        <p className="text-sm font-bold truncate">{o.name}</p>
      </div>
      <a href={telHref(o.phone)} className="shrink-0 inline-flex items-center gap-1.5 text-xs font-extrabold rounded-full px-3 py-1.5 border-2 border-ink hover:bg-tint-yellow">
        <Phone className="h-3 w-3" /> {o.phone}
      </a>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

interface Props {
  selection:       ScorecardSelection;
  wardDataMap:     Record<number, WardData>;
  scales:          Scales;
  actions:         Record<ProblemCategory, RecommendedActionDoc> | null;
  testimonials:    TestimonialDoc[];
  onChange:        (next: ScorecardSelection) => void;
  onClear:         () => void;
}

export default function WardScorecard({ selection, wardDataMap, scales, actions, testimonials, onChange, onClear }: Props) {
  const { bbmpNum, gbaId, place } = selection;
  const bbmp  = bbmpNum != null ? BBMP_BY_NUM[bbmpNum] : undefined;
  const gba   = gbaId ? GBA_BY_ID[gbaId] : undefined;
  const data  = bbmpNum != null ? wardDataMap[bbmpNum] : undefined;
  const corp  = gba ? CORPORATIONS[gba.corp] : undefined;

  const [copied, setCopied]     = useState(false);
  const [lightbox, setLightbox] = useState<number | null>(null);
  const [activeCat, setActiveCat] = useState<ProblemCategory | null>(null);
  useEffect(() => { setActiveCat(null); }, [bbmpNum]);

  // Other wards in the other system that overlap this one.
  const gbaAlternatives  = useMemo(() => (bbmpNum != null ? gbaWardsForBbmp(bbmpNum) : []), [bbmpNum]);
  const bbmpAlternatives = gba?.bbmp ?? [];

  const wardTestimonials = useMemo(() => bbmpNum == null ? [] : testimonials.filter(
    (t) => t.ward_num === bbmpNum || (t.extra_ward_nums ?? []).includes(bbmpNum),
  ), [testimonials, bbmpNum]);
  const images = wardTestimonials.flatMap((t) => t.images);
  const thumbs = wardTestimonials.flatMap((t) => t.images.map((u, i) => t.thumb_images?.[i] ?? u));

  const problems = data ? ([
    { category: 'garbage_dump' as const,                band: scales.dump(data.garbage_dump),                count: data.garbage_dump,                open: data.garbage_dump_open },
    { category: 'garbage_vehicle_not_arrived' as const, band: scales.veh(data.garbage_vehicle_not_arrived), count: data.garbage_vehicle_not_arrived, open: data.garbage_vehicle_not_arrived_open },
    { category: 'burning_of_garbage' as const,          band: scales.burn(data.burning_of_garbage),          count: data.burning_of_garbage,          open: data.burning_of_garbage_open },
  ].sort((a, b) => b.band - a.band || b.count - a.count)) : [];
  const overall  = data ? scales.total(data.total_reports) : 0;
  const allClean = problems.every((p) => p.band <= 1);
  const shownCat = activeCat ?? problems[0]?.category ?? 'garbage_dump';
  const action   = actions?.[shownCat] ?? null;

  const title = gba?.name ?? bbmp?.name ?? 'Your neighbourhood';

  const share = async () => {
    trackEvent('share_click', { target: 'scorecard', ward_num: bbmpNum, gba_id: gbaId });
    const params = new URLSearchParams({ view: 'scorecard' });
    if (bbmpNum != null) params.set('ward', String(bbmpNum));
    if (gbaId) params.set('gba', gbaId);
    const url  = `${window.location.origin}/dashboard?${params}`;
    const text = `📋 ${title} — neighbourhood scorecard on GEODHA: reported garbage issues, who's responsible and who to call.`;
    if (navigator.share) {
      try { await navigator.share({ title: `${title} · GEODHA`, text, url }); return; }
      catch (err) { if ((err as Error).name === 'AbortError') return; }
    }
    try { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 2200); }
    catch { /* ignore */ }
  };

  return (
    <div className="space-y-6">
      {lightbox != null && images.length > 0 && (
        <ImageLightbox images={images} initialIndex={lightbox} onClose={() => setLightbox(null)} />
      )}

      {/* ── Identity ─────────────────────────────────────────────────────── */}
      <section className="card-poster p-5 sm:p-7">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="mono-label !text-[11px] mb-1.5">
              Neighbourhood scorecard{place ? ` · ${place.label}` : ''}
            </p>
            <h2 className="text-3xl sm:text-4xl font-black tracking-[-0.03em] leading-[1.05]">{title}</h2>
            {gba?.kn && <p className="text-foreground/60 font-semibold mt-1">{gba.kn}</p>}
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button onClick={share} className="p-2 rounded-full border-2 border-ink hover:bg-tint-yellow" aria-label="Share scorecard" title={copied ? 'Link copied!' : 'Share'}>
              {copied ? <Check className="h-4 w-4 text-primary" /> : <Share2 className="h-4 w-4" />}
            </button>
            <button onClick={onClear} className="p-2 rounded-full border-2 border-ink hover:bg-tint-yellow" aria-label="Close scorecard" title="New search">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="mt-5 grid sm:grid-cols-2 gap-3">
          {/* New system */}
          <div className="rounded-xl border-[2.5px] border-ink bg-tint-blue p-4">
            <p className="text-[10px] font-black uppercase tracking-wider text-accent mb-1">New · GBA ward (2025)</p>
            {gba ? (
              <>
                <p className="font-black text-lg leading-tight">{gba.name} <span className="font-mono text-sm text-foreground/60">#{gba.no}</span></p>
                <p className="text-sm font-bold mt-0.5">{corp?.name}</p>
                <ul className="mt-2 space-y-1 text-xs text-foreground/70">
                  <li className="flex items-center gap-1.5"><Landmark className="h-3.5 w-3.5" /> Assembly: {gba.ac}</li>
                  <li className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> {gba.zone.replace('Zone', 'Zone ')} · {gba.zoneName}</li>
                  {gba.pop > 0 && <li className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5" /> Population ≈ {gba.pop.toLocaleString('en-IN')}</li>}
                </ul>
              </>
            ) : (
              <p className="text-sm text-foreground/60">Finding the GBA ward…</p>
            )}
            {gbaAlternatives.length > 1 && (
              <div className="mt-3 pt-3 border-t-2 border-ink/10">
                <p className="text-[11px] font-bold text-foreground/60 mb-1.5">Old ward {bbmpNum} now spans:</p>
                <div className="flex flex-wrap gap-1.5">
                  {gbaAlternatives.slice(0, 6).map(({ ward, pct }) => (
                    <button
                      key={ward.id}
                      onClick={() => onChange({ ...selection, gbaId: ward.id, place: undefined })}
                      className={`text-[11px] font-bold rounded-full px-2.5 py-1 border-2 ${ward.id === gbaId ? 'bg-ink text-white border-ink' : 'bg-paper border-ink/30 hover:border-ink'}`}
                    >
                      {ward.name} · {pct}%
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Old system */}
          <div className="rounded-xl border-[2.5px] border-ink bg-tint-green p-4">
            <p className="text-[10px] font-black uppercase tracking-wider text-primary mb-1">Old · BBMP ward (2010)</p>
            {bbmp ? (
              <>
                <p className="font-black text-lg leading-tight">{bbmp.name} <span className="font-mono text-sm text-foreground/60">#{bbmp.num}</span></p>
                {bbmp.zone && <p className="text-sm font-bold mt-0.5">{bbmp.zone} zone</p>}
                <p className="mt-2 text-xs text-foreground/70 leading-relaxed">
                  Complaint data and ward-marshal numbers still follow these 198 wards.
                </p>
              </>
            ) : (
              <p className="text-sm text-foreground/60">No BBMP ward match for this location.</p>
            )}
            {bbmpAlternatives.length > 1 && (
              <div className="mt-3 pt-3 border-t-2 border-ink/10">
                <p className="text-[11px] font-bold text-foreground/60 mb-1.5">{gba?.name} overlaps old wards — showing data for:</p>
                <div className="flex flex-wrap gap-1.5">
                  {bbmpAlternatives.map(([num, pct]) => (
                    <button
                      key={num}
                      onClick={() => onChange({ ...selection, bbmpNum: num, place: undefined })}
                      className={`text-[11px] font-bold rounded-full px-2.5 py-1 border-2 ${num === bbmpNum ? 'bg-ink text-white border-ink' : 'bg-paper border-ink/30 hover:border-ink'}`}
                    >
                      {BBMP_BY_NUM[num]?.name ?? `Ward ${num}`} · {pct}%
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── Issue scorecard ──────────────────────────────────────────────── */}
      {data ? (
        <Panel kicker={`Reported issues · BBMP ward ${bbmpNum}`} title="Garbage report card">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <span className="text-sm font-bold">Overall</span>
            <BandBadge band={overall} size="lg" />
            <span className="text-xs text-foreground/60">
              {data.total_reports.toLocaleString('en-IN')} reports · {data.total_open.toLocaleString('en-IN')} still open
            </span>
          </div>
          <div className="divide-y-2 divide-ink/10 border-y-2 border-ink/10">
            {problems.map((p) => (
              <button
                key={p.category}
                onClick={() => setActiveCat(p.category)}
                className={`w-full flex items-center gap-3 py-3 px-2 text-left transition-colors ${shownCat === p.category ? 'bg-tint-yellow' : 'hover:bg-muted/50'}`}
              >
                <span className="w-7 flex justify-center"><ProblemIcon category={p.category} size={20} /></span>
                <span className="flex-1 min-w-0">
                  <span className="block font-bold text-sm">{PROBLEM_LABELS[p.category]}</span>
                  <span className="block text-xs text-foreground/60">{p.count} reported · {p.open} open</span>
                </span>
                <span className="hidden sm:inline"><Meter band={p.band} /></span>
                <BandBadge band={p.band} />
              </button>
            ))}
          </div>
          {problems[0] && problems[0].band >= 4 && (
            <p className="mt-3 text-xs font-semibold flex items-start gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0 text-destructive" />
              Among the most affected wards in the city for {PROBLEM_LABELS[problems[0].category].toLowerCase()}.
            </p>
          )}
          <p className="mt-3 text-[11px] text-foreground/50 leading-relaxed flex items-start gap-1.5">
            <Info className="h-3 w-3 mt-0.5 shrink-0" />
            Ratings are relative — percentile intensity across Bengaluru's 198 BBMP wards, aggregated from citizen complaint sources.
          </p>
        </Panel>
      ) : bbmpNum != null ? (
        <Panel title="Garbage report card" kicker="Reported issues">
          <p className="text-sm text-foreground/60">No complaint data available for this ward yet.</p>
        </Panel>
      ) : null}

      {/* ── What you can do ──────────────────────────────────────────────── */}
      {data && (allClean ? (
        <Panel title="Looking good — keep it that way" kicker="What you can do" tone="bg-tint-green">
          <p className="text-sm text-foreground/75 leading-relaxed">
            This ward has relatively few garbage complaints. See something anyway? Report it with the GEODHA app,
            or brush up on the <Link to="/guide" className="font-bold underline">4-stream segregation guide</Link>.
          </p>
        </Panel>
      ) : action && (
        <Panel title={action.label} kicker={`What you can do · ${PROBLEM_LABELS[shownCat]}`}>
          {action.violation && <p className="text-sm text-foreground/70 mb-3 leading-relaxed">{action.violation}</p>}
          <ol className="space-y-3">
            {action.steps.map((s, i) => {
              const n = bbmpNum ?? 0;
              const url = s.url ? resolveStep(s.url, n) : undefined;
              return (
                <li key={i} className="flex gap-3">
                  <span className="text-lg leading-none mt-0.5">{s.emoji}</span>
                  <div>
                    <p className="text-sm font-bold">{resolveStep(s.heading, n)}</p>
                    <p className="text-sm text-foreground/70 leading-relaxed">{resolveStep(s.detail, n)}</p>
                    {url && (
                      <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-bold text-accent hover:underline mt-1">
                        {(s.urlText && resolveStep(s.urlText, n).trim()) || 'Learn more'} <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        </Panel>
      ))}

      {/* ── Key contacts ─────────────────────────────────────────────────── */}
      <Panel title="Who to contact" kicker="Key contacts" tone="bg-tint-yellow">
        <div className="divide-y-2 divide-ink/10">
          {bbmpNum != null && (
            <ContactRow
              icon={Phone}
              label={`Ward marshal · BBMP ward ${bbmpNum}`}
              value={wardMarshalPhone(bbmpNum)}
              href={telHref(wardMarshalPhone(bbmpNum))}
              sub="For garbage and sanitation issues in this ward"
            />
          )}
          <ContactRow icon={Phone} label="City helpline" value={CITY_HELPLINE} href={telHref(CITY_HELPLINE)} />
          <ContactRow
            icon={ExternalLink}
            label="File a complaint online"
            value={COMPLAINT_PORTAL_URL.replace('https://', '')}
            href={COMPLAINT_PORTAL_URL}
            sub="Or report with photos + GPS using the GEODHA app"
          />
          {corp && gba && (
            <>
              <ContactRow
                icon={Building2}
                label={`${corp.name} · control room`}
                value={corp.controlRoom.join(' / ')}
                href={telHref(corp.controlRoom[0])}
                sub={corp.office}
              />
              <ContactRow icon={Mail} label="Commissioner's office" value={corp.email} href={`mailto:${corp.email}`} />
            </>
          )}
        </div>

        {corp && gba && (
          <div className="mt-4 rounded-xl border-2 border-ink/20 bg-paper px-4 py-2 divide-y divide-ink/10">
            {corp.jointCommissioner[gba.zone] && <OfficialRow o={corp.jointCommissioner[gba.zone]} />}
            <OfficialRow o={corp.healthOfficer} />
            <OfficialRow o={corp.commissioner} />
          </div>
        )}

        <p className="mt-3 text-[11px] text-foreground/55 leading-relaxed">
          Officials as listed by the city corporations ({CONTACTS_AS_OF},{' '}
          <a href={CONTACTS_SOURCE} target="_blank" rel="noopener noreferrer" className="underline">source</a>).
          Spotted an outdated number?{' '}
          <a href="mailto:contact@geodha.org?subject=Scorecard%20contact%20correction" className="underline font-semibold">Tell us</a>.
        </p>
      </Panel>

      {/* ── Citizen voices ───────────────────────────────────────────────── */}
      <Panel title="Citizen voices" kicker={`From ${bbmp?.name ?? 'this ward'}`}>
        {images.length > 0 ? (
          <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
            {images.map((_, i) => (
              <button key={i} onClick={() => setLightbox(i)} className="shrink-0 rounded-lg overflow-hidden border-2 border-ink" aria-label={`View photo ${i + 1}`}>
                <img src={thumbs[i]} alt="" className="h-24 w-24 object-cover" loading="lazy" />
              </button>
            ))}
          </div>
        ) : (
          <p className="flex items-center gap-2 text-xs text-foreground/55 mb-3">
            <Camera className="h-3.5 w-3.5" /> No photos for this ward yet.
          </p>
        )}
        {wardTestimonials.length > 0 ? (
          <div className="space-y-3">
            {wardTestimonials.map((t) => (
              <figure key={t.id} className={`rounded-xl border-2 p-4 ${t.is_positive ? 'bg-tint-green border-primary/40' : 'bg-tint-yellow border-secondary'}`}>
                <p className="text-sm font-extrabold mb-1.5">{t.is_positive ? '✓ ' : ''}{t.title}</p>
                <blockquote className="text-sm italic text-foreground/75 leading-relaxed">“{renderWithLinks(t.quote)}”</blockquote>
                <figcaption className="text-[11px] text-foreground/50 mt-2">
                  {t.source}{t.locality ? ` · ${t.locality}` : ''}{t.date ? ` · ${formatMonthYear(t.date)}` : ''}
                </figcaption>
              </figure>
            ))}
          </div>
        ) : (
          <p className="text-sm text-foreground/60">
            No testimonials from this ward yet.{' '}
            <a href="mailto:contact@geodha.org?subject=Ward%20testimonial" className="font-bold underline">Share your story</a>.
          </p>
        )}
      </Panel>

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <Link
        to="/report"
        className="flex items-center justify-between gap-4 bg-primary text-primary-foreground border-[3px] border-ink rounded-2xl px-5 py-4"
        style={{ boxShadow: 'var(--shadow-offset-4)' }}
      >
        <span>
          <span className="block font-black">See a problem here?</span>
          <span className="block text-sm opacity-90">Report it in 30 seconds with the GEODHA app.</span>
        </span>
        <ArrowRight className="h-5 w-5 shrink-0" />
      </Link>
    </div>
  );
}
