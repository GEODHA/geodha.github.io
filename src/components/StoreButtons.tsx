// Store download buttons for the GEODHA mobile app (Android + iOS).
// Street-poster style: black tiles, ink outline, hard offset shadow.
// Single source of truth for store URLs: src/config/appLinks.ts.
// TODO(redesign): swap for official Google Play / App Store badge assets.

import { Apple } from 'lucide-react';
import androidIcon from '@/assets/icons/android-play.svg';
import { PLAY_STORE_URL, IOS_APP_URL } from '@/config/appLinks';
import { trackEvent } from '@/lib/analytics';
import { useI18n } from '@/i18n';

interface StoreButtonsProps {
  /** GA event context, e.g. "hero", "footer", "report_page". */
  placement: string;
  className?: string;
}

function open(url: string, store: 'play' | 'ios', placement: string) {
  trackEvent('store_click', { store, placement });
  window.open(url, '_blank', 'noopener,noreferrer');
}

const tileCls =
  'flex-1 sm:flex-none inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl ' +
  'bg-ink text-white text-sm font-extrabold border-[3px] border-ink ' +
  'transition-transform active:translate-x-[2px] active:translate-y-[2px]';

const StoreButtons = ({ placement, className = '' }: StoreButtonsProps) => {
  const { t } = useI18n();
  return (
    <div className={`flex flex-col sm:flex-row gap-4 ${className}`}>
      <button
        className={tileCls}
        style={{ boxShadow: '4px 4px 0 rgba(22,22,20,0.35)' }}
        onClick={() => open(PLAY_STORE_URL, 'play', placement)}
        aria-label={t.common.playStore}
      >
        <img src={androidIcon} alt="" className="h-5 w-5" />
        {t.common.playStore}
      </button>
      <button
        className={tileCls}
        style={{ boxShadow: '4px 4px 0 rgba(22,22,20,0.35)' }}
        onClick={() => open(IOS_APP_URL, 'ios', placement)}
        aria-label={t.common.iosBeta}
      >
        <Apple className="h-5 w-5" />
        {t.common.iosBeta}
      </button>
    </div>
  );
};

export default StoreButtons;
