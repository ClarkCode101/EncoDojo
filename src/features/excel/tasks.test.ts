import { describe, expect, it } from 'vitest';
import { makeRng } from '../../lib/random';
import type { Session } from '../../lib/storage';
import { LESSON_1 } from './lesson1';
import { LESSON_2 } from './lesson2';
import { LESSONS, passedLessons } from './lessons';
import { buildExcelSession, scoreExcel, type TaskResult } from './scoreExcel';
import { isTypingKey, pressKey, type Sheet } from './sheet';
import {
  HEADERS,
  QUIZ_TASKS,
  TASK_LABEL,
  makeQuiz,
  makeTaskSet,
  solutionFrames,
  startTask,
  type ExcelTask,
} from './tasks';
import { HEADERS_2, TASK_LABEL_2, makeQuiz2, makeTaskSet2 } from './tasks2';
import { HEADERS_3, TASK_LABEL_3, makeQuiz3, makeTaskSet3 } from './tasks3';
import { LESSON_3 } from './lesson3';
import { LESSON_4 } from './lesson4';
import { HEADERS_4, TASK_LABEL_4, makeQuiz4, makeTaskSet4 } from './tasks4';
import { HEADERS_5, makeQuiz5, makeTaskSet5 } from './tasks5';
import { LESSON_5, TASK_LABEL_5 } from './lesson5';
import { CONTENT_5 } from './lesson5Content';
import { computeSheet } from './formulaEngine';
import { HEADERS_6, QUOTA, makeQuiz6, makeTable6, makeTaskSet6 } from './tasks6';
import { LESSON_6, TASK_LABEL_6 } from './lesson6';
import { CONTENT_6 } from './lesson6Content';
import { HEADERS_7, NOT_FOUND, makeQuiz7, makeTable7, makeTaskSet7 } from './tasks7';
import { LESSON_7, TASK_LABEL_7 } from './lesson7';
import { CONTENT_7 } from './lesson7Content';
import { HEADERS_8, makeQuiz8, makeTable8, makeTaskSet8, messyName } from './tasks8';
import { LESSON_8, TASK_LABEL_8 } from './lesson8';
import { CONTENT_8 } from './lesson8Content';
import { HEADERS_9, makePeople9, makeQuiz9, makeTaskSet9 } from './tasks9';
import { LESSON_9, TASK_LABEL_9 } from './lesson9';
import { CONTENT_9 } from './lesson9Content';
import { HEADERS_10, makeQuiz10, makeTable10, makeTaskSet10 } from './tasks10';
import { LESSON_10, TASK_LABEL_10 } from './lesson10';
import { CONTENT_10 } from './lesson10Content';
import { HEADERS_11, makeQuiz11, makeTable11, makeTaskSet11 } from './tasks11';
import { LESSON_11, TASK_LABEL_11 } from './lesson11';
import { excelDateText } from './formulaEngine';
import { alignsRight as alignsRight11, cellsForCompute, todayText } from './sheet';
import { alignsRight, countDuplicates, countMatches, displayValue, formatOf } from './sheet';

/** Do a task with its own solution: the final sheet and the command keys it took. */
function solve(s: Sheet, task: ExcelTask): { sheet: Sheet; keys: number } {
  const frames = solutionFrames(s, task);
  const keys = task.solution.filter(
    (step) => ('press' in step && !isTypingKey(step.press)) || 'command' in step,
  ).length;
  return { sheet: frames[frames.length - 1], keys };
}

/** Start each task in turn, check it is not done yet, solve it, check it is done (within maxKeys). */
function runAll(sheet: Sheet, tasks: ExcelTask[], seed: number) {
  for (const task of tasks) {
    sheet = startTask(sheet, task);
    expect(task.check(sheet), `${task.id} already done (seed ${seed})`).toBe(false);
    const { sheet: after, keys } = solve(sheet, task);
    expect(task.check(after), `${task.id} not done by its solution (seed ${seed})`).toBe(true);
    expect(keys, `${task.id} solution uses too many keys`).toBeLessThanOrEqual(task.maxKeys);
    sheet = after;
  }
}

