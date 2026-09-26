/**
 * "Ulitin" mode: type your old mistakes again, one at a time, with no timer.
 * - Correct: the item is done.
 * - Wrong: it goes to the END of the line, so you meet it again later.
 * Finishes when every item has been typed correctly (or you stop).
 *
 * Nothing is saved to progress — this is just focused practice.
 */
import { useState } from 'react';
import { Button, Card, EnTl, Kbd } from '../../components/ui';
import { isEntryCorrect } from '../../lib/scoring';
import { isFieldCorrect } from '../copy/scoreCopy';
import { cleanNumpadInput } from '../numpad/entries';

export type RetryItem = {
  /** e.g. "Address" or "Numero" */
  label: string;
  /** Taglish meaning shown beside the label (optional). */
  tl?: string;
  expected: string;
};

export default function RetryRunner({
  kind,
  items,
  onBack,
}: {
  /** numpad: digits only, commas optional. copy: exact text match. */
  kind: 'numpad' | 'copy';
  items: RetryItem[];
  onBack: () => void;
}) {
  const [queue, setQueue] = useState<number[]>(() => items.map((_, i) => i));
  const [misses, setMisses] = useState<number[]>(() => items.map(() => 0));
  const [input, setInput] = useState('');
  const [feedback, setFeedback] = useState<{ ok: boolean; typed: string; expected: string } | null>(null);

  const done = items.length - queue.length;

  function restart() {
    setQueue(items.map((_, i) => i));
    setMisses(items.map(() => 0));
    setInput('');
    setFeedback(null);
  }

  function submit() {
    if (queue.length === 0 || input.trim() === '') return;
    const index = queue[0];
    const { expected } = items[index];
    const ok = kind === 'numpad' ? isEntryCorrect(expected, input) : isFieldCorrect(expected, input);

    setFeedback({ ok, typed: input, expected });
    if (ok) {
      setQueue((q) => q.slice(1));
    } else {
      setMisses((m) => m.map((n, i) => (i === index ? n + 1 : n)));
      setQueue((q) => [...q.slice(1), index]); // try it again later
    }
    setInput('');
  }

  if (queue.length === 0) {
    const firstTry = misses.filter((n) => n === 0).length;
    return (
      <Card>
        <p className="text-2xl text-stone-900">
          🎉 Tapos na! <strong>{firstTry}</strong> sa <strong>{items.length}</strong> ang tama sa unang subok.
        </p>
        <p className="mt-2 text-lg text-stone-700">
          {firstTry === items.length
            ? 'Wala ka nang mali sa mga ito. Ang galing!'
            : 'Ang mga naulit ay mga dapat mong bantayan sa susunod na practice.'}
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Button size="lg" onClick={onBack} autoFocus>
            Bumalik sa Mistake Review
          </Button>
          <Button size="lg" variant="secondary" onClick={restart}>
            Ulitin ulit
          </Button>
        </div>
      </Card>
    );
  }

  const current = items[queue[0]];
  const progress = Math.round((done / items.length) * 100);

  return (
    <Card>
      <div className="mb-4">
        <div className="mb-1 flex justify-between text-base font-semibold text-stone-700">
          <span>
            Natapos: {done} sa {items.length}
          </span>
          {misses[queue[0]] > 0 && <span className="text-amber-800">Inuulit mo ito</span>}
        </div>
        <div className="h-3 rounded-full bg-stone-200" aria-hidden="true">
          <div className="h-3 rounded-full bg-brand-700 transition-all" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="rounded-md border border-stone-200 bg-white px-5 py-6 text-center shadow-paper">
        <div className="text-base font-medium text-stone-600">
          {current.tl ? <EnTl en={current.label} tl={current.tl} /> : current.label}
        </div>
        <div className="mt-2 select-none break-words font-mono text-3xl font-bold text-stone-900">{current.expected}</div>
      </div>

      <form
        className="mx-auto mt-6 max-w-2xl"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <label htmlFor="retry-input" className="mb-2 block text-lg font-bold text-stone-900">
          I-type ulit nang eksakto, tapos pindutin ang <Kbd>Enter</Kbd>
        </label>
        <input
          id="retry-input"
          autoFocus
          type="text"
          inputMode={kind === 'numpad' ? 'decimal' : 'text'}
          autoComplete="off"
          spellCheck={false}
          autoCorrect="off"
          autoCapitalize="off"
          value={input}
          onChange={(e) => setInput(kind === 'numpad' ? cleanNumpadInput(e.target.value) : e.target.value)}
          onPaste={(e) => e.preventDefault()}
          onDrop={(e) => e.preventDefault()}
          className="w-full rounded-xl border-2 border-stone-400 bg-white p-4 text-center font-mono text-2xl focus:border-brand-600 focus:outline-none focus:ring-4 focus:ring-brand-200"
        />
        {kind === 'numpad' && <p className="mt-2 text-center text-stone-600">Hindi kailangan ang comma (,).</p>}
      </form>

      <div role="status" className="mt-4 min-h-16 text-center text-lg">
        {feedback?.ok && <p className="font-bold text-green-800">✓ Tama!</p>}
        {feedback && !feedback.ok && (
          <p className="text-red-800">
            <strong>✗ Mali pa.</strong> Na-type mo: <span className="font-mono">{feedback.typed}</span>
            <br />
            <span className="text-stone-700">Babalik ito mamaya para subukan ulit.</span>
          </p>
        )}
      </div>

      <div className="mt-2 flex justify-end">
        <Button variant="secondary" onClick={onBack}>
          Tumigil at bumalik
        </Button>
      </div>
    </Card>
  );
}
