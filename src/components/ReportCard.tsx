// Universal report card — photos (before / after), status, size, location
// with copyable coordinates, share and "View on map". Used by the city data
// pages; render inside <ReportDialog> for a modal, or inline.

import { useState } from 'react';
import { Link } from 'react-router-dom';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import {
  X, Copy, Check, Share2, MapPin, ExternalLink, Map as MapIcon, ArrowRight,
  ThumbsUp, Sparkles,
} from 'lucide-react';
import type { Report } from '@/services/reportsService';
import { useI18n } from '@/i18n';
import { trackEvent } from '@/lib/analytics';
import {
  reportLatLng, reportSize, afterPhoto, isCleaned, sizeLabel, categoryLabel,
  statusLabel, toDate, reportColor, DATE_LOCALES,
} from '@/lib/reportFields';

/** Deep link that reopens this report's card on the current page. */
function reportShareUrl(r: Report): string {
  const url = new URL(window.location.pathname, window.location.origin);
  if (r.id) url.searchParams.set('report', r.id);
  return url.toString();
}

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for insecure contexts / older browsers.
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  }
}

function useCopied() {
  const [copied, setCopied] = useState<string | null>(null);
  const copy = async (key: string, text: string) => {
    if (await copyText(text)) {
      setCopied(key);
      setTimeout(() => setCopied((c) => (c === key ? null : c)), 1800);
    }
  };
  return { copied, copy };
}

interface ReportCardProps {
  report: Report;
  onClose?: () => void;
  /** Shown as a "View on map" button when provided. */
  onViewOnMap?: (report: Report) => void;
}