describe('Excel tasks', () => {
  it('the sheet has a header row and 18-26 records; every task kind has a label', () => {
    for (let seed = 1; seed <= 50; seed++) {
      const set = makeTaskSet(makeRng(seed));
      expect(set.sheet.cells[0].slice(0, 5)).toEqual(HEADERS);
      expect(set.lastRow).toBeGreaterThanOrEqual(18);
      expect(set.lastRow).toBeLessThanOrEqual(26);
      expect(Object.keys(set.tasks).sort()).toEqual(Object.keys(TASK_LABEL).sort());
    }
  });

  it('the lesson: the tasks of every topic, in order, start not done and are done by their solution', () => {
    for (let seed = 1; seed <= 200; seed++) {
      const set = makeTaskSet(makeRng(seed));
      runAll(
        set.sheet,
        LESSON_1.flatMap((t) => t.tasks.map((id) => set.tasks[id])),
        seed,
      );
    }
  });

  it('the lesson teaches every task kind once', () => {
    expect(LESSON_1.flatMap((t) => t.tasks).sort()).toEqual(Object.keys(TASK_LABEL).sort());
  });

  it('the Pagsusulit: 6 different tasks (no "go to"), all doable in any order', () => {
    for (let seed = 1; seed <= 300; seed++) {
      const quiz = makeQuiz(makeRng(seed));
      expect(quiz.tasks).toHaveLength(QUIZ_TASKS);
      expect(new Set(quiz.tasks.map((t) => t.id)).size).toBe(QUIZ_TASKS);
      expect(quiz.tasks.some((t) => t.id === 'goto')).toBe(false);
      runAll(quiz.sheet, quiz.tasks, seed);
    }
  });
});

describe('Excel Aralin 2 tasks', () => {
  it('the sheet has a Status column with blank stretches; every task kind has a label', () => {
    const set = makeTaskSet2(makeRng(1));
    expect(set.sheet.cells[0].slice(0, 6)).toEqual(HEADERS_2);
    expect(Object.keys(set.tasks).sort()).toEqual(Object.keys(TASK_LABEL_2).sort());
    expect(LESSON_2.flatMap((t) => t.tasks).sort()).toEqual(Object.keys(TASK_LABEL_2).sort());
  });

  it('the lesson order: every task starts not done and is done by its solution', () => {
    for (let seed = 1; seed <= 200; seed++) {
      const set = makeTaskSet2(makeRng(seed));
      runAll(
        set.sheet,
        LESSON_2.flatMap((t) => t.tasks.map((id) => set.tasks[id])),
        seed,
      );
    }
  });

  it('the Pagsusulit: all 6 kinds, doable in any order', () => {
    for (let seed = 1; seed <= 300; seed++) {
      const quiz = makeQuiz2(makeRng(seed));
      expect(quiz.tasks).toHaveLength(QUIZ_TASKS);
      runAll(quiz.sheet, quiz.tasks, seed);
    }
  });

  it('every ready lesson has content for all its topics', () => {
    for (const l of LESSONS.filter((x) => x.content)) {
      const set = l.content!.makeSet(makeRng(3));
      for (const id of l.content!.topics.flatMap((t) => t.tasks))
        expect(set.tasks[id], `${l.level}: ${id}`).toBeDefined();
    }
  });
});

describe('Excel Aralin 3 tasks', () => {
  it('the payroll sheet: text Emp No. and Account No. keep their zeros; rates are numbers', () => {
    const set = makeTaskSet3(makeRng(1));
    expect(set.sheet.cells[0].slice(0, 5)).toEqual(HEADERS_3);
    expect(set.sheet.cells[1][0]).toMatch(/^00\d{3}$/);
    expect(formatOf(set.sheet, { r: 1, c: 0 }).text).toBe(true);
    expect(alignsRight(set.sheet, { r: 1, c: 4 })).toBe(true);
    expect(displayValue(set.sheet, { r: 1, c: 4 })).not.toContain(',');
    expect(Object.keys(set.tasks).sort()).toEqual(Object.keys(TASK_LABEL_3).sort());
    expect(LESSON_3.flatMap((t) => t.tasks).sort()).toEqual(Object.keys(TASK_LABEL_3).sort());
  });

  it('the lesson order: every task starts not done and is done by its solution', () => {
    for (let seed = 1; seed <= 200; seed++) {
      const set = makeTaskSet3(makeRng(seed));
      runAll(
        set.sheet,
        LESSON_3.flatMap((t) => t.tasks.map((id) => set.tasks[id])),
        seed,
      );
    }
  });

  it('the Pagsusulit: all 6 kinds, doable in any order', () => {
    for (let seed = 1; seed <= 300; seed++) {
      const quiz = makeQuiz3(makeRng(seed));
      expect(quiz.tasks).toHaveLength(QUIZ_TASKS);
      runAll(quiz.sheet, quiz.tasks, seed);
    }
  });

  it('typing the zeros without the apostrophe does NOT finish the task (Excel drops them)', () => {
    const set = makeTaskSet3(makeRng(5));
    const task = set.tasks.leadingZero;
    let s = startTask(set.sheet, task);
    const value = /: (00\d{3})\./.exec(task.text)![1];
    s = pressKey({ ...s, editing: { value, mode: 'enter' } }, { key: 'Enter' });
    expect(task.check(s)).toBe(false);
  });
});

