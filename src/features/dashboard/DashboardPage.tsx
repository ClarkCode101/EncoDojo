/**
 * Home: where to start (4 steps), your progress, and recent sessions.
 * Written for people who are new to computers: big cards, clear order, Taglish.
 */
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRightIcon,
  AssessmentIcon,
  ClockIcon,
  CopyIcon,
  HomeIcon,
  KeyboardIcon,
  NumpadIcon,
  StarIcon,
} from '../../components/icons';
import { Card, ConfirmButton, PageHeader, StatBadge } from '../../components/ui';
import { HELP } from '../../lib/glossary';
import { display } from '../../lib/scoring';
import type { Session } from '../../lib/storage';
import { clearSessions, removeSession, useAppData } from '../../lib/useAppData';
import { formatClock } from '../../lib/useCountdown';
import {
  bestMetric,
  currentStreak,
  forNumpadBest,
  isBeginnerNumpad,
  latestMetric,
  recentSessions,
} from './stats';

function show(value: number | null, suffix = ''): string {
  return value === null ? '–' : `${display(value).toLocaleString()}${suffix}`;
}

function summary(session: Session): string {
  const m = session.metrics;
  if (session.type === 'typing') {
    return `${display(m.netWpm)} WPM · ${display(m.accuracy)}% tama`;
  }
  if (session.type === 'assessment') {
    const verdict = m.jobReady === 1 ? '✅ Job-ready' : `${m.targetsMet} sa ${m.targetsTotal} pasado`;
    return `${verdict} · ${display(m.typingNetWpm)} WPM · ${display(m.numpadKph).toLocaleString()} KPH`;
  }
  if (session.type === 'copy') {
    return `${display(m.fieldAccuracy)}% tamang field · ${display(m.netWpm)} WPM · ${m.records} record`;
  }
  return `${display(m.kph).toLocaleString()} KPH · ${display(m.entryAccuracy)}% tama`;
}

const typeLabel: Record<Session['type'], string> = {
  typing: 'Typing Practice',
  numpad: 'Numpad Practice',
  copy: 'Copy Test',
  assessment: 'Assessment',
};

/** One of the big "where to start" cards. The whole card is a link. */
function StepCard({
  number,
  to,
  icon,
  title,
  text,
  action,
  footer,
  highlight = false,
}: {
  number: number;
  to: string;
  icon: ReactNode;
  title: string;
  text: string;
  action: string;
  footer?: ReactNode;
  highlight?: boolean;
}) {
  return (
    <Link
      to={to}
      className={
        'group flex flex-col rounded-2xl border-2 p-5 shadow-sm transition ' +
        'hover:-translate-y-0.5 hover:shadow-md focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-brand-600 ' +
        (highlight ? 'border-belt-400 bg-belt-50' :'border-stone-200 bg-white hover:border-brand-400')
      }
    >
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-100 text-brand-800">{icon}</div>
        <div className="text-sm font-semibold text-stone-600">Hakbang {number}</div>
      </div>
      <h2 className="mt-3 text-xl font-bold text-stone-900">{title}</h2>
      <p className="mt-1 flex-1 text-stone-700">{text}</p>
      {footer && <div className="mt-3 text-sm font-medium text-stone-800">{footer}</div>}
      <div className="mt-4 inline-flex items-center gap-2 text-lg font-bold text-brand-800 group-hover:text-brand-950">
        {action} <ArrowRightIcon className="h-5 w-5" />
      </div>
    </Link>
  );
}

function assessmentStatus(latest: Session | null): string {
  if (!latest) return 'Hindi mo pa ito nasusubukan. Mga 4 na minuto lang.';
  const m = latest.metrics;
  const when = new Date(latest.startedAt).toLocaleDateString(undefined, { dateStyle: 'medium' });
  return m.jobReady === 1
    ? `Huling resulta (${when}): ✅ Job-ready!`
    : `Huling resulta (${when}): ${m.targetsMet} sa ${m.targetsTotal} target ang pasado.`;
}

const comingSoon = [
  { name: 'Document Encoding', text: 'Pag-encode mula sa pekeng invoice, resibo, at form.' },
  { name: 'QC / Spot the Difference', text: 'Paghahanap ng mali sa na-encode na data.' },
  { name: 'Excel Practice', text: 'Mga basic na formula, sort, filter, at VLOOKUP.' },
  { name: 'Mistake Review', text: 'Balikan at ulitin ang mga dati mong mali.' },
  { name: 'Progress Reports', text: 'Chart ng pag-improve mo sa bawat linggo.' },
];