export function ReportCard({ report, onClose, onViewOnMap }: ReportCardProps) {
  const { t, locale } = useI18n();
  const { copied, copy } = useCopied();

  const ll       = reportLatLng(report);
  const size     = reportSize(report);
  const after    = afterPhoto(report);
  const before   = report.status !== 'archived' ? report.photos?.[0] : undefined;
  const reported = toDate(report.createdAt);
  const cleaned  = isCleaned(report) ? toDate(report.resolution?.resolvedAt) : null;
  const fmt      = (d: Date) => d.toLocaleDateString(DATE_LOCALES[locale], { day: 'numeric', month: 'short', year: 'numeric' });

  const address  = report.location?.address;
  const coords   = ll ? `${ll[0].toFixed(6)}, ${ll[1].toFixed(6)}` : null;
  const mapsUrl  = ll ? `https://www.google.com/maps/search/?api=1&query=${ll[0]},${ll[1]}` : null;
  const locationBlock = [address, coords, mapsUrl].filter(Boolean).join('\n');

  const orgCredits = (report.resolution?.attributions ?? (report.resolution?.attribution ? [report.resolution.attribution] : []))
    .map((a) => (a.type === 'organisation' ? a.organisationName : t.report.government));

  const handleShare = async () => {
    const url   = reportShareUrl(report);
    const title = `${t.report.shareTitle}: ${categoryLabel(t, report.category)}`;
    const text  = [title, address, coords].filter(Boolean).join('\n');
    trackEvent('report_share', { report_id: report.id });
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
        return;
      } catch (e) {
        if ((e as Error)?.name === 'AbortError') return;
      }
    }
    copy('share', `${text}\n${url}`);
  };

  return (
    <div className="flex flex-col bg-paper">
      {/* Photos — before / after side by side once cleaned */}
      {(before || after) && (
        <div className={`grid ${after && before ? 'grid-cols-2' : 'grid-cols-1'} gap-0.5 bg-ink`}>
          {before && (
            <figure className="relative">
              <img src={before} alt={t.report.before} className="w-full aspect-[4/3] object-cover bg-muted" loading="lazy" />
              {after && <PhotoTag>{t.report.before}</PhotoTag>}
            </figure>
          )}
          {after && (
            <figure className="relative">
              <img src={after} alt={t.report.after} className="w-full aspect-[4/3] object-cover bg-muted" loading="lazy" />
              <PhotoTag tone="green">{t.report.after}</PhotoTag>
            </figure>
          )}
        </div>
      )}

      <div className="p-4 sm:p-5 space-y-4">
        {/* Title row */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-xl font-extrabold leading-tight" style={{ fontFamily: "'Archivo', sans-serif" }}>
              {categoryLabel(t, report.category)}
            </h2>
            {reported && (
              <p className="mono-label mt-1 !text-[11px]">
                {t.report.reportedOn} · {fmt(reported)}
              </p>
            )}
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="shrink-0 p-1.5 rounded-full border-2 border-ink hover:bg-muted transition-colors"
              aria-label={t.report.close}
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Pills */}
        <div className="flex flex-wrap gap-1.5">
          <span
            className="inline-flex items-center gap-1 text-xs font-bold text-white rounded-full px-2.5 py-1 border-2 border-ink"
            style={{ background: reportColor(report) }}
          >
            {statusLabel(t, report)}
          </span>
          {size && (
            <span className="inline-flex items-center text-xs font-bold rounded-full px-2.5 py-1 border-2 border-ink bg-tint-yellow">
              {sizeLabel(t, size)}
            </span>
          )}
          {report.endorsementCount > 0 && (
            <span className="inline-flex items-center gap-1 text-xs font-bold rounded-full px-2.5 py-1 border-2 border-ink bg-muted">
              <ThumbsUp className="h-3 w-3" /> {report.endorsementCount}
            </span>
          )}
        </div>

        {/* Cleanup info */}
        {isCleaned(report) && (
          <div className="rounded-xl border-2 border-ink bg-tint-green px-3 py-2.5 text-sm space-y-0.5">
            <p className="font-bold flex items-center gap-1.5">
              <Sparkles className="h-4 w-4" />
              {after ? t.report.cleanedOn : t.report.afterPhotoPending}
              {after && cleaned && <span className="font-medium">· {fmt(cleaned)}</span>}
            </p>
            {orgCredits.length > 0 && (
              <p className="text-xs text-foreground/80">{t.report.creditedTo}: {orgCredits.join(', ')}</p>
            )}
          </div>
        )}

        {report.description && (
          <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-line">{report.description}</p>
        )}

        {/* Location — copy-pasteable */}
        <div className="rounded-xl border-2 border-ink p-3 space-y-2">
          {(address || !coords) && (
            <div className="flex items-start gap-2">
              <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="mono-label !text-[10px]">{t.report.location}</p>
                <p className="text-sm font-medium break-words select-all">{address || t.report.locationUnavailable}</p>
              </div>
            </div>
          )}
          {coords && (
            <div className="flex items-center gap-2">
              {!address && <MapPin className="h-4 w-4 shrink-0 self-start mt-0.5" />}
              <div className={`min-w-0 flex-1 ${address ? 'pl-6' : ''}`}>
                <p className="mono-label !text-[10px]">{t.report.coordinates}</p>
                <p className="text-sm font-mono select-all">{coords}</p>
              </div>
              <button
                onClick={() => copy('coords', locationBlock)}
                className="shrink-0 inline-flex items-center gap-1 text-xs font-bold rounded-full border-2 border-ink px-2.5 py-1 hover:bg-muted transition-colors"
              >
                {copied === 'coords' ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copied === 'coords' ? t.report.copied : t.report.copy}
              </button>
            </div>
          )}
          {mapsUrl && (
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-6 inline-flex items-center gap-1 text-xs font-bold underline underline-offset-2"
            >
              {t.report.openInMaps} <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>

        {/* Actions */}
        <div className={`grid gap-2 ${onViewOnMap && ll ? 'grid-cols-2' : 'grid-cols-1'}`}>
          <button
            onClick={handleShare}
            className="inline-flex items-center justify-center gap-1.5 text-sm font-extrabold rounded-full border-[2.5px] border-ink bg-secondary text-secondary-foreground px-4 py-2.5 transition-transform active:translate-x-[2px] active:translate-y-[2px]"
            style={{ boxShadow: 'var(--shadow-offset-3)' }}
          >
            {copied === 'share' ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
            {copied === 'share' ? t.report.copied : t.report.share}
          </button>
          {onViewOnMap && ll && (
            <button
              onClick={() => onViewOnMap(report)}
              className="inline-flex items-center justify-center gap-1.5 text-sm font-extrabold rounded-full border-[2.5px] border-ink bg-paper px-4 py-2.5 transition-transform active:translate-x-[2px] active:translate-y-[2px]"
              style={{ boxShadow: 'var(--shadow-offset-3)' }}
            >
              <MapIcon className="h-4 w-4" /> {t.report.viewOnMap}
            </button>
          )}
        </div>

        <Link
          to="/report"
          className="flex items-center justify-between gap-3 text-sm font-semibold rounded-xl bg-muted px-3 py-2.5 hover:bg-tint-yellow transition-colors"
        >
          {t.report.seenSimilar}
          <ArrowRight className="h-4 w-4 shrink-0" />
        </Link>
      </div>
    </div>
  );
}

function PhotoTag({ children, tone = 'ink' }: { children: React.ReactNode; tone?: 'ink' | 'green' }) {
  return (
    <figcaption
      className={`absolute top-2 left-2 text-[11px] font-extrabold uppercase tracking-wide rounded-full px-2 py-0.5 border-2 border-ink ${
        tone === 'green' ? 'bg-tint-green text-foreground' : 'bg-paper text-foreground'
      }`}
    >
      {children}
    </figcaption>
  );
}

/** Modal wrapper. Sits above the sticky nav (z-2000) and Leaflet panes. */
export function ReportDialog({
  report, onClose, onViewOnMap,
}: {
  report: Report | null;
  onClose: () => void;
  onViewOnMap?: (report: Report) => void;
}) {
  const { t } = useI18n();
  return (
    <DialogPrimitive.Root open={report != null} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-[3000] bg-black/60 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          className="fixed z-[3001] inset-x-0 bottom-0 max-h-[92vh] overflow-y-auto rounded-t-2xl border-t-[3px] border-ink bg-paper
                     sm:inset-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-[min(32rem,calc(100vw-2rem))] sm:rounded-2xl sm:border-[3px]
                     data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:slide-in-from-bottom-8 sm:data-[state=open]:slide-in-from-bottom-0"
          style={{ boxShadow: 'var(--shadow-offset-6)' }}
        >
          {report && (
            <>
              <DialogPrimitive.Title className="sr-only">{categoryLabel(t, report.category)}</DialogPrimitive.Title>
              <ReportCard report={report} onClose={onClose} onViewOnMap={onViewOnMap} />
            </>
          )}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