describe('Excel Aralin 4 tasks', () => {
  it('a long sales log with misspelled "Cty" and doubled rows; every task kind has a label', () => {
    for (let seed = 1; seed <= 50; seed++) {
      const set = makeTaskSet4(makeRng(seed));
      expect(set.sheet.cells[0].slice(0, 5)).toEqual(HEADERS_4);
      expect(countMatches(set.sheet, 'Cty')).toBe(4);
      expect(countDuplicates(set.sheet)).toBe(3);
    }
    expect(LESSON_4.flatMap((t) => t.tasks).sort()).toEqual(Object.keys(TASK_LABEL_4).sort());
  });

  it('the lesson order: every task starts not done and is done by its solution', () => {
    for (let seed = 1; seed <= 200; seed++) {
      const set = makeTaskSet4(makeRng(seed));
      runAll(
        set.sheet,
        LESSON_4.flatMap((t) => t.tasks.map((id) => set.tasks[id])),
        seed,
      );
    }
  });

  it('the Pagsusulit: 6 of the 7 kinds, doable in any order', () => {
    for (let seed = 1; seed <= 300; seed++) {
      const quiz = makeQuiz4(makeRng(seed));
      expect(quiz.tasks).toHaveLength(QUIZ_TASKS);
      runAll(quiz.sheet, quiz.tasks, seed);
    }
  });
});

describe('Excel Aralin 5 tasks (formulas, with HyperFormula)', () => {
  it('the order list: Amount empty, a Total row, a Summary block; labels for every task kind', () => {
    const set = makeTaskSet5(makeRng(1));
    expect(set.sheet.cells[0]).toEqual([...HEADERS_5, '']);
    expect(set.sheet.cells[1][3]).toBe('');
    expect(Object.keys(set.tasks).sort()).toEqual(Object.keys(TASK_LABEL_5).sort());
    expect(LESSON_5.flatMap((t) => t.tasks).sort()).toEqual(Object.keys(TASK_LABEL_5).sort());
    expect(CONTENT_5.compute).toBe(computeSheet);
  });

  it('the lesson order: every task starts not done and is done by its solution', () => {
    for (let seed = 1; seed <= 40; seed++) {
      const set = makeTaskSet5(makeRng(seed));
      runAll(
        set.sheet,
        LESSON_5.flatMap((t) => t.tasks.map((id) => set.tasks[id])),
        seed,
      );
    }
  });

  it('the Pagsusulit: all 6 kinds, doable in any order', () => {
    for (let seed = 1; seed <= 60; seed++) {
      const quiz = makeQuiz5(makeRng(seed));
      expect(quiz.tasks).toHaveLength(QUIZ_TASKS);
      runAll(quiz.sheet, quiz.tasks, seed);
    }
  });

  it('a typed number is not accepted: it must be a formula', () => {
    const set = makeTaskSet5(makeRng(3));
    const task = set.tasks.firstFormula;
    const s = startTask(set.sheet, task);
    const answer = String(Number(s.cells[1][1]) * Number(s.cells[1][2]));
    const typed = pressKey({ ...s, editing: { value: answer, mode: 'enter' } }, { key: 'Enter' });
    expect(task.check(typed)).toBe(false);
  });

  it('computeSheet: formulas like Excel, errors, and a missing ")" closed on save', () => {
    expect(computeSheet([['2', '3', '=A1*B1', '=sum(a1:b1)', '=1/0', '=AVE(A1)', 'text']])).toEqual([
      ['2', '3', '6', '5', '#DIV/0!', '#NAME?', 'text'],
    ]);
    const set = makeTaskSet5(makeRng(4));
    const s = pressKey(
      { ...set.sheet, active: { r: 1, c: 3 }, anchor: { r: 1, c: 3 }, editing: { value: '=SUM(B2:B3', mode: 'enter' } },
      { key: 'Enter' },
    );
    expect(s.cells[1][3]).toBe('=SUM(B2:B3)');
  });
});

