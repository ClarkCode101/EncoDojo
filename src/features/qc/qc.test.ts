import { describe, expect, it } from 'vitest';
import { makeRng } from '../../lib/random';
import { makeRecord, type FieldKey } from '../copy/records';
import { QC_FIELDS, addMistake, makeQcItem, type QcItem } from './qcItems';
import { buildQcSession, isFalseAlarm, scoreQc } from './scoreQc';

describe('makeQcItem', () => {
  it('changes exactly the fields listed in `errors` (0 to 2 of them)', () => {
    for (let seed = 1; seed <= 500; seed++) {
      const item = makeQcItem(makeRng(seed));
      expect(item.errors.length).toBeLessThanOrEqual(2);
      for (const { key } of QC_FIELDS) {
        const changed = item.original[key].trim() !== item.encoded[key].trim();
        expect(changed).toBe(item.errors.includes(key));
      }
    }
  });

  it('about 30% of records have no mistake', () => {
    let clean = 0;
    for (let seed = 1; seed <= 1000; seed++) if (makeQcItem(makeRng(seed)).errors.length === 0) clean++;
    expect(clean).toBeGreaterThan(220);
    expect(clean).toBeLessThan(380);
  });

  it('is the same for the same seed', () => {
    expect(makeQcItem(makeRng(42))).toEqual(makeQcItem(makeRng(42)));
  });
});

describe('addMistake', () => {
  it('always makes a small, visible change', () => {
    const rng = makeRng(7);
    for (let n = 0; n < 300; n++) {
      const record = makeRecord(rng);
      for (const { key } of QC_FIELDS) {
        const changed = addMistake(record[key], key, rng);
        expect(changed.trim()).not.toBe(record[key].trim());
        // A typo, not a different value: the length changes by at most 1.
        expect(Math.abs(changed.length - record[key].length)).toBeLessThanOrEqual(1);
      }
    }
  });

  it('numbers only get digit mistakes (no letters appear)', () => {
    const rng = makeRng(9);
    for (let n = 0; n < 200; n++) {
      const changed = addMistake('(043) 000-4098', 'contactNo', rng);
      expect(changed).toMatch(/^\(\d{3}\) \d{3}-\d{4}$/);
    }
  });
});

const item = (errors: FieldKey[]): QcItem => {
  const original = { name: 'Ma. Luisa Cabrera', birthDate: '06/09/1983', address: 'Purok 8, Brgy. Centro', contactNo: '(043) 000-4098', idNo: 'ED-2023-18788-O' };
  const encoded = { ...original };
  for (const k of errors) encoded[k] = `${original[k]}x`;
  return { original, encoded, errors };
};

describe('scoreQc', () => {
  it('counts correct decisions, caught, missed and false alarms', () => {
    const { metrics, mistakes } = scoreQc(
      [
        { item: item(['name']), flagged: ['name'] }, // perfect
        { item: item(['address', 'idNo']), flagged: ['address'] }, // missed idNo
        { item: item([]), flagged: ['birthDate'] }, // false alarm
      ],
      60,
    );
    expect(metrics.records).toBe(3);
    expect(metrics.correctRecords).toBe(1);
    expect(metrics.decisions).toBe(15);
    expect(metrics.correctDecisions).toBe(13);
    expect(metrics.decisionAccuracy).toBeCloseTo((13 / 15) * 100);
    expect(metrics.errorsTotal).toBe(3);
    expect(metrics.caught).toBe(2);
    expect(metrics.missed).toBe(1);
    expect(metrics.falseAlarms).toBe(1);
    expect(metrics.perMinute).toBe(3);
    expect(mistakes).toHaveLength(2);
    expect(isFalseAlarm(mistakes[0])).toBe(false); // the missed idNo
    expect(mistakes[0]).toMatchObject({ field: 'idNo', index: 2 });
    expect(isFalseAlarm(mistakes[1])).toBe(true); // birthDate was right
  });

  it('flagging nothing is not a good score', () => {
    const { metrics } = scoreQc([{ item: item(['name', 'address']), flagged: [] }], 30);
    expect(metrics.decisionAccuracy).toBe(60);
    expect(metrics.correctRecords).toBe(0);
  });

  it('nothing checked: 0% and 0 per minute, never NaN', () => {
    const { metrics } = scoreQc([], 0);
    expect(metrics.decisionAccuracy).toBe(0);
    expect(metrics.perMinute).toBe(0);
  });

  it('builds a qc session', () => {
    const s = buildQcSession([{ item: item(['name']), flagged: ['name'] }], 60, 120);
    expect(s.type).toBe('qc');
    expect(s.metrics.seconds).toBe(120);
    expect(s.durationSec).toBe(60);
  });
});
