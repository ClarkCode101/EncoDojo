import { describe, expect, it } from 'vitest';
import { address, fullName, generateParagraph } from './generatePassage';
import { buildPassage } from './buildPassage';
import { makeRng } from '../../lib/random';
import type { PassageLevel } from '../../data/passages';

const LEVELS: PassageLevel[] = [1, 2, 3];

/** "12,450.75" -> 1245075 centavos */
const toCentavos = (text: string) => Math.round(Number(text.replace(/,/g, '')) * 100);

function many(level: PassageLevel, count = 100, seed = 1): string[] {
  const rng = makeRng(seed);
  return Array.from({ length: count }, () => generateParagraph(rng, level));
}

describe('generateParagraph', () => {
  it('is the same for the same seed', () => {
    for (const level of LEVELS) {
      expect(generateParagraph(makeRng(5), level)).toBe(generateParagraph(makeRng(5), level));
    }
  });

  it('only uses characters found on a normal keyboard, with no double spaces', () => {
    for (const level of LEVELS) {
      for (const text of many(level)) {
        expect(text).toMatch(/^[\x20-\x7E]+$/);
        expect(text).not.toMatch(/ {2}/);
        expect(text.startsWith(' ') || text.endsWith(' ')).toBe(false);
      }
    }
  });

  it('rarely repeats itself', () => {
    for (const level of LEVELS) {
      const texts = many(level, 50);
      expect(new Set(texts).size).toBeGreaterThanOrEqual(45);
    }
  });

  it('writes amounts as PHP with commas and 2 decimals', () => {
    for (const text of many(3)) {
      for (const [, amount] of text.matchAll(/PHP (\S+?)(?=[.;,]?(?: |$))/g)) {
        expect(amount).toMatch(/^\d{1,3}(,\d{3})*\.\d{2}$/);
      }
    }
  });

  it('writes dates as mm/dd/yyyy', () => {
    for (const text of [...many(2), ...many(3)]) {
      for (const [date] of text.matchAll(/\d+\/\d+\/\d+/g)) {
        expect(date).toMatch(/^(0[1-9]|1[0-2])\/(0[1-9]|[12]\d)\/(19|20)\d{2}$/);
      }
    }
  });

  it('makes invoice totals add up', () => {
    const invoices = many(3, 300).filter((t) => t.startsWith('Invoice'));
    expect(invoices.length).toBeGreaterThan(10);
    for (const text of invoices) {
      const amount = String.raw`(\d{1,3}(?:,\d{3})*\.\d{2})`;
      const lineRe = new RegExp(String.raw`(\d+) \D+? @ PHP ${amount} = PHP ${amount}`, 'g');
      const lines = [...text.matchAll(lineRe)];
      let sum = 0;
      for (const [, qty, price, line] of lines) {
        expect(Number(qty) * toCentavos(price)).toBe(toCentavos(line));
        sum += toCentavos(line);
      }
      const total = text.match(/Total amount due: PHP ([\d,.]+)\.$/)![1];
      expect(toCentavos(total)).toBe(sum);
    }
  });

  it('gives invoices a number with the same year as their date', () => {
    for (const text of many(3, 300).filter((t) => t.startsWith('Invoice'))) {
      const [, numberYear, dateYear] = text.match(/SI-(\d{4})-\d+ dated \d\d\/\d\d\/(\d{4})/)!;
      expect(numberYear).toBe(dateYear);
    }
  });

  it('never has a delivery window that ends before it starts', () => {
    const toMinutes = (t: string) => {
      const [, h, m, ap] = t.match(/(\d+):(\d+) (AM|PM)/)!;
      return ((Number(h) % 12) + (ap === 'PM' ? 12 : 0)) * 60 + Number(m);
    };
    for (const text of many(2, 300)) {
      const window = text.match(/between (\d+:\d+ [AP]M) and (\d+:\d+ [AP]M)/);
      if (window) expect(toMinutes(window[2])).toBeGreaterThan(toMinutes(window[1]));
    }
  });

  it('makes payroll net pay add up', () => {
    const payrolls = many(3, 300).filter((t) => t.startsWith('Employee'));
    expect(payrolls.length).toBeGreaterThan(10);
    for (const text of payrolls) {
      const [basic, overtime, deductions, net] = [
        /Basic pay: PHP ([\d,.]+)\./,
        /\): PHP ([\d,.]+)\./,
        /Deductions: PHP ([\d,.]+)\./,
        /Net pay: PHP ([\d,.]+)\.$/,
      ].map((re) => toCentavos(text.match(re)![1]));
      expect(basic + overtime - deductions).toBe(net);
    }
  });
});

describe('fullName / address', () => {
  it('produce Filipino-style quirks across many samples', () => {
    const rng = makeRng(3);
    const names = Array.from({ length: 300 }, () => fullName(rng)).join('\n');
    expect(names).toMatch(/Ma\. /);
    expect(names).toMatch(/ (Jr\.|Sr\.|II|III)$/m);
    expect(names).toMatch(/Dela Cruz|De la Cruz/);

    const addresses = Array.from({ length: 100 }, () => address(rng)).join('\n');
    expect(addresses).toMatch(/Blk \d+ Lot \d+/);
    expect(addresses).toMatch(/Purok \d, Sitio /);
    expect(addresses).toMatch(/Brgy\. /);
  });
});

describe('buildPassage', () => {
  it('gives different passages for different seeds', () => {
    for (const level of LEVELS) {
      expect(buildPassage(makeRng(1), level, 600)).not.toBe(buildPassage(makeRng(2), level, 600));
    }
  });
});