describe('Excel Aralin 6 tasks (IF, COUNTIF, SUMIF)', () => {
  it('the sales list: 3 branches, both sides of the quota, a Summary block; labels for every task kind', () => {
    for (let seed = 1; seed <= 50; seed++) {
      const { table, branches } = makeTable6(makeRng(seed));
      const agents = table.slice(1);
      expect(table[0]).toEqual(HEADERS_6);
      expect(agents.length).toBeGreaterThanOrEqual(8);
      for (const b of branches) expect(agents.filter((a) => a[1] === b).length).toBeGreaterThanOrEqual(2);
      expect(agents.filter((a) => Number(a[2]) >= QUOTA).length).toBeGreaterThanOrEqual(2);
      expect(agents.filter((a) => Number(a[2]) < QUOTA).length).toBeGreaterThanOrEqual(2);
      expect(table[4][5]).toBe(branches[2]);
    }
    const set = makeTaskSet6(makeRng(1));
    expect(Object.keys(set.tasks).sort()).toEqual(Object.keys(TASK_LABEL_6).sort());
    expect(LESSON_6.flatMap((t) => t.tasks).sort()).toEqual(Object.keys(TASK_LABEL_6).sort());
    expect(CONTENT_6.compute).toBe(computeSheet);
    expect(LESSONS.find((l) => l.level === 6)?.topics).toBe(LESSON_6);
  });

  it('the lesson order: every task starts not done and is done by its solution', () => {
    for (let seed = 1; seed <= 40; seed++) {
      const set = makeTaskSet6(makeRng(seed));
      runAll(
        set.sheet,
        LESSON_6.flatMap((t) => t.tasks.map((id) => set.tasks[id])),
        seed,
      );
    }
  });

  it('the Pagsusulit: all 6 kinds, doable in any order', () => {
    for (let seed = 1; seed <= 60; seed++) {
      const quiz = makeQuiz6(makeRng(seed));
      expect(quiz.tasks).toHaveLength(QUIZ_TASKS);
      runAll(quiz.sheet, quiz.tasks, seed);
    }
  });

  /** Type a formula into the task's start cell and press Enter. */
  const typeAnswer = (set: ReturnType<typeof makeTaskSet6>, id: string, value: string) => {
    const s = startTask(set.sheet, set.tasks[id]);
    return pressKey({ ...s, editing: { value, mode: 'enter' } }, { key: 'Enter' });
  };

  it('IF: ">" instead of ">=" and a typed "Met" are not accepted; lowercase formulas are', () => {
    const set = makeTaskSet6(makeRng(5));
    const task = set.tasks.ifFirst;
    expect(task.check(typeAnswer(set, 'ifFirst', '=IF(C2>20000,"Met","Below")'))).toBe(false);
    expect(task.check(typeAnswer(set, 'ifFirst', 'Met'))).toBe(false);
    expect(task.check(typeAnswer(set, 'ifFirst', '=if(c2>=20000,"met","below")'))).toBe(true);
  });

  it('SUMIF with F5: the branch name typed in instead of F5 is not accepted', () => {
    const set = makeTaskSet6(makeRng(6));
    const s = startTask(set.sheet, set.tasks.sumifCell);
    const last = set.sheet.cells.findIndex((row, r) => r > 0 && row[0] === '');
    const f5 = s.cells[4][5];
    expect(set.tasks.sumifCell.check(typeAnswer(set, 'sumifCell', `=SUMIF(B2:B${last},"${f5}",C2:C${last})`))).toBe(
      false,
    );
    expect(set.tasks.sumifCell.check(typeAnswer(set, 'sumifCell', `=SUMIF(B2:B${last},F5,C2:C${last})`))).toBe(true);
  });
});

describe('Excel Aralin 7 tasks (VLOOKUP, IFERROR, XLOOKUP)', () => {
  it('orders + price list: every code is in the list except the one on badRow (row 4 or lower)', () => {
    for (let seed = 1; seed <= 50; seed++) {
      const { table, list, badRow } = makeTable7(makeRng(seed));
      expect(table[0]).toEqual(HEADERS_7);
      expect(badRow).toBeGreaterThanOrEqual(3);
      table.slice(1).forEach((row, i) => expect(list.has(row[0]), `row ${i + 1}`).toBe(i + 1 !== badRow));
      // The list on the sheet (F:H) is the same as `list`.
      const onSheet = table.slice(1).filter((row) => row[5] !== '');
      expect(onSheet.map((row) => [row[5], [row[6], row[7]]])).toEqual([...list.entries()]);
    }
    const set = makeTaskSet7(makeRng(1));
    expect(Object.keys(set.tasks).sort()).toEqual(Object.keys(TASK_LABEL_7).sort());
    expect(LESSON_7.flatMap((t) => t.tasks).sort()).toEqual(Object.keys(TASK_LABEL_7).sort());
    expect(CONTENT_7.compute).toBe(computeSheet);
  });

  it('the lesson order: every task starts not done and is done by its solution', () => {
    for (let seed = 1; seed <= 40; seed++) {
      const set = makeTaskSet7(makeRng(seed));
      runAll(
        set.sheet,
        LESSON_7.flatMap((t) => t.tasks.map((id) => set.tasks[id])),
        seed,
      );
    }
  });

  it('the Pagsusulit: all 6 kinds, doable in any order', () => {
    for (let seed = 1; seed <= 60; seed++) {
      const quiz = makeQuiz7(makeRng(seed));
      expect(quiz.tasks).toHaveLength(QUIZ_TASKS);
      runAll(quiz.sheet, quiz.tasks, seed);
    }
  });

  /** Type a formula into the task's start cell and press Enter. */
  const typeAnswer = (set: ReturnType<typeof makeTaskSet7>, id: string, value: string) => {
    const s = startTask(set.sheet, set.tasks[id]);
    return pressKey({ ...s, editing: { value, mode: 'enter' } }, { key: 'Enter' });
  };

  it('the price formula must be copy-safe: without $ it is not accepted; lowercase is', () => {
    const set = makeTaskSet7(makeRng(7));
    const L = set.sheet.cells.filter((row, r) => r > 0 && row[5] !== '').length + 1;
    const task = set.tasks.vlookupPrice;
    expect(task.check(typeAnswer(set, 'vlookupPrice', `=VLOOKUP(A2,F2:H${L},3,FALSE)`))).toBe(false);
    expect(task.check(typeAnswer(set, 'vlookupPrice', `=vlookup(a2,$f$2:$h$${L},3,false)`))).toBe(true);
    expect(task.check(typeAnswer(set, 'vlookupPrice', `=VLOOKUP(A2,$F$2:$H$${L},3,0)`))).toBe(true);
  });

  it('"Not found" typed in, or a lookup of a fixed code, is not accepted', () => {
    const set = makeTaskSet7(makeRng(8));
    const s = startTask(set.sheet, set.tasks.iferror);
    const bad = s.active.r + 1;
    expect(set.tasks.iferror.check(typeAnswer(set, 'iferror', `=IFERROR(#N/A,"${NOT_FOUND}")`))).toBe(false);
    expect(set.tasks.xlookupNotFound.check(typeAnswer(set, 'xlookupNotFound', `="${NOT_FOUND}"`))).toBe(false);
    expect(
      set.tasks.xlookupNotFound.check(typeAnswer(set, 'xlookupNotFound', `=XLOOKUP(A${bad},F:F,G:G,"not found")`)),
    ).toBe(true);
  });
});

