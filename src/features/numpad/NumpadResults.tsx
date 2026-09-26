import { SaveBanner, TargetRow } from '../../components/ResultPieces';
import { Button, Card, PageHeader, StatBadge } from '../../components/ui';
import { display } from '../../lib/scoring';
import type { Session, SessionMistake } from '../../lib/storage';
import { JOB_READY_NUMPAD } from '../../lib/targets';
import { formatClock } from '../../lib/useCountdown';

/** The list of wrong numpad entries (also used by the Assessment report). */
export function NumpadMistakesCard({ mistakes }: { mistakes: SessionMistake[] }) {
  return (
    <Card title={`Wrong entries (${mistakes.length})`}>
      {mistakes.length === 0 ? (
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
              {mistakes.map((mistake, i) => (
                <tr key={i} className="border-t border-slate-100">
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
  );
}

export default function NumpadResults({
  session,
  saved,
  finishedEarly,
  onToggleSaved,
  onRetry,
}: {
  session: Session;
  saved: boolean;
  finishedEarly: boolean;
  onToggleSaved: () => void;
  onRetry: () => void;
}) {
  const m = session.metrics;
  const t = JOB_READY_NUMPAD;

  return (
    <div>
      <PageHeader title="Numpad Drill — Results" />

      <SaveBanner saved={saved} finishedEarly={finishedEarly} onToggle={onToggleSaved} />

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatBadge label="KPH" value={display(m.kph).toLocaleString()} hint="correct keystrokes per hour" />
        <StatBadge label="Entry accuracy" value={`${display(m.entryAccuracy)}%`} />
        <StatBadge label="Entries" value={m.entries} hint={`${m.correctEntries} correct`} />
        <StatBadge label="Time" value={formatClock(session.durationSec)} />
      </div>

      <Card title="Job-ready target" className="mb-6">
        <ul className="space-y-2">
          <TargetRow label="KPH" value={m.kph} target={t.kph} />
          <TargetRow label="Entry accuracy" value={m.entryAccuracy} target={t.entryAccuracy} unit="%" />
        </ul>
      </Card>

      <div className="mb-6">
        <Button onClick={onRetry} autoFocus>
          Try again
        </Button>
      </div>

      <NumpadMistakesCard mistakes={session.mistakes} />
    </div>
  );
}
