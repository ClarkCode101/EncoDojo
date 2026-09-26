/**
 * TEMPORARY testing tools (owner's request, 2026-09-26) — remove when no longer needed.
 *
 * On the Assessment intro (only on `npm run dev` / localhost, never on the
 * live site) you can:
 * - jump straight to any part or break (skipped parts count as 0),
 * - open a sample report (Hindi pa / Halos pasado / Job-ready) with made-up
 *   scores and mistakes,
 * - end the current part at once ("Tapusin agad") during a test run,
 * - preview any belt in the sidebar (does not change your real belt).
 * Test runs are never saved.
 *
 * To remove: delete this file, the lines marked "TEMPORARY (DevJump)" in
 * AssessmentPage.tsx, BeltCard.tsx and useCountdown.ts.
 */
/* eslint-disable react-refresh/only-export-components -- temporary file, kept in one place so it is easy to delete */
import { useSyncExternalStore, type ReactNode } from 'react';
import { BELTS, type BeltRank } from '../../lib/belts';
import type { Session, SessionMistake } from '../../lib/storage';

/** True only in the dev server (`npm run dev`); false in the built site. */
export const DEV_TOOLS = import.meta.env.DEV;

export type JumpTarget = 'typing' | 'break1' | 'numpad' | 'break2' | 'copy' | 'break3' | 'encoding';
export type SamplePreset = 'low' | 'near' | 'ready';
type PartType = 'typing' | 'numpad' | 'copy' | 'encoding';

// ---------- made-up parts ----------

function part(type: PartType, metrics: Record<string, number>, mistakes: SessionMistake[] = []): Session {
  return { id: `test-${type}`, type, startedAt: new Date().toISOString(), durationSec: 60, metrics, mistakes };
}

/** A skipped part: all zeros. */
export function blankPart(type: PartType): Session {
  const zero: Record<PartType, Record<string, number>> = {
    typing: { netWpm: 0, grossWpm: 0, accuracy: 0, keystrokeAccuracy: 0, errors: 0, typedChars: 0 },
    numpad: { kph: 0, entryAccuracy: 0, entries: 0, correctEntries: 0 },
    copy: { kph: 0, netWpm: 0, fieldAccuracy: 0, records: 0, correctFields: 0, totalFields: 0 },
    encoding: { kph: 0, fieldAccuracy: 0, documents: 0, correctFields: 0, totalFields: 0 },
  };
  return part(type, zero[type]);
}

const TYPING_SLIPS: SessionMistake[] = [
  { expected: 'e', typed: 'r', index: 12 },
  { expected: 'S', typed: 's', index: 40 },
  { expected: '.', typed: ',', index: 77 },
  { expected: '4', typed: '5', index: 102 },
];
const NUMPAD_SLIPS: SessionMistake[] = [
  { expected: '1,234.56', typed: '1234.65', index: 3 },
  { expected: '2026004517', typed: '202600451', index: 7 },
];
const COPY_SLIPS: SessionMistake[] = [
  { expected: 'Ma. Luisa Dela Cruz', typed: 'Ma Luisa Dela Cruz', index: 1, field: 'name' },
  { expected: 'Purok 4, Brgy. San Roque, Lipa City, Batangas', typed: 'Purok 4, Brgy San Roque, Lipa City, Batangas', index: 2, field: 'address' },
  { expected: 'Blk 12 Lot 3, Brgy. Mabini, Naga City, Camarines Sur', typed: 'Blk 12 Lot 3, Brgy. Mabini, Naga City', index: 3, field: 'address' },
];
const ENCODING_SLIPS: SessionMistake[] = [
  { expected: '09/14/2026', typed: 'Sept. 14, 2026', index: 1, field: 'date' },
  { expected: '5115.25', typed: '5,115.25', index: 1, field: 'total' },
  { expected: '03/02/2025', typed: '02/03/2025', index: 2, field: 'date' },
];

/** Sample parts for a report preview: about 2/8, 6/8, or 8/8 targets. */
export function samplePreset(preset: SamplePreset): Record<PartType, Session> {
  if (preset === 'low') {
    return {
      typing: part('typing', { netWpm: 28, grossWpm: 33, accuracy: 95, keystrokeAccuracy: 86, errors: 9, typedChars: 190 }, TYPING_SLIPS),
      numpad: part('numpad', { kph: 5200, entryAccuracy: 95, entries: 20, correctEntries: 19 }, NUMPAD_SLIPS.slice(0, 1)),
      copy: part('copy', { kph: 4200, netWpm: 14, fieldAccuracy: 70, records: 2, correctFields: 7, totalFields: 10 }, COPY_SLIPS),
      encoding: part('encoding', { kph: 3100, fieldAccuracy: 60, documents: 1, correctFields: 3, totalFields: 5 }, ENCODING_SLIPS),
    };
  }
  if (preset === 'near') {
    return {
      typing: part('typing', { netWpm: 42, grossWpm: 44, accuracy: 96, keystrokeAccuracy: 94, errors: 3, typedChars: 225 }, TYPING_SLIPS.slice(0, 2)),
      numpad: part('numpad', { kph: 8600, entryAccuracy: 97, entries: 30, correctEntries: 29 }, NUMPAD_SLIPS.slice(0, 1)),
      copy: part('copy', { kph: 8400, netWpm: 28, fieldAccuracy: 90, records: 4, correctFields: 18, totalFields: 20 }, COPY_SLIPS.slice(1)),
      encoding: part('encoding', { kph: 6500, fieldAccuracy: 87, documents: 3, correctFields: 13, totalFields: 15 }, ENCODING_SLIPS.slice(0, 2)),
    };
  }
  return {
    typing: part('typing', { netWpm: 48, grossWpm: 49, accuracy: 98, keystrokeAccuracy: 97, errors: 1, typedChars: 245 }, TYPING_SLIPS.slice(0, 1)),
    numpad: part('numpad', { kph: 10200, entryAccuracy: 100, entries: 36, correctEntries: 36 }),
    copy: part('copy', { kph: 9000, netWpm: 30, fieldAccuracy: 100, records: 5, correctFields: 25, totalFields: 25 }),
    encoding: part('encoding', { kph: 7000, fieldAccuracy: 100, documents: 4, correctFields: 20, totalFields: 20 }),
  };
}