describe('Excel Aralin 8 tasks (TRIM, PROPER, UPPER, LEFT, RIGHT)', () => {
  it('the messy list: every raw name is messy, refs like "tn-00457"; labels for every task kind', () => {
    for (let seed = 1; seed <= 50; seed++) {
      const table = makeTable8(makeRng(seed));
      expect(table[0]).toEqual(HEADERS_8);
      for (const row of table.slice(1)) {
        const clean = row[0].trim().replace(/ +/g, ' ');
        const proper = clean.replace(/\w\S*/g, (w) => w[0].toUpperCase() + w.slice(1).toLowerCase());
        expect(row[0] === proper, `not messy: "${row[0]}"`).toBe(false);
        expect(clean.length).toBeLessThanOrEqual(21);
        expect(row[2]).toMatch(/^[A-Za-z][a-z]-\d{5}$/);
      }
    }
    expect(messyName(makeRng(1), 'Ana Reyes')).not.toBe('Ana Reyes');
    const set = makeTaskSet8(makeRng(1));
    expect(Object.keys(set.tasks).sort()).toEqual(Object.keys(TASK_LABEL_8).sort());
    expect(LESSON_8.flatMap((t) => t.tasks).sort()).toEqual(Object.keys(TASK_LABEL_8).sort());
    expect(CONTENT_8.compute).toBe(computeSheet);
  });

  it('the lesson order: every task starts not done and is done by its solution', () => {
    for (let seed = 1; seed <= 40; seed++) {
      const set = makeTaskSet8(makeRng(seed));
      runAll(
        set.sheet,
        LESSON_8.flatMap((t) => t.tasks.map((id) => set.tasks[id])),
        seed,
      );
    }
  });

  it('the Pagsusulit: all 6 kinds, doable in any order', () => {
    for (let seed = 1; seed <= 60; seed++) {
      const quiz = makeQuiz8(makeRng(seed));
      expect(quiz.tasks).toHaveLength(QUIZ_TASKS);
      runAll(quiz.sheet, quiz.tasks, seed);
    }
  });

  /** Type a value into the task's start cell and press Enter. */
  const typeAnswer = (set: ReturnType<typeof makeTaskSet8>, id: string, value: string) => {
    const s = startTask(set.sheet, set.tasks[id]);
    return pressKey({ ...s, editing: { value, mode: 'enter' } }, { key: 'Enter' });
  };

  it('the cleaned name typed by hand, or a formula that only works for this row, is not accepted', () => {
    const set = makeTaskSet8(makeRng(9));
    const raw = set.sheet.cells[1][0];
    const clean = raw.trim().replace(/ +/g, ' ');
    expect(set.tasks.trim.check(typeAnswer(set, 'trim', clean))).toBe(false);
    expect(set.tasks.trim.check(typeAnswer(set, 'trim', `=TRIM("${raw}")`))).toBe(false);
    expect(set.tasks.trim.check(typeAnswer(set, 'trim', '=trim(a2)'))).toBe(true);
    expect(set.tasks.proper.check(typeAnswer(set, 'proper', '=PROPER(A2)'))).toBe(false); // spaces left
    expect(set.tasks.right.check(typeAnswer(set, 'right', '=RIGHT(C2,5)'))).toBe(true); // same digits
    expect(set.tasks.left.check(typeAnswer(set, 'left', '=LEFT(D2,3)'))).toBe(false);
  });

  it('text that looks like a number (RIGHT -> 00457) is marked as text, like Excel; numbers are not', () => {
    expect(computeSheet([['=RIGHT("TN-00457",5)', '=5+1', '=UPPER("tn")']])).toEqual([["'00457", '6', 'TN']]);
  });
});

