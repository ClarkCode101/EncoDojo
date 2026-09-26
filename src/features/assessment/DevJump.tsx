/**
 * TEMPORARY testing tool (owner's request, 2026-09-26) — remove when no longer needed.
 *
 * On the Assessment intro, lets you jump straight to any part (or the report)
 * to test it quickly. Only shown on `npm run dev` (localhost), never on the
 * live site. Skipped parts count as 0, and a test run is NOT saved.
 *
 * To remove: delete this file and the lines marked "TEMPORARY (DevJump)" in
 * AssessmentPage.tsx.
 */
/* eslint-disable react-refresh/only-export-components -- temporary file, kept in one place so it is easy to delete */
import type { Session, SessionType } from '../../lib/storage';

/** True only in the dev server (`npm run dev`); false in the built site. */
export const DEV_TOOLS = import.meta.env.DEV;

export type JumpTarget = 'numpad' | 'copy' | 'encoding' | 'report';

const ZERO_METRICS: Partial<Record<SessionType, Record<string, number>>> = {
  typing: { netWpm: 0, grossWpm: 0, accuracy: 0, keystrokeAccuracy: 0, errors: 0, typedChars: 0 },
  numpad: { kph: 0, entryAccuracy: 0, entries: 0, correctEntries: 0 },
  copy: { kph: 0, netWpm: 0, fieldAccuracy: 0, records: 0, correctFields: 0, totalFields: 0 },
  encoding: { kph: 0, fieldAccuracy: 0, documents: 0, correctFields: 0, totalFields: 0 },
};

/** A skipped part: all zeros. */
export function blankPart(type: 'typing' | 'numpad' | 'copy' | 'encoding'): Session {
  return {
    id: `test-${type}`,
    type,
    startedAt: new Date().toISOString(),
    durationSec: 0,
    metrics: { ...ZERO_METRICS[type] },
    mistakes: [],
  };
}

const TARGETS: { to: JumpTarget; label: string }[] = [
  { to: 'numpad', label: 'Bahagi 2: Numpad' },
  { to: 'copy', label: 'Bahagi 3: Copy Test' },
  { to: 'encoding', label: 'Bahagi 4: Encoding' },
  { to: 'report', label: 'Report' },
];

export function DevJumpPanel({ onJump }: { onJump: (to: JumpTarget) => void }) {
  return (
    <section className="rounded-xl border-2 border-dashed border-amber-400 bg-amber-50 px-5 py-4">
      <h2 className="font-bold text-amber-950">🧪 Test lang: tumalon sa bahagi</h2>
      <p className="mb-3 text-sm text-amber-900">
        Pansamantala at sa localhost lang makikita. 0 ang mga nilaktawang bahagi at hindi ise-save ang resulta.
      </p>
      <div className="flex flex-wrap gap-2">
        {TARGETS.map((t) => (
          <button
            key={t.to}
            type="button"
            onClick={() => onJump(t.to)}
            className="rounded-lg border-2 border-amber-400 bg-white px-3 py-1.5 text-sm font-semibold text-amber-950 hover:bg-amber-100 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-amber-600"
          >
            {t.label}
          </button>
        ))}
      </div>
    </section>
  );
}
