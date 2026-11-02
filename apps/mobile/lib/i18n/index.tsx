import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { getLocales } from 'expo-localization';
import { ca as caDate, enGB, es as esDate, type Locale as DateLocale } from 'date-fns/locale';
import en, { type Dictionary } from './en';
import es from './es';
import ca from './ca';
import { getString, KEYS, setString } from '../storage';

export const LOCALES = ['en', 'es', 'ca'] as const;
export type Locale = (typeof LOCALES)[number];
export type LocalePreference = Locale | 'system';

const DICTS: Record<Locale, Dictionary> = { en, es, ca };
const DATE_LOCALES: Record<Locale, DateLocale> = { en: enGB, es: esDate, ca: caDate };

export type TFunction = (key: string, params?: Record<string, string | number>) => string;

/** First supported device language, falling back to English. */
export function detectLocale(): Locale {
  try {
    for (const l of getLocales()) {
      const code = l.languageCode?.toLowerCase();
      if (code && (LOCALES as readonly string[]).includes(code)) return code as Locale;
    }
  } catch {
    // ignore
  }
  return 'en';
}

function lookup(dict: Dictionary, key: string): string | undefined {
  let node: unknown = dict;
  for (const part of key.split('.')) {
    if (node && typeof node === 'object' && part in node) node = (node as Record<string, unknown>)[part];
    else return undefined;
  }
  return typeof node === 'string' ? node : undefined;
}

export function translate(locale: Locale, key: string, params?: Record<string, string | number>): string {
  const template = lookup(DICTS[locale], key) ?? lookup(en, key) ?? key;
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (_, name: string) => (name in params ? String(params[name]) : `{${name}}`));
}

interface I18nValue {
  locale: Locale;
  preference: LocalePreference;
  setPreference: (p: LocalePreference) => void;
  t: TFunction;
  dateLocale: DateLocale;
}

const I18nContext = createContext<I18nValue>({
  locale: 'en',
  preference: 'system',
  setPreference: () => {},
  t: (key, params) => translate('en', key, params),
  dateLocale: enGB,
});

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [preference, setPref] = useState<LocalePreference>('system');

  useEffect(() => {
    void getString(KEYS.locale).then((v) => {
      if (v === 'system' || (LOCALES as readonly string[]).includes(v ?? '')) setPref(v as LocalePreference);
    });
  }, []);

  const locale: Locale = preference === 'system' ? detectLocale() : preference;
  const setPreference = useCallback((p: LocalePreference) => {
    setPref(p);
    void setString(KEYS.locale, p);
  }, []);
  const t = useCallback<TFunction>((key, params) => translate(locale, key, params), [locale]);

  const value = useMemo(() => ({ locale, preference, setPreference, t, dateLocale: DATE_LOCALES[locale] }), [locale, preference, setPreference, t]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export const useI18n = () => useContext(I18nContext);