describe('Excel Aralin 9 tasks (Flash Fill, Text to Columns, &, Paste Values)', () => {
  it('the employee list: "Last, First" names that fit; labels for every task kind', () => {
    for (let seed = 1; seed <= 50; seed++) {
      const people = makePeople9(makeRng(seed));
      expect(people.length).toBeGreaterThanOrEqual(8);
      for (const p of people) expect(`${p.last}, ${p.first}`.length).toBeLessThanOrEqual(22);
      expect(new Set(people.map((p) => `${p.last}, ${p.first}`)).size).toBe(people.length);
    }
    const set = makeTaskSet9(makeRng(1));
    expect(set.sheet.cells[0]).toEqual(HEADERS_9);
    expect(set.sheet.compute).toBe(computeSheet);
    expect(Object.keys(set.tasks).sort()).toEqual(Object.keys(TASK_LABEL_9).sort());
    expect(LESSON_9.flatMap((t) => t.tasks).sort()).toEqual(Object.keys(TASK_LABEL_9).sort());
    expect(CONTENT_9.tools).toBe(true);
  });

  it('the lesson order: every task starts not done and is done by its solution', () => {
    for (let seed = 1; seed <= 40; seed++) {
      const set = makeTaskSet9(makeRng(seed));
      runAll(
        set.sheet,
        LESSON_9.flatMap((t) => t.tasks.map((id) => set.tasks[id])),
        seed,
      );
    }
  });

  it('the Pagsusulit: all 6 kinds, doable in any order', () => {
    for (let seed = 1; seed <= 60; seed++) {
      const quiz = makeQuiz9(makeRng(seed));
      expect(quiz.tasks).toHaveLength(QUIZ_TASKS);
      runAll(quiz.sheet, quiz.tasks, seed);
    }
  });

  it('a Name Tag typed by hand is not accepted; a normal paste keeps the formulas (not done)', () => {
    const set = makeTaskSet9(makeRng(4));
    const s = startTask(set.sheet, set.tasks.join);
    const typed = pressKey(
      { ...s, editing: { value: `${s.cells[1][2]} ${s.cells[1][1]}`, mode: 'enter' } },
      { key: 'Enter' },
    );
    expect(set.tasks.join.check(typed)).toBe(false);
    let p = startTask(set.sheet, set.tasks.pasteValues);
    p = pressKey(pressKey(p, { key: 'ArrowDown', ctrl: true, shift: true }), { key: 'c', ctrl: true });
    expect(set.tasks.pasteValues.check(pressKey(p, { key: 'v', ctrl: true }))).toBe(false);
    expect(set.tasks.pasteValues.check(pressKey(p, { key: 'v', ctrl: true, shift: true }))).toBe(true);
  });
});

