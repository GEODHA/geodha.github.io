// Lightweight typed i18n — no external dependencies.
// Usage: const { t, locale, setLocale } = useI18n();  →  t.nav.home
// Adding a language: create <code>.ts exporting a Dict, add to DICTS + LOCALES.
// (If the site ever needs plurals/interpolation at scale, migrate to
// react-i18next — the locale files are already shaped like its resources.)

/* eslint-disable react-refresh/only-export-components */

import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { en } from './en';
import { kn } from './kn';
import { trackEvent } from '@/lib/analytics';

export type Dict = typeof en;
export type Locale = 'en' | 'kn';

const DICTS: Record<Locale, Dict> = { en, kn };

export const LOCALES: { code: Locale; label: string }[] = [
  { code: 'en', label: 'English' },
  { code: 'kn', label: 'ಕನ್ನಡ' },
];

const STORAGE_KEY = 'geodha-locale';

interface I18nCtx {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: Dict;
}

const I18nContext = createContext<I18nCtx>({ locale: 'en', setLocale: () => {}, t: en });

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as Locale | null;
      return saved && saved in DICTS ? saved : 'en';
    } catch {
      return 'en';
    }
  });

  const setLocale = (l: Locale) => {
    setLocaleState(l);
    try { localStorage.setItem(STORAGE_KEY, l); } catch { /* private mode */ }
    trackEvent('language_change', { lang: l });
  };

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  return (
    <I18nContext.Provider value={{ locale, setLocale, t: DICTS[locale] }}>
      {children}
    </I18nContext.Provider>
  );
}

export const useI18n = () => useContext(I18nContext);
