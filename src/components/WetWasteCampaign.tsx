// Campaign summary at the top of a ward's Wet waste pickup tab: headline,
// before/after comparison, daily collection chart and "What GEODHA did"
// cards. Figures are fixed (src/config/wardCampaigns.ts); the chart appends
// published day documents after the fixed series ends.

import { useMemo, useState } from 'react';
import {
  Bar, BarChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import type { TooltipContentProps } from 'recharts';
import { ChevronDown } from 'lucide-react';

import type { CampaignComparison, WardCampaign } from '@/config/wardCampaigns';
import type { TruckMapDay } from '@/services/geodhaService';
import { DATE_LOCALES } from '@/lib/reportFields';
import { useI18n } from '@/i18n';
import { cn } from '@/lib/utils';

const ARCHIVO = { fontFamily: "'Archivo', sans-serif" };
const BAR_COLOR = '#166534';
/** Days with fewer residents than this get a "few residents" note in the tooltip. */
const SMALL_DAY = 10;

interface ChartDay { dateKey: string; collected: number; residents: number; pct: number }

const dayDate = (dateKey: string) => new Date(`${dateKey}T00:00:00Z`);
const pctOf = (n: number, of: number) => (of > 0 ? Math.round((n / of) * 100) : 0);

export default function WetWasteCampaign({ campaign, days }: { campaign: WardCampaign; days: TruckMapDay[] }) {
  const { t } = useI18n();
  const c = t.campaign;

  return (
    <section aria-labelledby="campaign-headline">
      <h2 id="campaign-headline" className="text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight" style={ARCHIVO}>
        {c.headline}
      </h2>
      <p className="mt-2 text-base sm:text-lg text-foreground/75">{c.subline}</p>

      <Comparison before={campaign.before} after={campaign.after} />
      <DailyChart campaign={campaign} days={days} />

      <h3 className="mt-10 text-xl sm:text-2xl font-extrabold" style={ARCHIVO}>{c.didTitle}</h3>
      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        {[
          [c.did1Title, c.did1Body, 'bg-tint-blue'],
          [c.did2Title, c.did2Body, 'bg-tint-yellow'],
          [c.did3Title, c.did3Body, 'bg-tint-green'],
        ].map(([title, body, tint], i) => (
          <div key={title} className={cn('rounded-2xl border-[3px] border-ink p-4', tint)} style={{ boxShadow: 'var(--shadow-offset-3)' }}>
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-ink text-paper text-sm font-extrabold">{i + 1}</span>
            <p className="mt-2 font-extrabold leading-tight">{title}</p>
            <p className="mt-1.5 text-sm leading-relaxed text-foreground/80">{body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

// ── Before / after ───────────────────────────────────────────────────────────

function Comparison({ before, after }: { before: CampaignComparison; after: CampaignComparison }) {
  const { t, locale } = useI18n();
  const c = t.campaign;
  const fmt = (n: number) => n.toLocaleString(DATE_LOCALES[locale]);

  const rows: { label: string; value: (p: CampaignComparison) => React.ReactNode; emphasis?: boolean }[] = [
    { label: c.rowResidents, value: (p) => fmt(p.residents) },
    { label: c.rowCheckins,  value: (p) => fmt(p.checkins) },
    {
      label: c.rowCollected,
      emphasis: true,
      value: (p) => (
        <>
          <span className="block text-3xl sm:text-4xl font-extrabold tabular-nums leading-none" style={ARCHIVO}>{pctOf(p.collected, p.reports)}%</span>
          <span className="block mt-1 text-xs font-medium text-foreground/70">{c.ofReports(p.collected, p.reports)}</span>
        </>
      ),
    },
    { label: c.rowLongMissed, value: (p) => fmt(p.longMissed) },
    { label: c.rowLongest,    value: (p) => c.days(p.longestGap) },
    { label: c.rowFullDays,   value: (p) => c.nOfM(p.fullDays, p.totalDays) },
    {
      label: c.rowComplaints,
      value: (p) => (p.complaintsClosed != null ? c.complaintsClosed(p.complaints, p.complaintsClosed) : fmt(p.complaints)),
    },
  ];

  const cols = [
    { title: c.colBefore, dates: c.colBeforeDates, data: before, tint: 'bg-tint-red' },
    { title: c.colAfter,  dates: c.colAfterDates,  data: after,  tint: 'bg-tint-green' },
  ];

  return (
    <>
      {/* Phones: two stacked cards with the same rows */}
      <div className="mt-5 grid gap-3 sm:hidden">
        {cols.map((col) => (
          <div key={col.title} className="rounded-2xl border-[3px] border-ink bg-paper overflow-hidden" style={{ boxShadow: 'var(--shadow-offset-3)' }}>
            <div className={cn('px-4 py-3 border-b-[3px] border-ink', col.tint)}>
              <p className="font-extrabold leading-tight">{col.title}</p>
              <p className="mono-label mt-0.5 !text-[11px]">{col.dates}</p>
            </div>
            <dl className="divide-y divide-ink/10">
              {rows.map((r) => (
                <div key={r.label} className={cn('flex items-center justify-between gap-3 px-4 py-2.5', r.emphasis && col.tint)}>
                  <dt className={cn('text-sm', r.emphasis ? 'font-extrabold' : 'text-foreground/75')}>{r.label}</dt>
                  <dd className="text-right text-sm font-extrabold tabular-nums shrink-0">{r.value(col.data)}</dd>
                </div>
              ))}
            </dl>
          </div>
        ))}
      </div>

      {/* Wider screens: one table */}
      <div className="mt-6 hidden sm:block rounded-2xl border-[3px] border-ink bg-paper overflow-hidden" style={{ boxShadow: 'var(--shadow-offset-4)' }}>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b-[3px] border-ink">
              <th scope="col" className="w-[36%]" />
              {cols.map((col) => (
                <th key={col.title} scope="col" className={cn('w-[32%] px-4 py-3 text-left align-bottom', col.tint)}>
                  <span className="block font-extrabold leading-tight">{col.title}</span>
                  <span className="mono-label mt-0.5 block !text-[11px]">{col.dates}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/10">
            {rows.map((r) => (
              <tr key={r.label} className={cn(r.emphasis && 'bg-tint-green')}>
                <th scope="row" className={cn('px-4 py-3 text-left', r.emphasis ? 'font-extrabold' : 'font-medium text-foreground/75')}>{r.label}</th>
                {cols.map((col) => (
                  <td key={col.title} className="px-4 py-3 font-extrabold tabular-nums">{r.value(col.data)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

// ── Daily chart ──────────────────────────────────────────────────────────────

function DailyChart({ campaign, days }: { campaign: WardCampaign; days: TruckMapDay[] }) {
  const { t, locale } = useI18n();
  const c = t.campaign;
  const dl = DATE_LOCALES[locale];
  const [showData, setShowData] = useState(false);

  const data = useMemo<ChartDay[]>(() => {
    const fixed = campaign.series.map(([dateKey, collected, residents]) => ({ dateKey, collected, residents }));
    // Day documents before the series end were counted slightly differently; the fixed series wins.
    const later = days
      .filter((d) => d.dateKey > campaign.seriesEnd && d.residents > 0)
      .map(({ dateKey, collected, residents }) => ({ dateKey, collected, residents }))
      .sort((a, b) => a.dateKey.localeCompare(b.dateKey));
    return [...fixed, ...later].map((d) => ({ ...d, pct: d.residents > 0 ? (d.collected / d.residents) * 100 : 0 }));
  }, [campaign, days]);

  const fmtShort = (k: string) => dayDate(k).toLocaleDateString(dl, { timeZone: 'UTC', day: 'numeric', month: 'short' });
  const fmtLong  = (k: string) => dayDate(k).toLocaleDateString(dl, { timeZone: 'UTC', weekday: 'short', day: 'numeric', month: 'long' });

  return (
    <div className="mt-8 rounded-2xl border-[3px] border-ink bg-paper p-3 sm:p-5" style={{ boxShadow: 'var(--shadow-offset-4)' }}>
      <h3 id="campaign-chart-title" className="font-extrabold leading-tight px-1">{c.chartTitle}</h3>
      <div className="mt-3 h-60 sm:h-72" role="img" aria-labelledby="campaign-chart-title">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 26, right: 8, left: 0, bottom: 0 }} barCategoryGap="18%">
            <CartesianGrid vertical={false} stroke="#d4d4d4" strokeWidth={0.5} />
            <XAxis
              dataKey="dateKey"
              tickFormatter={fmtShort}
              tick={{ fontSize: 11, fill: '#525252' }}
              tickLine={false}
              axisLine={{ stroke: '#a3a3a3' }}
              interval="preserveStartEnd"
              minTickGap={18}
            />
            <YAxis
              domain={[0, 100]}
              ticks={[0, 25, 50, 75, 100]}
              tickFormatter={(v: number) => `${v}%`}
              tick={{ fontSize: 11, fill: '#525252' }}
              tickLine={false}
              axisLine={false}
              width={40}
            />
            <Tooltip
              cursor={{ fill: 'rgba(0,0,0,0.05)' }}
              content={(props: TooltipContentProps<number, string>) => <ChartTooltip {...props} fmtLong={fmtLong} />}
            />
            <ReferenceLine
              x={campaign.markerDate}
              stroke="#111"
              strokeDasharray="4 3"
              strokeWidth={1.5}
              label={{ value: c.chartMarker, position: 'top', fontSize: 11, fontWeight: 700, fill: '#111' }}
            />
            <Bar dataKey="pct" fill={BAR_COLOR} radius={[2, 2, 0, 0]} isAnimationActive={false} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <button
        onClick={() => setShowData((s) => !s)}
        aria-expanded={showData}
        aria-controls="campaign-chart-data"
        className="mt-2 inline-flex items-center gap-1 px-1 text-sm font-bold underline underline-offset-2"
      >
        {showData ? c.hideData : c.viewData}
        <ChevronDown className={cn('h-4 w-4 transition-transform', showData && 'rotate-180')} />
      </button>
      {showData && (
        <div id="campaign-chart-data" className="mt-2 max-h-72 overflow-y-auto rounded-lg border border-ink/20">
          <table className="w-full text-sm tabular-nums">
            <thead className="sticky top-0 bg-muted">
              <tr>
                <th scope="col" className="px-3 py-2 text-left font-bold">{c.colDate}</th>
                <th scope="col" className="px-3 py-2 text-right font-bold">{c.colCollected}</th>
                <th scope="col" className="px-3 py-2 text-right font-bold">{c.colResidents}</th>
                <th scope="col" className="px-3 py-2 text-right font-bold">{c.colPct}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/10">
              {data.map((d) => (
                <tr key={d.dateKey}>
                  <th scope="row" className="px-3 py-1.5 text-left font-medium">{fmtShort(d.dateKey)}</th>
                  <td className="px-3 py-1.5 text-right">{d.collected}</td>
                  <td className="px-3 py-1.5 text-right">{d.residents}</td>
                  <td className="px-3 py-1.5 text-right font-bold">{Math.round(d.pct)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function ChartTooltip({ active, payload, fmtLong }: TooltipContentProps<number, string> & { fmtLong: (k: string) => string }) {
  const { t } = useI18n();
  const d = payload?.[0]?.payload as ChartDay | undefined;
  if (!active || !d) return null;
  return (
    <div className="rounded-lg border-2 border-ink bg-paper px-3 py-2 text-xs shadow">
      <p className="font-extrabold">{fmtLong(d.dateKey)}</p>
      <p className="mt-0.5">{t.campaign.chartTip(d.collected, d.residents)}</p>
      <p className="font-extrabold" style={{ color: BAR_COLOR }}>{Math.round(d.pct)}%</p>
      {d.residents < SMALL_DAY && <p className="mt-0.5 text-foreground/60">{t.campaign.chartSmall}</p>}
    </div>
  );
}
