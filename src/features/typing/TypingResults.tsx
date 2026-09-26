import { Button, Card, PageHeader, StatBadge } from '../../components/ui';
import { display } from '../../lib/scoring';
import type { Session } from '../../lib/storage';
import { formatClock } from '../../lib/useCountdown';

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
  practice,
  onRetrySame,
  onNewPassage,
}: {
  session: Session;
  practice: boolean;
  onRetrySame: () => void;
  onNewPassage: () => void;
}) {
  const m = session.metrics;

  return (
    <div>
      <PageHeader title={practice ? 'Practice (30 sec) — Results' : 'Typing Test — Results'} />

      <p
        role="status"
        className={
          'mb-4 rounded-md border px-4 py-2 text-sm ' +
          (practice
            ? 'border-amber-300 bg-amber-50 text-amber-900'
            : 'border-green-300 bg-green-50 text-green-900')
        }
      >
        {practice
          ? 'Practice run — this result was NOT saved to your progress.'
          : 'Saved to your progress.'}
      </p>

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatBadge label="Net WPM" value={display(m.netWpm)} />
        <StatBadge label="Gross WPM" value={display(m.grossWpm)} />
        <StatBadge label="Accuracy" value={`${display(m.accuracy)}%`} />
        <StatBadge label="Time" value={formatClock(session.durationSec)} hint={`${m.typedChars} characters`} />
      </div>

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
