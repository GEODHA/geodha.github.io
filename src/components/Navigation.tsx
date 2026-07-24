import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, ChevronDown, Languages, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import logoSvg from '@/assets/LOGO_SVG.svg';
import { useI18n, LOCALES } from '@/i18n';

const Navigation = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;
  const { t, locale, setLocale } = useI18n();

  const navigationItems = [
    { path: '/',          label: t.nav.home },
    { path: '/dashboard', label: t.nav.dashboard },
    { path: '/blog',      label: t.nav.blog },
    { path: '/about',     label: t.nav.about },
  ];

  const handleNavigation = (path: string) => {
    setIsMobileMenuOpen(false);
    navigate(path);
    window.scrollTo(0, 0);
  };

  return (
    <nav className="sticky top-0 z-[2000] w-full bg-paper border-b-[3px] border-ink">
      <div className="container flex h-16 items-center gap-1 sm:gap-4">
        {/* Logo */}
        <Link to="/" className="flex items-center shrink-0 group" onClick={() => window.scrollTo(0, 0)}>
          <img
            src={logoSvg}
            alt="GEODHA"
            className="h-9 w-auto object-contain transition-transform duration-200 group-hover:scale-105"
            loading="eager"
            decoding="sync"
          />
        </Link>

        {/* City & Language selectors */}
        <div className="flex items-center gap-0.5 sm:gap-1 ml-1 min-w-0">
          {/* City selector */}
          <div className="relative group min-w-0">
            <button className="flex items-center gap-1 text-xs sm:text-sm font-bold text-foreground/70 hover:text-foreground px-1.5 sm:px-2 py-1 rounded transition-colors">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{t.nav.city}</span>
              <ChevronDown className="h-3 w-3 shrink-0" />
            </button>
            <div className="absolute top-full left-0 mt-2 w-52 rounded-xl border-2 border-ink bg-paper opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 z-50" style={{ boxShadow: 'var(--shadow-offset-3)' }}>
              <div className="p-2">
                <div className="px-3 py-2 text-sm font-bold rounded-lg bg-tint-green">{t.nav.city}</div>
                <a
                  href="https://forms.gle/K3GGQdBe5k2uH44f7"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                >
                  {t.nav.otherCities}
                </a>
              </div>
            </div>
          </div>

          <div className="w-px h-4 bg-border" />

          {/* Language selector — functional (English / ಕನ್ನಡ) */}
          <div className="relative group shrink-0">
            <button className="flex items-center gap-1.5 text-sm font-bold text-foreground/70 hover:text-foreground px-1.5 sm:px-2 py-1 rounded transition-colors" aria-label={t.nav.language}>
              <Languages className="h-4 w-4" />
              <span className="hidden sm:inline text-xs font-mono font-bold uppercase">{locale}</span>
              <ChevronDown className="h-3 w-3" />
            </button>
            <div className="absolute top-full right-0 mt-2 w-44 rounded-xl border-2 border-ink bg-paper opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 z-50" style={{ boxShadow: 'var(--shadow-offset-3)' }}>
              <div className="p-2">
                {LOCALES.map((l) => (
                  <button
                    key={l.code}
                    onClick={() => setLocale(l.code)}
                    className={cn(
                      'w-full text-left px-3 py-2 text-sm rounded-lg transition-colors',
                      locale === l.code
                        ? 'font-bold bg-tint-green'
                        : 'font-medium text-muted-foreground hover:text-foreground hover:bg-muted'
                    )}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Desktop nav links */}
        <div className="hidden md:flex items-center gap-1 flex-1 justify-center">
          {navigationItems.map((item) => (
            <button
              key={item.path}
              onClick={() => handleNavigation(item.path)}
              className={cn(
                'px-4 py-1.5 text-sm font-bold rounded-full transition-colors border-2',
                currentPath === item.path
                  ? 'border-ink bg-tint-green text-foreground'
                  : 'border-transparent text-foreground/70 hover:text-foreground hover:bg-muted'
              )}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* CTA — yellow poster pill, desktop only */}
        <div className="hidden md:flex items-center ml-auto">
          <button
            onClick={() => handleNavigation('/report')}
            className="px-5 py-2 text-sm font-extrabold rounded-full border-[2.5px] border-ink bg-secondary text-secondary-foreground transition-transform active:translate-x-[2px] active:translate-y-[2px]"
            style={{ boxShadow: 'var(--shadow-offset-3)' }}
          >
            {t.common.submitReport}
          </button>
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden shrink-0 ml-auto p-1.5 sm:p-2 rounded-lg border-2 border-ink text-foreground"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t-2 border-ink bg-paper">
          <div className="container py-4 flex flex-col gap-1">
            {navigationItems.map((item) => (
              <button
                key={item.path}
                onClick={() => handleNavigation(item.path)}
                className={cn(
                  'text-left px-4 py-3 rounded-xl text-sm font-bold transition-colors',
                  currentPath === item.path
                    ? 'bg-tint-green border-2 border-ink'
                    : 'text-foreground/70 hover:text-foreground hover:bg-muted'
                )}
              >
                {item.label}
              </button>
            ))}
            <button
              onClick={() => handleNavigation('/report')}
              className="mt-2 px-4 py-3 text-sm font-extrabold rounded-full border-[2.5px] border-ink bg-secondary text-secondary-foreground w-full text-center"
              style={{ boxShadow: 'var(--shadow-offset-3)' }}
            >
              {t.common.submitReport}
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navigation;
