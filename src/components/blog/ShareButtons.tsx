import { useState } from 'react';
import { Check, Link2, Share2 } from 'lucide-react';
import { trackEvent } from '@/lib/analytics';

interface Props {
  url: string;
  title: string;
}

const btn =
  'inline-flex items-center gap-1.5 rounded-lg border-2 border-ink bg-paper px-3 py-1.5 text-sm font-bold transition-colors hover:bg-tint-yellow';

const ShareButtons = ({ url, title }: Props) => {
  const [copied, setCopied] = useState(false);
  const u = encodeURIComponent(url);
  const t = encodeURIComponent(title);

  const links = [
    { name: 'WhatsApp', href: `https://wa.me/?text=${t}%20${u}` },
    { name: 'LinkedIn', href: `https://www.linkedin.com/sharing/share-offsite/?url=${u}` },
    { name: 'X', href: `https://twitter.com/intent/tweet?text=${t}&url=${u}&via=geodha_app` },
    { name: 'Facebook', href: `https://www.facebook.com/sharer/sharer.php?u=${u}` },
  ];

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      trackEvent('blog_share', { method: 'copy', url });
    } catch {
      /* clipboard blocked */
    }
  };

  const canNativeShare = typeof navigator !== 'undefined' && 'share' in navigator;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="mr-1 text-sm font-bold">Share:</span>
      {canNativeShare && (
        <button
          type="button"
          className={btn}
          onClick={() => navigator.share({ title, url }).catch(() => undefined)}
        >
          <Share2 className="h-4 w-4" /> Share
        </button>
      )}
      {links.map((l) => (
        <a
          key={l.name}
          className={btn}
          href={l.href}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackEvent('blog_share', { method: l.name, url })}
        >
          {l.name}
        </a>
      ))}
      <button type="button" className={btn} onClick={copy}>
        {copied ? <Check className="h-4 w-4" /> : <Link2 className="h-4 w-4" />}
        {copied ? 'Copied' : 'Copy link'}
      </button>
    </div>
  );
};

export default ShareButtons;