export default function DashboardPage() {
  const { profile, sessions } = useAppData();
  const training = sessions.filter((s) => s.type !== 'assessment');
  const recent = recentSessions(sessions, 10);
  const streak = currentStreak(sessions);
  const latestAssessment = recentSessions(sessions.filter((s) => s.type === 'assessment'), 1)[0] ?? null;

  return (
    <div className="space-y-10">
      <PageHeader
        icon={<HomeIcon className="h-8 w-8" />}
        title={profile.displayName ? `Magandang araw, ${profile.displayName}!` : 'Maligayang pagdating sa EncoDojo!'}
        description="Dito ka magpa-practice para sa trabahong Encoder o Data Entry. Sundan lang ang mga hakbang sa ibaba."
      />

      <section aria-labelledby="start-heading">
        <h2 id="start-heading" className="mb-4 text-2xl font-bold text-stone-900">
          Paano magsimula
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StepCard
            number={1}
            to="/typing"
            icon={<KeyboardIcon className="h-7 w-7" />}
            title="Typing Practice"
            text="Sanayin ang bilis at tamang pagta-type ng mga pangungusap."
            action="Mag-practice"
          />
          <StepCard
            number={2}
            to="/numpad"
            icon={<NumpadIcon className="h-7 w-7" />}
            title="Numpad Practice"
            text="Sanayin ang pag-type ng mga numero gamit ang numpad sa kanan ng keyboard."
            action="Mag-practice"
          />
          <StepCard
            number={3}
            to="/copy"
            icon={<CopyIcon className="h-7 w-7" />}
            title="Copy Test"
            text="Kopyahin ang pangalan, petsa, address, at ID sa form — gaya ng totoong encoding."
            action="Mag-practice"
          />
          <StepCard
            number={4}
            to="/assessment"
            icon={<AssessmentIcon className="h-7 w-7" />}
            title="Assessment"
            text="Kapag handa ka na, subukan ito para malaman kung job-ready ka na."
            action={latestAssessment ? 'Subukan ulit' : 'Simulan'}
            footer={assessmentStatus(latestAssessment)}
            highlight
          />
        </div>
      </section>

      <section aria-labelledby="progress-heading">
        <h2 id="progress-heading" className="mb-4 flex items-center gap-2 text-2xl font-bold text-stone-900">
          <StarIcon className="h-7 w-7 text-belt-500" /> Ang progress mo sa practice
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <StatBadge
            label="Pinakamabilis na typing"
            value={show(bestMetric(sessions, 'typing', 'netWpm'))}
            hint="Net WPM"
            help={HELP.netWpm}
          />
          <StatBadge
            label="Huling typing accuracy"
            value={show(latestMetric(sessions, 'typing', 'accuracy'), '%')}
            hint="tama sa huling practice"
            help={HELP.accuracy}
          />
          <StatBadge
            label="Pinakamabilis na numpad"
            value={show(bestMetric(forNumpadBest(sessions), 'numpad', 'kph'))}
            hint="KPH (Halo-halo)"
            help={HELP.kph}
          />
          <StatBadge
            label="Huling Copy Test"
            value={show(latestMetric(sessions, 'copy', 'fieldAccuracy'), '%')}
            hint="tamang field sa huling practice"
            help={HELP.fieldAccuracy}
          />
          <StatBadge
            label="Sunod-sunod na araw"
            value={`${streak} araw`}
            hint={`${training.length} practice session lahat`}
            help={HELP.streak}
          />
        </div>
      </section>

      <Card title="Mga huling ginawa" icon={<ClockIcon />}>
        {recent.length === 0 ? (
          <p className="text-lg text-stone-700">
            Wala ka pang nagagawa. Simulan sa <strong>Hakbang 1: Typing Practice</strong> sa itaas!
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-base">
              <thead className="text-stone-600">
                <tr>
                  <th className="py-2 pr-4 font-semibold">Petsa</th>
                  <th className="py-2 pr-4 font-semibold">Ginawa</th>
                  <th className="py-2 pr-4 font-semibold">Tagal</th>
                  <th className="py-2 pr-4 font-semibold">Resulta</th>
                  <th className="py-2 font-semibold">
                    <span className="sr-only">Burahin</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {recent.map((s) => (
                  <tr key={s.id} className="border-t border-stone-200">
                    <td className="py-3 pr-4 text-stone-700">
                      {new Date(s.startedAt).toLocaleString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="py-3 pr-4 font-medium">
                      {typeLabel[s.type]}
                      {isBeginnerNumpad(s) && (
                        <span className="block text-sm font-normal text-stone-600">pang-baguhan</span>
                      )}
                    </td>
                    <td className="py-3 pr-4 tabular-nums">{formatClock(s.durationSec)}</td>
                    <td className="py-3 pr-4 tabular-nums">{summary(s)}</td>
                    <td className="py-3 text-right">
                      <ConfirmButton
                        size="sm"
                        label="Burahin"
                        question="Burahin ito?"
                        onConfirm={() => removeSession(s.id)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {training.length > 0 && (
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-stone-200 pt-5">
            <p className="max-w-md text-sm text-stone-600">
              Kapag nagbura ka, magbabago rin ang pinakamabilis mong score at streak. Ang assessments ay
              binubura sa Assessment page.
            </p>
            <ConfirmButton
              label="Burahin lahat ng practice"
              question={
                training.length === 1
                  ? 'Burahin ang 1 practice session?'
                  : `Burahin lahat ng ${training.length} practice sessions?`
              }
              confirmLabel="Oo, burahin lahat"
              onConfirm={() => clearSessions(['typing', 'numpad', 'copy'])}
            />
          </div>
        )}
      </Card>

      <section aria-labelledby="soon-heading" className="rounded-2xl border-2 border-dashed border-stone-300 p-6">
        <h2 id="soon-heading" className="text-xl font-bold text-stone-800">
          Parating pa sa EncoDojo
        </h2>
        <p className="mt-1 text-stone-600">Hindi pa ito magagamit, pero idadagdag sa mga susunod na update.</p>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {comingSoon.map((item) => (
            <li key={item.name} className="rounded-lg bg-white px-4 py-3">
              <div className="font-semibold text-stone-800">{item.name}</div>
              <div className="text-sm text-stone-600">{item.text}</div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
