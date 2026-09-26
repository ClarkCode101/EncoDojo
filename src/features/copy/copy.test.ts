import { describe, expect, it } from 'vitest';
import { display } from '../../lib/scoring';
import { makeRng } from '../../lib/random';
import { FIELDS, emptyRecord, idNumber, makeRecord, type CopyRecord } from './records';
import { fieldErrors, isFieldCorrect, scoreCopy } from './scoreCopy';

const record: CopyRecord = {
  name: 'Ma. Kristina B. Dela Cruz',
  birthDate: '04/15/1998',
  address: 'Blk 7 Lot 22, Brgy. San Roque, Tanauan City, Batangas',
  idNo: 'ED-2026-04517-K',
};

describe('makeRecord', () => {
  it('fills every field with keyboard-typeable text', () => {
    const rng = makeRng(4);
    for (let i = 0; i < 100; i++) {
      const r = makeRecord(rng);
      for (const { key } of FIELDS) {
        expect(r[key]).toMatch(/^[\x20-\x7E]+$/);
        expect(r[key]).toBe(r[key].trim());
      }
      expect(r.birthDate).toMatch(/^\d{2}\/\d{2}\/\d{4}$/);
    }
  });

  it('uses the made-up ID pattern', () => {
    const rng = makeRng(9);
    for (let i = 0; i < 50; i++) expect(idNumber(rng)).toMatch(/^ED-20(19|2[0-6])-\d{5}-[A-Z]$/);
  });

  it('is the same for the same seed', () => {
    expect(makeRecord(makeRng(3))).toEqual(makeRecord(makeRng(3)));
  });
});

describe('isFieldCorrect', () => {
  it('needs an exact match', () => {
    expect(isFieldCorrect('Dela Cruz', 'Dela Cruz')).toBe(true);
    expect(isFieldCorrect('Dela Cruz', 'dela Cruz')).toBe(false); // capital letters matter
    expect(isFieldCorrect('Dela Cruz', 'De la Cruz')).toBe(false); // spacing matters
    expect(isFieldCorrect('Brgy. San Roque', 'Brgy San Roque')).toBe(false); // punctuation matters
  });

  it('ignores invisible spaces at the start or end', () => {
    expect(isFieldCorrect('Dela Cruz', '  Dela Cruz ')).toBe(true);
  });
});

describe('fieldErrors', () => {
  it('counts wrong, extra, and missing characters', () => {
    expect(fieldErrors('04/15/1998', '04/15/1998')).toBe(0);
    expect(fieldErrors('04/15/1998', '04/16/1998')).toBe(1); // wrong
    expect(fieldErrors('04/15/1998', '04/15/19988')).toBe(1); // extra
    expect(fieldErrors('04/15/1998', '04/15/199')).toBe(1); // missing at the end
    expect(fieldErrors('04/15/1998', '')).toBe(10); // left empty
  });
});

describe('scoreCopy', () => {
  it('a perfect record: all fields correct, no mistakes', () => {
    const { metrics, mistakes } = scoreCopy([{ expected: record, typed: { ...record } }], null, 60);
    expect(metrics).toMatchObject({ records: 1, correctFields: 4, totalFields: 4, fieldAccuracy: 100, errors: 0 });
    expect(mistakes).toEqual([]);
  });

  it('one typo makes that field wrong and is listed as a mistake', () => {
    const typed = { ...record, address: record.address.replace('Roque', 'Roqeu') };
    const { metrics, mistakes } = scoreCopy([{ expected: record, typed }], null, 60);
    expect(metrics.correctFields).toBe(3);
    expect(display(metrics.fieldAccuracy)).toBe(75);
    expect(metrics.errors).toBe(2); // "eu" instead of "ue" = 2 wrong characters
    expect(mistakes).toEqual([{ expected: record.address, typed: typed.address, index: 1, field: 'address' }]);
  });

  it('speed: counts typed characters (incl. the unfinished record); mistakes only from submitted', () => {
    const chars = FIELDS.reduce((sum, f) => sum + record[f.key].length, 0);
    const unfinished = { ...emptyRecord(), name: 'Juan' };
    const { metrics } = scoreCopy([{ expected: record, typed: { ...record } }], unfinished, 60);
    expect(metrics.typedChars).toBe(chars + 4);
    expect(metrics.grossWpm).toBeCloseTo((chars + 4) / 5);
    expect(metrics.netWpm).toBeCloseTo(metrics.grossWpm); // no mistakes in submitted records
  });

  it('nothing submitted: 0 fields, accuracy treated as 100 (nothing wrong yet)', () => {
    const { metrics } = scoreCopy([], null, 60);
    expect(metrics).toMatchObject({ records: 0, totalFields: 0, fieldAccuracy: 100, grossWpm: 0 });
  });
});
