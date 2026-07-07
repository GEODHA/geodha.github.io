import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { PLAY_STORE_URL, IOS_APP_URL } from '@/config/appLinks';

const TopBanner = () => {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <div className="relative z-50 bg-gradient-hero text-white py-2.5 px-4 shadow-md">
      <div className="container mx-auto flex items-center justify-center relative">
        <p className="text-xs sm:text-sm text-center pr-8">
          The GEODHA reporting app is now available for Bengaluru!{' '}
          <a
            href={PLAY_STORE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold underline underline-offset-2 hover:opacity-90"
          >
            Get it on Google Play
          </a>
          {' '}·{' '}
          <a
            href={IOS_APP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold underline underline-offset-2 hover:opacity-90"
          >
            iOS Beta
          </a>
        </p>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsVisible(false)}
          className="absolute right-0 h-6 w-6 text-white hover:bg-white/20 hover:text-white"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default TopBanner;
