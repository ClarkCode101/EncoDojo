/**
 * Two languages (owner's decision 2026-09-30): Taglish (the default) and English,
 * picked in Settings ("Wika / Language") or once on Home.
 *
 * No library and no list of keys: both texts sit side by side where they are
 * used, so the code stays easy to read and change:
 *
 *   const t = useT();
 *   <Button>{t('Simulan', 'Start')}</Button>
 *
 * Pure functions (Sensei's lines, the coach, the Assessment comments) take a
 * `lang` and use `translator(lang)` the same way.
 */
import type { Settings } from './storage';
import { useAppData } from './useAppData';

export type Lang = 'tl' | 'en';

/**
 * The language in the settings. Missing = Taglish. The older "English lang" setting
 * (English labels in tests) was replaced by this one, so it counts as English.
 */
export function langOf(settings: Settings): Lang {
  if (settings.language) return settings.language;
  return settings.englishOnly ? 'en' : 'tl';
}

/** The current language (React). */
export function useLang(): Lang {
  return langOf(useAppData().settings);
}

/** Picks the text of a language: t('Simulan', 'Start'). */
export type T = (tl: string, en: string) => string;

export const translator =
  (lang: Lang): T =>
  (tl, en) =>
    lang === 'en' ? en : tl;

/** `t` for the current language (React). */
export function useT(): T {
  return translator(useLang());
}

/** For dates and numbers: Filipino or English (Philippines). */
export const localeOf = (lang: Lang) => (lang === 'en' ? 'en-PH' : 'fil-PH');
