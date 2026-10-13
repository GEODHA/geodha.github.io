// Lightweight typed i18n — no external dependencies.
// Usage: const { t, locale, setLocale } = useI18n();  →  t.nav.home
// Adding a language: create <code>.ts exporting a Dict, add to DICTS + LOCALES.
// (If the site ever needs plurals/interpolation at scale, migrate to
// react-i18next — the locale files are already shaped like its resources.)

/* eslint-disable react-refresh/only-export-components */

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { en } from './en';
import { kn } from './kn';
import { hi } from './hi';
import { trackEvent } from '@/lib/analytics';

export type Dict = typeof en;
export type Locale = 'en' | 'kn' | 'hi';

const DICTS: Record<Locale, Dict> = { en, kn, hi };

export const LOCALES: { code: Locale; label: string }[] = [
  { code: 'en', label: 'English' },
  { code: 'kn', label: 'ಕನ್ನಡ' },
  { code: 'hi', label: 'हिन्दी' },
];

const STORAGE_KEY = 'geodha-locale';

// Pages whose default language differs from English. Applies only while the
// visitor hasn't explicitly picked a language (an explicit pick is persisted
// and always wins).
const PATH_DEFAULT_LOCALES: { prefix: string; locale: Locale }[] = [
  { prefix: '/jalandhar', locale: 'hi' },
];

/** Default locale for a route, ignoring any saved preference. */
export function defaultLocaleForPath(pathname: string): Locale {
  return PATH_DEFAULT_LOCALES.find((d) => pathname.toLowerCase().startsWith(d.prefix))?.locale ?? 'en';
}

function savedLocale(): Locale | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEY) as Locale | null;
    return saved && saved in DICTS ? saved : null;
  } catch {
    return null;
  }
}

interface I18nCtx {
  locale: Locale;
  setLocale: (l: Locale) => void;
  /** Applies a route's default locale unless the visitor picked one explicitly. */
  applyPathDefault: (pathname: string) => void;
  t: Dict;
}

const I18nContext = createContext<I18nCtx>({
  locale: 'en', setLocale: () => {}, applyPathDefault: () => {}, t: en,
});

export function I18nProvider({ children }: { children: ReactNode }) {
  // Read the path directly (the provider sits outside the router) so a direct
  // visit to e.g. /jalandhar renders Hindi on first paint, with no flash.
  const [locale, setLocaleState] = useState<Locale>(
    () => savedLocale() ?? defaultLocaleForPath(window.location.pathname),
  );

  const setLocale = (l: Locale) => {
    setLocaleState(l);
    try { localStorage.setItem(STORAGE_KEY, l); } catch { /* private mode */ }
    trackEvent('language_change', { lang: l });
  };

  const applyPathDefault = useCallback((pathname: string) => {
    if (savedLocale()) return;
    setLocaleState(defaultLocaleForPath(pathname));
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  return (
    <I18nContext.Provider value={{ locale, setLocale, applyPathDefault, t: DICTS[locale] }}>
      {children}
    </I18nContext.Provider>
  );
}

export const useI18n = () => useContext(I18nContext);
