import { SaveBanner, TargetRow } from '../../components/ResultPieces';
import { KeyboardIcon } from '../../components/icons';
import { Button, Card, PageHeader, StatBadge } from '../../components/ui';
import { HELP } from '../../lib/glossary';
import { display } from '../../lib/scoring';
import type { Session, SessionMistake } from '../../lib/storage';
import { JOB_READY_TYPING } from '../../lib/targets';
import { formatClock } from '../../lib/useCountdown';
import { mistakeKind } from '../../lib/alignTyping';
import type { TypingComparison } from './compare';

/** e.g. "↑3 kumpara sa huli · Best: 45" or "Bagong personal best! (dati: 42)". */
function comparisonText(netWpm: number, comparison: TypingComparison): string {
  const { previousNetWpm, bestNetWpm } = comparison;
  if (previousNetWpm === null || bestNetWpm === null) return 'Una mong na-save na practice';

  const now = display(netWpm);
  if (now > display(bestNetWpm)) return `🎉 Bagong personal best! (dati: ${display(bestNetWpm)})`;

  const diff = now - display(previousNetWpm);
  const vsLast =
    diff > 0 ? `↑${diff} kumpara sa huli` : diff < 0 ? `↓${-diff} kumpara sa huli` : 'Pareho sa huli';
  return `${vsLast} · Best: ${display(bestNetWpm)}`;
}

/** Mistake kinds in Taglish for the table. */
const KIND_LABEL: Record<ReturnType<typeof mistakeKind>, string> = {
  'Wrong key': 'Maling letra',
  'Extra key': 'Sobrang letra',
  Skipped: 'Nalaktawan',
};

/** Make spaces visible in the mistakes table. */
function showChar(char: string): string {
  return char === ' ' ? '␣ (space)' : char;
}

/** The list of typing mistakes (also used by the Assessment report). */
export function TypingMistakesCard({ mistakes, errors }: { mistakes: SessionMistake[]; errors: number }) {
  return (
    <Card title={`Mga mali sa typing (${errors})`}>
      {mistakes.length === 0 ? (
        <p className="text-lg text-stone-700">Walang mali. Ang galing! 👏</p>
      ) : (
        <div className="max-h-96 overflow-y-auto">
          <table className="w-full text-left text-base">
            <thead className="sticky top-0 bg-white text-stone-600">
              <tr>
                <th className="py-2 pr-4 font-semibold">Puwesto</th>
                <th className="py-2 pr-4 font-semibold">Uri ng mali</th>
                <th className="py-2 pr-4 font-semibold">Dapat</th>
                <th className="py-2 font-semibold">Na-type mo</th>
              </tr>
            </thead>
            <tbody>
              {mistakes.map((mistake, i) => (
                <tr key={i} className="border-t border-stone-200">
                  <td className="py-2 pr-4 text-stone-600">{mistake.index + 1}</td>
                  <td className="py-2 pr-4 text-stone-800">{KIND_LABEL[mistakeKind(mistake)]}</td>
                  <td className="py-2 pr-4 font-mono text-lg text-green-800">{showChar(mistake.expected) || '—'}</td>
                  <td className="py-2 font-mono text-lg text-red-700">{showChar(mistake.typed) || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {errors > mistakes.length && (
            <p className="mt-2 text-sm text-stone-600">Ipinapakita ang unang {mistakes.length} na mali.</p>
          )}
        </div>
      )}
    </Card>
  );
}

export default function TypingResults({
  session,
  comparison,
  saved,
  finishedEarly,
  onToggleSaved,
  onRetrySame,
  onNewPassage,
}: {
  session: Session;
  comparison: TypingComparison;
  saved: boolean;
  finishedEarly: boolean;
  onToggleSaved: () => void;
  onRetrySame: () => void;
  onNewPassage: () => void;
}) {
  const m = session.metrics;
  const t = JOB_READY_TYPING;
  const net = display(m.netWpm);
  const acc = display(m.accuracy);
  const ready = net >= t.netWpm && acc >= t.accuracy;

  return (
    <div>
      <PageHeader icon={<KeyboardIcon className="h-8 w-8" />} title="Resulta ng Typing Practice" />

      <section
        aria-label="Buod ng resulta"
        className={
          'mb-6 rounded-2xl border-2 p-6 ' + (ready ? 'border-green-400 bg-green-50' : 'border-brand-200 bg-white')
        }
      >
        <p className="text-2xl leading-relaxed text-stone-900">
          Ang bilis mo ay <strong>{net} WPM</strong> at <strong>{acc}%</strong> ang tama.
        </p>
        <p className="mt-2 text-lg text-stone-700">
          {ready
            ? '🎉 Pasado ka sa karaniwang target ng hiring test! Subukan ang Assessment para makasigurado.'
            : `Ang target ay ${t.netWpm} WPM at ${t.accuracy}% na tama. Tuloy lang ang practice — kaya mo 'yan!`}
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Button size="lg" onClick={onNewPassage} autoFocus>
            Ulitin (ibang text)
          </Button>
          <Button size="lg" variant="secondary" onClick={onRetrySame}>
            Ulitin ang parehong text
          </Button>
        </div>
      </section>

      <SaveBanner saved={saved} finishedEarly={finishedEarly} onToggle={onToggleSaved} />

      <h2 className="mb-3 text-xl font-bold text-stone-900">Mga detalye</h2>
      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <StatBadge label="Bilis (Net WPM)" value={net} hint={comparisonText(m.netWpm, comparison)} help={HELP.netWpm} />
        <StatBadge label="Accuracy (tama)" value={`${acc}%`} help={HELP.accuracy} />
        <StatBadge
          label="Keystroke accuracy"
          value={`${display(m.keystrokeAccuracy)}%`}
          hint="kasama ang mga binura mo"
          help={HELP.keystrokeAccuracy}
        />
        <StatBadge label="Gross WPM" value={display(m.grossWpm)} hint="bilis kasama ang mali" help={HELP.grossWpm} />
        <StatBadge label="Tagal" value={formatClock(session.durationSec)} hint={`${m.typedChars} letra ang na-type`} />
      </div>

      <Card title="Target ng hiring test" className="mb-6">
        <ul className="space-y-2">
          <TargetRow label="Bilis (Net WPM)" value={m.netWpm} target={t.netWpm} />
          <TargetRow label="Accuracy (tama)" value={m.accuracy} target={t.accuracy} unit="%" />
        </ul>
      </Card>

      <TypingMistakesCard mistakes={session.mistakes} errors={m.errors} />
    </div>
  );
}
