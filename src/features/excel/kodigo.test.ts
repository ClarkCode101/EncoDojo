import { describe, expect, it } from 'vitest';
import { kindOf, kodigoByLesson, kodigoOfKind, matches } from './kodigo';
import { LESSONS } from './lessons';

describe('Kodigo (cheat sheet)', () => {
  it('sorts what a lesson teaches into shortcuts, formulas and tools', () => {
    expect(kindOf('Ctrl + Shift + ↓')).toBe('shortcut');
    expect(kindOf('F2')).toBe('shortcut');
    expect(kindOf('↑ ↓ ← →')).toBe('shortcut');
    expect(kindOf('=SUMIF(...)')).toBe('formula');
    expect(kindOf('&')).toBe('formula');
    expect(kindOf('$F$2:$H$9')).toBe('formula');
    expect(kindOf('Orders!C2:C9')).toBe('formula');
    expect(kindOf('Freeze Panes')).toBe('tool');
    expect(kindOf('Text to Columns')).toBe('tool');
  });

  it('has every ready lesson, each with something; nothing twice inside a lesson', () => {
    const groups = kodigoByLesson(LESSONS);
    expect(groups.map((g) => g.level)).toEqual(LESSONS.filter((l) => l.topics).map((l) => l.level));
    for (const g of groups) {
      expect(g.items.length).toBeGreaterThan(0);
      expect(new Set(g.items.map((i) => i.keys)).size).toBe(g.items.length);
    }
  });

  it('by kind: each item once, with every lesson that teaches it; SUM and the common shortcuts are there', () => {
    const shortcuts = kodigoOfKind(LESSONS, 'shortcut');
    const ctrlD = shortcuts.find((i) => i.keys === 'Ctrl + D')!;
    expect(ctrlD.lessons.length).toBeGreaterThan(3);
    expect(new Set(shortcuts.map((i) => i.keys)).size).toBe(shortcuts.length);
    for (const k of ['Ctrl + C', 'Ctrl + V', 'Ctrl + Z', 'Ctrl + F', 'Alt + F5']) {
      expect(shortcuts.map((i) => i.keys)).toContain(k);
    }
    const formulas = kodigoOfKind(LESSONS, 'formula').map((i) => i.keys);
    for (const f of ['=SUM(...)', '=MIN(...)', '=VLOOKUP(...)', '=IF(...)', '=TODAY()']) expect(formulas).toContain(f);
    expect(kodigoOfKind(LESSONS, 'tool').map((i) => i.keys)).toContain('PivotTable');
  });

  it('search: any capitals, spaces do not matter, every word must match', () => {
    const item = { keys: 'Ctrl + D', what: 'kopyahin pababa', kind: 'shortcut' as const, lessons: [2] };
    expect(matches(item, '')).toBe(true);
    expect(matches(item, 'ctrl+d')).toBe(true);
    expect(matches(item, 'KOPYA')).toBe(true);
    expect(matches(item, 'ctrl pababa')).toBe(true);
    expect(matches(item, 'ctrl + e')).toBe(false);
  });
});
