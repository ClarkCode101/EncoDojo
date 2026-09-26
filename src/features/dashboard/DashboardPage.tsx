import { ButtonLink, Card, PageHeader, StatBadge } from '../../components/ui';
import { display } from '../../lib/scoring';
import type { Session } from '../../lib/storage';
import { useAppData } from '../../lib/useAppData';
import { formatClock } from '../../lib/useCountdown';
import { bestMetric, currentStreak, latestMetric, recentSessions } from './stats';

function show(value: number | null, suffix = ''): string {
  return value === null ? '–' : `${display(value).toLocaleString()}${suffix}`;
}

function summary(session: Session): string {
  const m = session.metrics;
  if (session.type === 'typing') {
    return `${display(m.netWpm)} net WPM · ${display(m.accuracy)}% accuracy`;
  }
  return `${display(m.kph).toLocaleString()} KPH · ${display(m.entryAccuracy)}% entries correct`;
}

const typeLabel: Record<Session['type'], string> = {
  typing: 'Typing Test',
  numpad: 'Numpad Drill',
};

export default function DashboardPage() {
  const { profile, sessions } = useAppData();
  const recent = recentSessions(sessions, 10);
  const streak = currentStreak(sessions);

  return (
    <div>
      <PageHeader
        title={profile.displayName ? `Welcome back, ${profile.displayName}!` : 'Dashboard'}
        description="Practice a little every day. Accuracy first, then speed."
      />

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-5">
        <StatBadge label="Best Net WPM" value={show(bestMetric(sessions, 'typing', 'netWpm'))} />
        <StatBadge
          label="Latest accuracy"
          value={show(latestMetric(sessions, 'typing', 'accuracy'), '%')}
          hint="last typing test"
        />
        <StatBadge label="Best KPH" value={show(bestMetric(sessions, 'numpad', 'kph'))} />
        <StatBadge label="Total sessions" value={sessions.length} />
        <StatBadge label="Current streak" value={`${streak} ${streak === 1 ? 'day' : 'days'}`} />
      </div>

      <div className="mb-8 flex flex-wrap gap-3">
        <ButtonLink to="/typing">Start Typing Test</ButtonLink>
        <ButtonLink to="/numpad">Start Numpad Drill</ButtonLink>
      </div>

      <Card title="Recent sessions">
        {recent.length === 0 ? (
          <p className="text-slate-700">No sessions yet. Try a Typing Test to get your first score!</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="text-slate-600">
              <tr>
                <th className="py-2 pr-4 font-medium">Date</th>
                <th className="py-2 pr-4 font-medium">Drill</th>
                <th className="py-2 pr-4 font-medium">Time</th>
                <th className="py-2 font-medium">Result</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((s) => (
                <tr key={s.id} className="border-t border-slate-100">
                  <td className="py-2 pr-4 text-slate-700">
                    {new Date(s.startedAt).toLocaleString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </td>
                  <td className="py-2 pr-4">{typeLabel[s.type]}</td>
                  <td className="py-2 pr-4 tabular-nums">{formatClock(s.durationSec)}</td>
                  <td className="py-2 tabular-nums">{summary(s)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
