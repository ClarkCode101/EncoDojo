import { Button, Card, PageHeader, StatBadge } from '../../components/ui';
import { display } from '../../lib/scoring';
import type { Session } from '../../lib/storage';
import { formatClock } from '../../lib/useCountdown';

export default function NumpadResults({
  session,
  onRetry,
}: {
  session: Session;
  onRetry: () => void;
}) {
  const m = session.metrics;

  return (
    <div>
      <PageHeader title="Numpad Drill — Results" />

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatBadge label="KPH" value={display(m.kph).toLocaleString()} hint="correct keystrokes per hour" />
        <StatBadge label="Entry accuracy" value={`${display(m.entryAccuracy)}%`} />
        <StatBadge label="Entries" value={m.entries} hint={`${m.correctEntries} correct`} />
        <StatBadge label="Time" value={formatClock(session.durationSec)} />
      </div>

      <div className="mb-6">
        <Button onClick={onRetry} autoFocus>
          Try again
        </Button>
      </div>

      <Card title={`Wrong entries (${session.mistakes.length})`}>
        {session.mistakes.length === 0 ? (
          <p className="text-slate-700">No wrong entries. Great job!</p>
        ) : (
          <div className="max-h-96 overflow-y-auto">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 bg-white text-slate-600">
                <tr>
                  <th className="py-2 pr-4 font-medium">Entry #</th>
                  <th className="py-2 pr-4 font-medium">Expected</th>
                  <th className="py-2 font-medium">You typed</th>
                </tr>
              </thead>
              <tbody className="font-mono tabular-nums">
                {session.mistakes.map((mistake) => (
                  <tr key={mistake.index} className="border-t border-slate-100">
                    <td className="py-1.5 pr-4 text-slate-600">{mistake.index}</td>
                    <td className="py-1.5 pr-4 text-green-800">{mistake.expected}</td>
                    <td className="py-1.5 text-red-700">{mistake.typed}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
