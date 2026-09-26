import { Button, Card, PageHeader, StatBadge } from '../../components/ui';
import { display } from '../../lib/scoring';
import type { Session } from '../../lib/storage';
import { JOB_READY_TYPING } from '../../lib/targets';
import { formatClock } from '../../lib/useCountdown';
import type { TypingComparison } from './compare';

/** e.g. "↑3 vs last test · Best 45" or "New personal best! (was 42)". */
function comparisonText(netWpm: number, comparison: TypingComparison): string {
  const { previousNetWpm, bestNetWpm } = comparison;
  if (previousNetWpm === null || bestNetWpm === null) return 'Your first recorded test';

  const now = display(netWpm);
  if (now > display(bestNetWpm)) return `New personal best! (was ${display(bestNetWpm)})`;

  const diff = now - display(previousNetWpm);
  const vsLast = diff > 0 ? `↑${diff} vs last test` : diff < 0 ? `↓${-diff} vs last test` : 'Same as last test';
  return `${vsLast} · Best ${display(bestNetWpm)}`;
}

function TargetRow({ label, value, target, unit = '' }: { label: string; value: number; target: number; unit?: string }) {
  const pass = display(value) >= target;
  return (
    <li className="flex items-center gap-3">
      <span aria-hidden="true" className="text-lg">
        {pass ? '✅' : '❌'}
      </span>
      <span className="w-40 text-slate-700">{label}</span>
      <span className="font-semibold tabular-nums text-slate-900">
        {display(value)}
        {unit}
      </span>
      <span className="text-sm text-slate-600">
        / {target}
        {unit} needed
      </span>
      <span className="sr-only">{pass ? 'passed' : 'not yet'}</span>
    </li>
  );
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
          ? 'You meet the typical hiring-test target. Keep doing it consistently!'
          : 'Not there yet — keep practicing. Focus on accuracy first, then speed.'}
      </p>
    </Card>
  );
}

function SaveBanner({
  practice,
  saved,
  onToggleSaved,
}: {
  practice: boolean;
  saved: boolean;
  onToggleSaved: () => void;
}) {
  if (practice) {
    return (
      <p role="status" className="mb-4 rounded-md border border-amber-300 bg-amber-50 px-4 py-2 text-sm text-amber-900">
        Practice run — this result was NOT saved to your progress.
      </p>
    );
  }
  return (
    <div
      role="status"
      className={
        'mb-4 flex flex-wrap items-center justify-between gap-3 rounded-md border px-4 py-2 text-sm ' +
        (saved ? 'border-green-300 bg-green-50 text-green-900' : 'border-slate-300 bg-slate-100 text-slate-800')
      }
    >
      <span>{saved ? 'Saved to your progress.' : 'This result is NOT saved.'}</span>
      <Button variant="secondary" onClick={onToggleSaved}>
        {saved ? "Don't save this result" : 'Save it again'}
      </Button>
    </div>
  );
}

/** Make spaces visible in the mistakes table. */
function showChar(char: string): string {
  return char === ' ' ? '␣ space' : char;
}

/** Short description of a mistake, e.g. "Extra key" or "Skipped letter". */
function kindOf(mistake: Session['mistakes'][number]): string {
  if (mistake.expected === '') return 'Extra key';
  if (mistake.typed === '') return 'Skipped';
  return 'Wrong key';
}

export default function TypingResults({
  session,
  comparison,
  practice,
  saved,
  onToggleSaved,
  onRetrySame,
  onNewPassage,
}: {
  session: Session;
  comparison: TypingComparison;
  practice: boolean;
  saved: boolean;
  onToggleSaved: () => void;
  onRetrySame: () => void;
  onNewPassage: () => void;
}) {
  const m = session.metrics;

  return (
    <div>
      <PageHeader title={practice ? 'Practice (30 sec) — Results' : 'Typing Test — Results'} />

      <SaveBanner practice={practice} saved={saved} onToggleSaved={onToggleSaved} />

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

      <Card title={`Mistakes (${m.errors})`}>
        {session.mistakes.length === 0 ? (
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
                {session.mistakes.map((mistake, i) => (
                  <tr key={i} className="border-t border-slate-100">
                    <td className="py-1.5 pr-4 text-slate-600">{mistake.index + 1}</td>
                    <td className="py-1.5 pr-4 font-sans text-slate-700">{kindOf(mistake)}</td>
                    <td className="py-1.5 pr-4 text-green-800">{showChar(mistake.expected) || '—'}</td>
                    <td className="py-1.5 text-red-700">{showChar(mistake.typed) || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {m.errors > session.mistakes.length && (
              <p className="mt-2 text-sm text-slate-600">
                Showing the first {session.mistakes.length} mistakes.
              </p>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