// ---------- "Tapusin agad" ----------

/** Event the timer (useCountdown) listens to in dev: ends the running part now. */
export const DEV_TIME_UP_EVENT = 'encodojo:dev-time-up';

export function DevTimeUpButton() {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event(DEV_TIME_UP_EVENT))}
      className="mb-2 self-start rounded-lg border-2 border-dashed border-amber-400 bg-amber-50 px-3 py-1 text-sm font-semibold text-amber-950 hover:bg-amber-100"
    >
      🧪 ⏭ Tapusin agad ang bahaging ito (test)
    </button>
  );
}

// ---------- belt preview ----------

let beltPreview: BeltRank | null = null;
const listeners = new Set<() => void>();

function setBeltPreview(rank: BeltRank | null) {
  beltPreview = rank;
  listeners.forEach((l) => l());
}

/** The belt to preview in the sidebar, or null for the real one. */
export function useBeltPreview(): BeltRank | null {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => beltPreview,
  );
}

/** Made-up assessments that earn exactly this belt (fed to beltStatus). */
export function previewSessions(rank: BeltRank): Session[] {
  const a = (met: number, day: number): Session => ({
    id: `preview-${met}-${day}`,
    type: 'assessment',
    startedAt: `2026-09-${String(day).padStart(2, '0')}T08:00:00.000Z`,
    durationSec: 420,
    metrics: { targetsMet: met, targetsTotal: 8, jobReady: met === 8 ? 1 : 0 },
    mistakes: [],
  });
  switch (rank) {
    case 'white':
      return [];
    case 'yellow':
      return [a(3, 10)];
    case 'orange':
      return [a(5, 10)];
    case 'green':
      return [a(7, 10)];
    case 'blue':
      return [a(8, 10)];
    case 'black':
      return [a(8, 10), a(8, 12), a(8, 14)];
  }
}

// ---------- the panel ----------

const btn =
  'rounded-lg border-2 border-amber-400 bg-white px-3 py-1.5 text-sm font-semibold text-amber-950 hover:bg-amber-100 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-amber-600';
const btnOn = 'rounded-lg border-2 border-amber-600 bg-amber-400 px-3 py-1.5 text-sm font-semibold text-amber-950';

const JUMPS: { to: JumpTarget; label: string }[] = [
  { to: 'typing', label: 'Bahagi 1' },
  { to: 'break1', label: 'Pahinga 1' },
  { to: 'numpad', label: 'Bahagi 2' },
  { to: 'break2', label: 'Pahinga 2' },
  { to: 'copy', label: 'Bahagi 3' },
  { to: 'break3', label: 'Pahinga 3' },
  { to: 'encoding', label: 'Bahagi 4' },
];

const REPORTS: { preset: SamplePreset; label: string }[] = [
  { preset: 'low', label: 'Hindi pa (2/8)' },
  { preset: 'near', label: 'Halos pasado (6/8)' },
  { preset: 'ready', label: 'Job-ready (8/8)' },
];

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="w-32 text-sm font-semibold text-amber-950">{label}</span>
      {children}
    </div>
  );
}

export function DevJumpPanel({
  onJump,
  onSampleReport,
}: {
  onJump: (to: JumpTarget) => void;
  onSampleReport: (preset: SamplePreset) => void;
}) {
  const belt = useBeltPreview();
  return (
    <section className="rounded-xl border-2 border-dashed border-amber-400 bg-amber-50 px-5 py-4">
      <h2 className="font-bold text-amber-950">🧪 Test lang (localhost lang, tatanggalin)</h2>
      <p className="mb-3 text-sm text-amber-900">
        Hindi ise-save ang mga test run. 0 ang mga nilaktawang bahagi. Sa bawat bahagi may &quot;Tapusin agad&quot; na button.
      </p>
      <div className="space-y-2">
        <Row label="Tumalon sa:">
          {JUMPS.map((j) => (
            <button key={j.to} type="button" className={btn} onClick={() => onJump(j.to)}>
              {j.label}
            </button>
          ))}
        </Row>
        <Row label="Sample na report:">
          {REPORTS.map((r) => (
            <button key={r.preset} type="button" className={btn} onClick={() => onSampleReport(r.preset)}>
              {r.label}
            </button>
          ))}
        </Row>
        <Row label="Belt sa sidebar:">
          <button type="button" className={belt === null ? btnOn : btn} onClick={() => setBeltPreview(null)}>
            Totoo
          </button>
          {BELTS.map((b) => (
            <button key={b.rank} type="button" className={belt === b.rank ? btnOn : btn} onClick={() => setBeltPreview(b.rank)}>
              {b.label.replace(' Belt', '')}
            </button>
          ))}
        </Row>
      </div>
    </section>
  );
}
