import { ResultSummary, SaveBanner, TargetRow } from '../../components/ResultPieces';
import { KeyboardIcon } from '../../components/icons';
import { Button, PageHeader, Section, StatBadge } from '../../components/ui';
import { HELP } from '../../lib/glossary';
import { display } from '../../lib/scoring';
import type { Session, SessionMistake } from '../../lib/storage';
import { JOB_READY_TYPING } from '../../lib/targets';
import { formatClock } from '../../lib/useCountdown';
import { mistakeKind } from '../../lib/alignTyping';
import type { TypingComparison } from './compare';

/** e.g. "↑3 kumpara sa huli, best: 45" or "Bagong personal best! (dati: 42)". */
function comparisonText(netWpm: number, comparison: TypingComparison): string {
  const { previousNetWpm, bestNetWpm } = comparison;
  if (previousNetWpm === null || bestNetWpm === null) return 'Una mong na-save na practice';

  const now = display(netWpm);
  if (now > display(bestNetWpm)) return `Bagong personal best! (dati: ${display(bestNetWpm)})`;

  const diff = now - display(previousNetWpm);
  const vsLast = diff > 0 ? `↑${diff} kumpara sa huli` : diff < 0 ? `↓${-diff} kumpara sa huli` : 'Pareho sa huli';
  return `${vsLast}, best: ${display(bestNetWpm)}`;
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
    <Section title={`Mga mali sa typing (${errors})`}>
      {mistakes.length === 0 ? (
        <p className="text-lg text-stone-700">Walang mali. Ang galing!</p>
      ) : (
        <div className="max-h-96 overflow-y-auto">
          <table className="w-full text-left text-base">
            <thead className="sticky top-0 bg-paper text-sm text-stone-600">
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
    </Section>
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

      <ResultSummary
        ready={ready}
        headline={
          <>
            Ang bilis mo ay <strong>{net} WPM</strong> at <strong>{acc}%</strong> ang tama.
          </>
        }
        message={
          ready
            ? 'Pasado ka sa karaniwang target ng hiring test. Subukan ang Assessment para makasigurado.'
            : `Ang target ay ${t.netWpm} WPM at ${t.accuracy}% na tama. Tuloy lang ang practice.`
        }
      >
        <Button size="lg" onClick={onNewPassage} autoFocus>
          Ulitin (ibang text)
        </Button>
        <Button size="lg" variant="secondary" onClick={onRetrySame}>
          Ulitin ang parehong text
        </Button>
      </ResultSummary>

      <SaveBanner saved={saved} finishedEarly={finishedEarly} onToggle={onToggleSaved} />

      <Section title="Mga detalye" className="mb-10">
        <div className="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
          <StatBadge
            label="Bilis (Net WPM)"
            value={net}
            hint={comparisonText(m.netWpm, comparison)}
            help={HELP.netWpm}
          />
          <StatBadge label="Accuracy (tama)" value={`${acc}%`} help={HELP.accuracy} />
          <StatBadge
            label="Keystroke accuracy"
            value={`${display(m.keystrokeAccuracy)}%`}
            hint="kasama ang mga binura mo"
            help={HELP.keystrokeAccuracy}
          />
          <StatBadge label="Gross WPM" value={display(m.grossWpm)} hint="bilis kasama ang mali" help={HELP.grossWpm} />
          <StatBadge
            label="Tagal"
            value={formatClock(session.durationSec)}
            hint={`${m.typedChars} letra ang na-type`}
          />
        </div>
      </Section>

      <Section title="Target ng hiring test" className="mb-10">
        <ul>
          <TargetRow label="Bilis (Net WPM)" value={m.netWpm} target={t.netWpm} />
          <TargetRow label="Accuracy (tama)" value={m.accuracy} target={t.accuracy} unit="%" />
        </ul>
      </Section>

      <TypingMistakesCard mistakes={session.mistakes} errors={m.errors} />
    </div>
  );
}
