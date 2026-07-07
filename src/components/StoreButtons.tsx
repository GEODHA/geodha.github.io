// Store download buttons for the GEODHA mobile app (Android + iOS).
// Single source of truth for store URLs: src/config/appLinks.ts.
// TODO(redesign): swap for official Google Play / App Store badge assets.

import { Apple } from 'lucide-react';
import { Button } from '@/components/ui/button';
import androidIcon from '@/assets/icons/android-play.svg';
import { PLAY_STORE_URL, IOS_APP_URL, IOS_IS_TESTFLIGHT } from '@/config/appLinks';
import { trackEvent } from '@/lib/analytics';

interface StoreButtonsProps {
  /** GA event context, e.g. "hero", "footer", "report_page". */
  placement: string;
  className?: string;
}

function open(url: string, store: 'play' | 'ios', placement: string) {
  trackEvent('store_click', { store, placement });
  window.open(url, '_blank', 'noopener,noreferrer');
}

const StoreButtons = ({ placement, className = '' }: StoreButtonsProps) => (
  <div className={`flex flex-col sm:flex-row gap-3 ${className}`}>
    <Button
      variant="default"
      size="lg"
      className="flex-1 sm:flex-none py-4 sm:py-3 bg-black text-white hover:bg-black/90"
      onClick={() => open(PLAY_STORE_URL, 'play', placement)}
      aria-label="Get the GEODHA app on Google Play"
    >
      <img src={androidIcon} alt="" className="h-5 w-5" />
      Get it on Google Play
    </Button>
    <Button
      variant="default"
      size="lg"
      className="flex-1 sm:flex-none py-4 sm:py-3 bg-black text-white hover:bg-black/90"
      onClick={() => open(IOS_APP_URL, 'ios', placement)}
      aria-label={IOS_IS_TESTFLIGHT ? 'Join the GEODHA iOS beta on TestFlight' : 'Download the GEODHA app on the App Store'}
    >
      <Apple className="h-5 w-5" />
      {IOS_IS_TESTFLIGHT ? 'iOS Beta · TestFlight' : 'Download on the App Store'}
    </Button>
  </div>
);

export default StoreButtons;
