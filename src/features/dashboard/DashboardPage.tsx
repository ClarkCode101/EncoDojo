import { ButtonLink, Card, ConfirmButton, PageHeader, StatBadge } from '../../components/ui';
import { display } from '../../lib/scoring';
import type { Session } from '../../lib/storage';
import { clearSessions, removeSession, useAppData } from '../../lib/useAppData';
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
  if (session.type === 'assessment') {
    const verdict = m.jobReady === 1 ? '✅ Job-ready' : `${m.targetsMet}/${m.targetsTotal} targets`;
    return `${verdict} · ${display(m.typingNetWpm)} WPM · ${display(m.numpadKph).toLocaleString()} KPH`;
  }
  return `${display(m.kph).toLocaleString()} KPH · ${display(m.entryAccuracy)}% entries correct`;
}

const typeLabel: Record<Session['type'], string> = {
  typing: 'Typing Test',
  numpad: 'Numpad Drill',
  assessment: 'Assessment',
};

function AssessmentCard({ latest }: { latest: Session | null }) {
  let status = 'You have not taken the assessment yet. It takes about 2 minutes.';
  if (latest) {
    const m = latest.metrics;
    const when = new Date(latest.startedAt).toLocaleDateString(undefined, { dateStyle: 'medium' });
    status =
      m.jobReady === 1
        ? `Latest (${when}): ✅ Job-ready — all ${m.targetsTotal} targets met.`
        : `Latest (${when}): ${m.targetsMet} of ${m.targetsTotal} targets met. Keep training!`;
  }
  return (
    <Card title="Assessment" className="mb-6">
      <p className="mb-4 text-slate-700">{status}</p>
      <ButtonLink to="/assessment">{latest ? 'Retake assessment' : 'Start assessment'}</ButtonLink>
    </Card>
  );
}

export default function DashboardPage() {
  const { profile, sessions } = useAppData();
  const recent = recentSessions(sessions, 10);
  const streak = currentStreak(sessions);
  const latestAssessment = recentSessions(sessions.filter((s) => s.type === 'assessment'), 1)[0] ?? null;
  const trainingCount = sessions.filter((s) => s.type !== 'assessment').length;

  return (
    <div>
      <PageHeader
        title={profile.displayName ? `Welcome back, ${profile.displayName}!` : 'Dashboard'}
        description="Train a little every day, then take the Assessment to check if you're job-ready."
      />

      <AssessmentCard latest={latestAssessment} />

      <h2 className="mb-3 text-base font-semibold text-slate-800">Training</h2>
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
        <ButtonLink to="/typing" variant="secondary">
          Train Typing
        </ButtonLink>
        <ButtonLink to="/numpad" variant="secondary">
          Train Numpad
        </ButtonLink>
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
                <th className="py-2 pr-4 font-medium">Result</th>
                <th className="py-2 font-medium">
                  <span className="sr-only">Delete</span>
                </th>
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
                  <td className="py-2 pr-4 tabular-nums">{summary(s)}</td>
                  <td className="py-2 text-right">
                    <ConfirmButton
                      size="sm"
                      label="Delete"
                      question="Delete this?"
                      onConfirm={() => removeSession(s.id)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {trainingCount > 0 && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4">
            <p className="text-sm text-slate-600">
              Deleting also updates your best scores and streak. Assessments are cleared on the Assessment page.
            </p>
            <ConfirmButton
              label="Clear training history"
              question={
                trainingCount === 1
                  ? 'Delete your 1 training session?'
                  : `Delete all ${trainingCount} training sessions?`
              }
              confirmLabel="Yes, clear all"
              onConfirm={() => clearSessions(['typing', 'numpad'])}
            />
          </div>
        )}
      </Card>
    </div>
  );
}
