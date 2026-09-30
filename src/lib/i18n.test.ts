import { describe, expect, it } from 'vitest';
import { copyFieldLabels } from '../features/copy/records';
import { nextFocus } from '../features/dashboard/coach';
import { greeting } from '../features/dashboard/stats';
import { DOC_INFO, encodingFieldLabels } from '../features/encoding/documents';
import { ENCODING_RULES } from '../features/encoding/rules';
import { NUMPAD_MODES } from '../features/numpad/entries';
import { beltStatus } from './belts';
import { hintOf } from './fieldScoring';
import { HELP, helpFor } from './glossary';
import { langOf, translator } from './i18n';
import { backupStatusText, dailyGoalText } from './reminders';
import { defaultData, isAppData } from './storage';
import { KPH_LEVELS } from './targets';

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

  it('the practices: field names, explanations, KPH levels and number types have English', () => {
    expect(copyFieldLabels('en').birthDate).toBe('Date of Birth');
    expect(copyFieldLabels().birthDate).toBe('Date of Birth (Petsa ng kapanganakan)');
    expect(encodingFieldLabels('en').total).toBe('Total Amount');
    const total = DOC_INFO.invoice.fields.find((f) => f.key === 'total')!;
    expect(hintOf(total, 'en')).toBe('no ₱ or commas');
    expect(hintOf(total, 'tl')).toBe('walang ₱ at comma');
    // A hint that is only a format stays the same in both languages.
    expect(hintOf(DOC_INFO.invoice.fields[1], 'en')).toBe('mm/dd/yyyy');
    for (const key of Object.keys(HELP) as (keyof typeof HELP)[]) {
      expect(helpFor('en')[key]).not.toBe(HELP[key]);
      expect(helpFor('en')[key].length).toBeGreaterThan(20);
    }
    expect(KPH_LEVELS.every((l) => l.en.label && l.en.description)).toBe(true);
    expect(ENCODING_RULES.every((r) => r.en.what && r.en.rule)).toBe(true);
    expect(NUMPAD_MODES.mixed.en.label).toBe('Mixed (like the Assessment)');
  });
});
