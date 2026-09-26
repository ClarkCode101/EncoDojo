import { SaveBanner, TargetRow } from '../../components/ResultPieces';
import { Button, Card, PageHeader, StatBadge } from '../../components/ui';
import { display } from '../../lib/scoring';
import type { Session, SessionMistake } from '../../lib/storage';
import { JOB_READY_TYPING } from '../../lib/targets';
import { formatClock } from '../../lib/useCountdown';
import { mistakeKind } from './alignTyping';
import type { TypingComparison } from './compare';

/** e.g. "↑3 vs last test · Best 45" or "New personal best! (was 42)". */
function comparisonText(netWpm: number, comparison: TypingComparison): string {
  const { previousNetWpm, bestNetWpm } = comparison;
  if (previousNetWpm === null || bestNetWpm === null) return 'Your first saved test';

  const now = display(netWpm);
  if (now > display(bestNetWpm)) return `New personal best! (was ${display(bestNetWpm)})`;

  const diff = now - display(previousNetWpm);
  const vsLast = diff > 0 ? `↑${diff} vs last test` : diff < 0 ? `↓${-diff} vs last test` : 'Same as last test';
  return `${vsLast} · Best ${display(bestNetWpm)}`;
}

function JobReadyCard({ netWpm, accuracy }: { netWpm: number; accuracy: number }) {
  const t = JOB_READY_TYPING;
  const ready = display(netWpm) >= t.netWpm && display(accuracy) >= t.accuracy;
  return (
    <Card title="Job-ready target" className="mb-6">
      <ul className="space-y-2">
        <TargetRow label="Net WPM" value={netWpm} target={t.netWpm} />
        <TargetRow label="Accuracy" value={accuracy} target={t.accuracy} unit="%" />
      </ul>
      <p className={'mt-3 text-sm font-medium ' + (ready ? 'text-green-800' : 'text-slate-700')}>
        {ready
          ? 'You meet the typical hiring-test target here. Take the Assessment to confirm it!'
          : 'Not there yet — keep practicing. Focus on accuracy first, then speed.'}
      </p>
    </Card>
  );
}

/** Make spaces visible in the mistakes table. */
function showChar(char: string): string {
  return char === ' ' ? '␣ space' : char;
}

/** The list of typing mistakes (also used by the Assessment report). */
export function TypingMistakesCard({ mistakes, errors }: { mistakes: SessionMistake[]; errors: number }) {
  return (
    <Card title={`Typing mistakes (${errors})`}>
      {mistakes.length === 0 ? (
        <p className="text-slate-700">No mistakes. Great job!</p>
      ) : (
        <div className="max-h-96 overflow-y-auto">
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 bg-white text-slate-600">
              <tr>
                <th className="py-2 pr-4 font-medium">Position</th>
                <th className="py-2 pr-4 font-medium">Kind</th>
                <th className="py-2 pr-4 font-medium">Expected</th>
                <th className="py-2 font-medium">You typed</th>
              </tr>
            </thead>
            <tbody className="font-mono">
              {mistakes.map((mistake, i) => (
                <tr key={i} className="border-t border-slate-100">
                  <td className="py-1.5 pr-4 text-slate-600">{mistake.index + 1}</td>
                  <td className="py-1.5 pr-4 font-sans text-slate-700">{mistakeKind(mistake)}</td>
                  <td className="py-1.5 pr-4 text-green-800">{showChar(mistake.expected) || '—'}</td>
                  <td className="py-1.5 text-red-700">{showChar(mistake.typed) || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {errors > mistakes.length && (
            <p className="mt-2 text-sm text-slate-600">Showing the first {mistakes.length} mistakes.</p>
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

  return (
    <div>
      <PageHeader title="Typing Test — Results" />

      <SaveBanner saved={saved} finishedEarly={finishedEarly} onToggle={onToggleSaved} />

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-5">
        <StatBadge label="Net WPM" value={display(m.netWpm)} hint={comparisonText(m.netWpm, comparison)} />
        <StatBadge label="Gross WPM" value={display(m.grossWpm)} />
        <StatBadge label="Accuracy" value={`${display(m.accuracy)}%`} hint="final text" />
        <StatBadge
          label="Keystroke accuracy"
          value={`${display(m.keystrokeAccuracy)}%`}
          hint="incl. fixed mistakes"
        />
        <StatBadge label="Time" value={formatClock(session.durationSec)} hint={`${m.typedChars} characters`} />
      </div>

      <JobReadyCard netWpm={m.netWpm} accuracy={m.accuracy} />

      <div className="mb-6 flex gap-3">
        <Button onClick={onNewPassage} autoFocus>
          Try again
        </Button>
        <Button variant="secondary" onClick={onRetrySame}>
          Retry same passage
        </Button>
      </div>

      <TypingMistakesCard mistakes={session.mistakes} errors={m.errors} />
    </div>
  );
}
