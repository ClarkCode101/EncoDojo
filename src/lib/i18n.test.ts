import { describe, expect, it } from 'vitest';
import { nextFocus } from '../features/dashboard/coach';
import { greeting } from '../features/dashboard/stats';
import { beltStatus } from './belts';
import { langOf, translator } from './i18n';
import { backupStatusText, dailyGoalText } from './reminders';
import { defaultData, isAppData } from './storage';

describe('two languages (Taglish / English)', () => {
  const settings = defaultData().settings;

  it('Taglish unless English was picked; the old "English lang" counts as English', () => {
    expect(langOf(settings)).toBe('tl');
    expect(langOf({ ...settings, language: 'en' })).toBe('en');
    expect(langOf({ ...settings, englishOnly: true })).toBe('en');
    expect(langOf({ ...settings, englishOnly: true, language: 'tl' })).toBe('tl');
    expect(translator('en')('Simulan', 'Start')).toBe('Start');
    expect(translator('tl')('Simulan', 'Start')).toBe('Simulan');
  });

  it('saved data with a language loads; a wrong language is refused', () => {
    const data = defaultData();
    expect(isAppData({ ...data, settings: { ...data.settings, language: 'en' } })).toBe(true);
    expect(isAppData({ ...data, settings: { ...data.settings, language: 'fr' } })).toBe(false);
  });

  it('the coach, the belt, the reminders and the greeting speak English too', () => {
    expect(nextFocus([], 'en').reason).toBe('Start here.');
    expect(nextFocus([]).reason).toBe('Dito magsimula.');
    expect(beltStatus([], 'en').nextHint).toMatch(/^Take the Assessment and pass \d+ of \d+ targets\.$/);
    expect(backupStatusText(undefined, new Date(), 'en')).toBe("You don't have a backup yet.");
    expect(dailyGoalText(5, 2, 'en')).toBe('Today: 2 of 5 practices.');
    expect(greeting(new Date(2026, 8, 30, 8), 'en')).toBe('Good morning');
  });
});