describe('Excel Aralin 10 tasks (Conditional Formatting, COUNTBLANK, COUNTIFS, SUMIFS, dropdown)', () => {
  it('the collection log: 2 Ref Nos. encoded twice, 4 blank cells, never in Ref No. or the first record', () => {
    for (let seed = 1; seed <= 50; seed++) {
      const { table, duplicateRows } = makeTable10(makeRng(seed));
      const body = table.slice(1);
      expect(table[0]).toEqual(HEADERS_10);
      expect(duplicateRows).toHaveLength(2);
      for (const r of duplicateRows) expect(table.slice(1, r).some((row) => row[0] === table[r][0])).toBe(true);
      expect(body.flatMap((row) => row.slice(0, 5)).filter((v) => v === '')).toHaveLength(4);
      expect(body.every((row) => row[0] !== '')).toBe(true);
      expect(body[0].slice(0, 5).every((v) => v !== '')).toBe(true);
      expect(body.filter((row) => row[4] === '').length).toBe(2);
    }
    const set = makeTaskSet10(makeRng(1));
    expect(Object.keys(set.tasks).sort()).toEqual(Object.keys(TASK_LABEL_10).sort());
    expect(LESSON_10.flatMap((t) => t.tasks).sort()).toEqual(Object.keys(TASK_LABEL_10).sort());
    expect(CONTENT_10.tools).toEqual(['cond', 'validation']);
  });

  it('the lesson order: every task starts not done and is done by its solution', () => {
    for (let seed = 1; seed <= 40; seed++) {
      const set = makeTaskSet10(makeRng(seed));
      runAll(
        set.sheet,
        LESSON_10.flatMap((t) => t.tasks.map((id) => set.tasks[id])),
        seed,
      );
    }
  });

  it('the Pagsusulit: 6 of the 7 kinds, doable in any order', () => {
    for (let seed = 1; seed <= 60; seed++) {
      const quiz = makeQuiz10(makeRng(seed));
      expect(quiz.tasks).toHaveLength(QUIZ_TASKS);
      runAll(quiz.sheet, quiz.tasks, seed);
    }
  });

  it('a count typed by hand is not accepted; the dropdown refuses a value that is not in the list', () => {
    const set = makeTaskSet10(makeRng(5));
    const s = startTask(set.sheet, set.tasks.countBlank);
    expect(
      set.tasks.countBlank.check(pressKey({ ...s, editing: { value: '4', mode: 'enter' } }, { key: 'Enter' })),
    ).toBe(false);
    const d = startTask(set.sheet, set.tasks.useDropdown);
    const refused = pressKey({ ...d, editing: { value: 'Bayad', mode: 'enter' } }, { key: 'Enter' });
    expect(refused.editing?.value).toBe('Bayad');
    expect(refused.alert).toContain('Paid, Unpaid');
    // Typed in small letters: accepted, saved as the list spells it.
    const typed = pressKey({ ...d, editing: { value: 'paid', mode: 'enter' } }, { key: 'Enter' });
    expect(set.tasks.useDropdown.check(typed)).toBe(true);
  });
});

describe('Excel Aralin 11 tasks (dates)', () => {
  it('the invoice list: one blank Date, Due Dates 30 days later, dd/mm Supplier Dates as TEXT (left)', () => {
    for (let seed = 1; seed <= 50; seed++) {
      const { table, blankRow, supplier } = makeTable11(makeRng(seed));
      expect(table[0]).toEqual(HEADERS_11);
      expect(table[blankRow][1]).toBe('');
      expect(blankRow).toBeGreaterThanOrEqual(3);
      expect(supplier.some((d) => d.d > 12) && supplier.some((d) => d.d <= 12)).toBe(true);
    }
    const set = makeTaskSet11(makeRng(2));
    const s = set.sheet;
    expect(alignsRight11(s, { r: 2, c: 1 })).toBe(true); // a real date: right
    expect(alignsRight11(s, { r: 1, c: 5 })).toBe(false); // the supplier's text date: left
    expect(cellsForCompute(s)[1][5].startsWith("'")).toBe(true);
    expect(Object.keys(set.tasks).sort()).toEqual(Object.keys(TASK_LABEL_11).sort());
    expect(LESSON_11.flatMap((t) => t.tasks).sort()).toEqual(Object.keys(TASK_LABEL_11).sort());
  });

  it('the lesson order: every task starts not done and is done by its solution', () => {
    for (let seed = 1; seed <= 40; seed++) {
      const set = makeTaskSet11(makeRng(seed));
      runAll(
        set.sheet,
        LESSON_11.flatMap((t) => t.tasks.map((id) => set.tasks[id])),
        seed,
      );
    }
  });

  it('the Pagsusulit: all 6 kinds, doable in any order', () => {
    for (let seed = 1; seed <= 60; seed++) {
      const quiz = makeQuiz11(makeRng(seed));
      expect(quiz.tasks).toHaveLength(QUIZ_TASKS);
      runAll(quiz.sheet, quiz.tasks, seed);
    }
  });

  /** Type a value into the task's start cell and press Enter. */
  const typeAnswer = (set: ReturnType<typeof makeTaskSet11>, id: string, value: string) => {
    const s = startTask(set.sheet, set.tasks[id]);
    return pressKey({ ...s, editing: { value, mode: 'enter' } }, { key: 'Enter' });
  };

  it('dd/mm typed for the Date, a typed month name, or a fixed date are not accepted', () => {
    const set = makeTaskSet11(makeRng(3));
    const s = startTask(set.sheet, set.tasks.typeDate);
    const target = /: (\w+) (\d+), (\d+)\./.exec(set.tasks.typeDate.text)!;
    const month = new Date(`${target[1]} 1, 2000`).getMonth() + 1;
    const dd = String(target[2]).padStart(2, '0');
    const mm = String(month).padStart(2, '0');
    expect(set.tasks.typeDate.check(typeAnswer(set, 'typeDate', `${dd}/${mm}/${target[3]}`))).toBe(dd === mm);
    expect(set.tasks.typeDate.check(typeAnswer(set, 'typeDate', `${month}/${Number(dd)}/${target[3]}`))).toBe(true);
    expect(s.cells[s.active.r][1]).toBe('');
    const monthName = computeSheet(cellsForCompute(typeAnswer(set, 'textMonth', '=TEXT(B2,"mmmm")')))[1][4];
    expect(set.tasks.textMonth.check(typeAnswer(set, 'textMonth', monthName))).toBe(false);
    expect(set.tasks.fixDate.check(typeAnswer(set, 'fixDate', '=DATE(2026,1,1)'))).toBe(false);
    expect(set.tasks.fixDate.check(typeAnswer(set, 'fixDate', '=date(right(f2,4),mid(f2,4,2),left(f2,2))'))).toBe(true);
  });

  it('formula engine: dates are mm/dd/yyyy; date results show as dates; TEXT knows month and day names', () => {
    expect(
      computeSheet([['08/05/2026', '=A1+30', '=A1+30-A1', '=TEXT(A1,"mmm d, yyyy")', '=TEXT(A1,"dddd")', '=TODAY()']]),
    ).toEqual([['08/05/2026', '09/04/2026', '30', 'Aug 5, 2026', 'Wednesday', todayText()]]);
    expect(excelDateText({ year: 2026, month: 12, day: 3 }, 'dd/mm/yy "ok"')).toBe('03/12/26 ok');
    expect(excelDateText({ year: 2026, month: 12, day: 3 }, '#,##0.00')).toBe('46,359.00'); // the date as a number
    expect(computeSheet([["'05/08/2026", '=ISTEXT(A1)', '=TEXT(1234.5,"#,##0.00")']])).toEqual([
      ['05/08/2026', 'TRUE', '1,234.50'],
    ]);
  });
});

