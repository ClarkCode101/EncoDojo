import { describe, expect, it } from 'vitest';
import { makeRng } from '../../lib/random';
import { kodigoByLesson } from './kodigo';
import { LESSONS, lessonTitle, type LessonContent } from './lessons';

/** Every lesson's content: right away, or loaded like the app does (the formula lessons). */
async function contents(): Promise<{ level: number; content: LessonContent }[]> {
  return Promise.all(LESSONS.map(async (l) => ({ level: l.level, content: l.content ?? (await l.load!()) })));
}

describe('Excel lessons in English', () => {
  it('every lesson has an English title and English topics with the same tasks', () => {
    for (const l of LESSONS) {
      expect(lessonTitle(l, 'en'), `lesson ${l.level}`).not.toBe('');
      const tl = l.topics!('tl');
      const en = l.topics!('en');
      expect(en.map((t) => t.tasks)).toEqual(tl.map((t) => t.tasks));
      expect(en.map((t) => t.keys.map((k) => k.keys))).toEqual(tl.map((t) => t.keys.map((k) => k.keys)));
      // Every sentence is translated (a title can stay the same when it is an Excel word, e.g. "Bold").
      tl.forEach((t, i) => t.body.forEach((line, j) => expect(en[i].body[j], `${l.level}: ${line}`).not.toBe(line)));
      expect(Object.keys(l.labels('en')).sort()).toEqual(Object.keys(l.labels('tl')).sort());
    }
  });

  it('the same sheet and tasks in both languages; every task text and hint is translated', async () => {
    for (const { level, content } of await contents()) {
      for (const seed of [1, 7, 42]) {
        const tl = content.makeSet(makeRng(seed), 'tl');
        const en = content.makeSet(makeRng(seed), 'en');
        expect(en.sheet.cells, `lesson ${level}`).toEqual(tl.sheet.cells);
        expect(Object.keys(en.tasks).sort()).toEqual(Object.keys(tl.tasks).sort());
        for (const id of Object.keys(tl.tasks)) {
          expect(en.tasks[id].text, `${level}/${id}`).not.toBe(tl.tasks[id].text);
          expect(en.tasks[id].hint, `${level}/${id}`).not.toBe(tl.tasks[id].hint);
          expect(en.tasks[id].solution).toEqual(tl.tasks[id].solution);
        }
        // The quiz picks the same tasks in the same order in both languages.
        const qtl = content.makeQuiz(makeRng(seed), 'tl').tasks.map((t) => t.id);
        expect(content.makeQuiz(makeRng(seed), 'en').tasks.map((t) => t.id)).toEqual(qtl);
      }
    }
  });

  it('the Kodigo has the same items in English', () => {
    const tl = kodigoByLesson(LESSONS, 'tl');
    const en = kodigoByLesson(LESSONS, 'en');
    expect(en.map((g) => g.items.map((i) => i.keys))).toEqual(tl.map((g) => g.items.map((i) => i.keys)));
    expect(en[1].title).toBe('Entering data');
  });
});
