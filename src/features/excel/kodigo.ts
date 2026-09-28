/**
 * The "Kodigo" (cheat sheet, owner's request 2026-09-29): every shortcut and formula taught in
 * the Excel lessons, on one page, to look up again quickly. It is built from the lessons' own
 * `keys` lists, so a new lesson shows up here by itself.
 */
import type { Lesson } from './lessons';

/** Shortcut = keys to press; formula = something typed in a cell; tool = a button or menu of Excel. */
export type KodigoKind = 'shortcut' | 'formula' | 'tool';

export type KodigoItem = {
  keys: string;
  what: string;
  kind: KodigoKind;
  /** The lessons that teach it (a shortcut like Ctrl + D is in several). */
  lessons: number[];
};

const KEY_NAMES = /\b(Ctrl|Shift|Alt|Enter|Tab|Esc|Delete|Home|End|PgDn|PgUp|F2|F5|Space)\b|[↑↓←→]/;

export function kindOf(keys: string): KodigoKind {
  // =SUM(...), & (joining), and references like $F$2:$H$9 or Orders!C2:C9 are typed in a cell.
  if (/^[=&]/.test(keys.trim()) || /[A-Za-z]!|\$[A-Z]+\$\d/.test(keys)) return 'formula';
  if (KEY_NAMES.test(keys)) return 'shortcut';
  return 'tool';
}

/** The ready lessons, each with its items in the lesson's order (an item listed twice in a lesson only once). */
export function kodigoByLesson(lessons: Lesson[]): { level: number; title: string; items: KodigoItem[] }[] {
  return lessons
    .filter((l) => l.topics !== null)
    .map((l) => {
      const taught = l.topics!.flatMap((t) => t.keys);
      const seen = new Set<string>();
      const items: KodigoItem[] = [];
      for (const k of taught) {
        if (seen.has(k.keys)) continue;
        seen.add(k.keys);
        items.push({ keys: k.keys, what: k.what, kind: kindOf(k.keys), lessons: [l.level] });
      }
      return { level: l.level, title: l.title, items };
    });
}

/** Every item of one kind, once (the first lesson's description; all the lessons that teach it). */
export function kodigoOfKind(lessons: Lesson[], kind: KodigoKind): KodigoItem[] {
  const byKeys = new Map<string, KodigoItem>();
  for (const group of kodigoByLesson(lessons)) {
    for (const item of group.items) {
      if (item.kind !== kind) continue;
      const known = byKeys.get(item.keys);
      if (known) known.lessons = [...known.lessons, ...item.lessons];
      else byKeys.set(item.keys, { ...item, lessons: [...item.lessons] });
    }
  }
  return [...byKeys.values()];
}

/** The search: the keys or the description contain every word typed (any capitals, "ctrl+d" = "Ctrl + D"). */
export function matches(item: KodigoItem, query: string): boolean {
  const squash = (t: string) => t.toLowerCase().replace(/\s+/g, '');
  const text = squash(`${item.keys} ${item.what}`);
  return query
    .trim()
    .split(/\s+/)
    .filter((w) => w !== '')
    .every((w) => text.includes(squash(w)));
}