describe('scoreExcel', () => {
  const r = (over: Partial<TaskResult>): TaskResult => ({
    id: 'lastRow',
    tip: 'Ctrl + ↓',
    done: true,
    keys: 1,
    usedMouse: false,
    shortcut: true,
    seconds: 4,
    ...over,
  });

  it('counts done, done with the shortcut, and lists the rest', () => {
    const { metrics, mistakes } = scoreExcel(
      [
        r({}),
        r({ id: 'home', tip: 'Ctrl + Home', keys: 9, shortcut: false, seconds: 10 }),
        r({ id: 'clear', tip: 'Delete', usedMouse: true, shortcut: false, seconds: 7 }),
        r({ id: 'copy', done: false, shortcut: false }),
      ],
      8,
    );
    expect(metrics).toMatchObject({
      tasksTotal: 8,
      tasksDone: 3,
      tasksShortcut: 1,
      taskAccuracy: 37.5,
      shortcutRate: 12.5,
    });
    expect(metrics.avgSeconds).toBeCloseTo(7);
    expect(mistakes.map((m) => m.typed)).toEqual(['9 pindot', 'Gumamit ng mouse', 'Hindi natapos']);
    expect(mistakes[0]).toMatchObject({ expected: 'Ctrl + Home', index: 2, field: 'home' });
  });

  it('nothing done: zeros, never NaN', () => {
    const { metrics } = scoreExcel([], 8);
    expect(metrics).toMatchObject({ tasksDone: 0, taskAccuracy: 0, shortcutRate: 0, avgSeconds: 0 });
  });

  it('builds an excel session; passed = at least 5 of 6 done', () => {
    const s = buildExcelSession([r({})], 6, 30);
    expect(s.type).toBe('excel');
    expect(s.metrics).toMatchObject({ level: 1, tasksDone: 1, passed: 0 });
    const five = Array.from({ length: 5 }, () => r({}));
    expect(buildExcelSession([...five, r({ done: false, shortcut: false })], 6, 60).metrics.passed).toBe(1);
  });
});

describe('lessons', () => {
  const round = (taskAccuracy: number, shortcutRate: number, level?: number): Session => ({
    id: `x${taskAccuracy}${shortcutRate}`,
    type: 'excel',
    startedAt: '2026-09-27T01:00:00.000Z',
    durationSec: 60,
    metrics: { taskAccuracy, shortcutRate, ...(level ? { level } : {}) },
    mistakes: [],
  });

  it('a Pagsusulit counts by its own "passed"', () => {
    const quiz = (passed: number): Session => ({
      ...round(50, 0),
      metrics: { taskAccuracy: 50, shortcutRate: 0, passed, level: 1 },
    });
    expect(passedLessons([quiz(0)]).has(1)).toBe(false);
    expect(passedLessons([quiz(1)]).has(1)).toBe(true);
  });

  it('older timed rounds (no "passed"): passed when both targets were reached', () => {
    expect(passedLessons([round(100, 50)]).has(1)).toBe(false);
    expect(passedLessons([round(100, 50), round(87.5, 75)]).has(1)).toBe(true);
    expect(passedLessons([round(100, 100, 2)]).has(2)).toBe(true);
  });
});
