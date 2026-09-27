import { ResultSummary } from '../../components/ResultPieces';
import { ExcelIcon } from '../../components/icons';
import { Button, PageHeader, Section, StatBadge } from '../../components/ui';
import type { Session, SessionMistake } from '../../lib/storage';
import { formatClock } from '../../lib/useCountdown';
import { lessonByLevel } from './lessons';
import { QUIZ_PASS } from './tasks';
import TipKeys from './TipKeys';

/** The tasks that were not done, or done the long way (with the shortcut to use next time). */
export function ExcelMistakesCard({
  mistakes,
  labels,
  nested = false,
}: {
  mistakes: SessionMistake[];
  labels: Record<string, string>;
  nested?: boolean;
}) {
  return (
    <Section title={`Mga dapat pang sanayin (${mistakes.length})`} small={nested}>
      {mistakes.length === 0 ? (
        <p className="text-lg text-stone-700">Lahat ay nagawa mo gamit ang shortcut. Ang galing!</p>
      ) : (
        <table className="w-full text-left text-base">
          <thead className="text-sm text-stone-600">
            <tr>
              <th className="py-2 pr-4 font-semibold">Tanong</th>
              <th className="py-2 pr-4 font-semibold">Ang nangyari</th>
              <th className="py-2 font-semibold">Shortcut na gagamitin</th>
            </tr>
          </thead>
          <tbody>
            {mistakes.map((m, i) => (
              <tr key={i} className="border-t border-stone-200 align-top">
                <td className="py-2 pr-4 text-stone-800">
                  <span className="text-stone-500">#{m.index}</span> {labels[m.field ?? ''] ?? m.field}
                </td>
                <td
                  className={
                    'py-2 pr-4 font-semibold ' + (m.typed === 'Hindi natapos' ? 'text-red-700' : 'text-amber-800')
                  }
                >
                  {m.typed === 'Hindi natapos' ? 'Nilaktawan' : `Tama, pero ${m.typed.toLowerCase()}`}
                </td>
                <td className="py-2 text-stone-900">
                  <TipKeys tip={m.expected} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Section>
  );
}

export default function ExcelResults({
  session,
  onRetryQuiz,
  onLesson,
  onList,
}: {
  session: Session;
  onRetryQuiz: () => void;
  onLesson: () => void;
  onList: () => void;
}) {
  const m = session.metrics;
  const passed = m.passed === 1;
  const lesson = lessonByLevel(m.level ?? 1);

  return (
    <div>
      <PageHeader
        icon={<ExcelIcon className="h-8 w-8" />}
        title="Resulta ng Pagsusulit"
        description={`Excel, Aralin ${lesson.level}: ${lesson.title}`}
      />

      <ResultSummary
        ready={passed}
        headline={
          <>
            <strong>{m.tasksDone}</strong> sa <strong>{m.tasksTotal}</strong> ang nagawa mo
            {passed ? '. Pasado ka sa araling ito!' : '.'}
          </>
        }
        message={
          passed
            ? 'Puwede mo itong ulitin kahit kailan para lalong masanay ang mga daliri.'
            : `Kailangan ng ${QUIZ_PASS} sa ${m.tasksTotal} para pumasa. Balikan ang aralin (may hint doon), tapos subukan ulit.`
        }
      >
        {passed ? (
          <>
            <Button size="lg" onClick={onList} autoFocus>
              Bumalik sa mga aralin
            </Button>
            <Button size="lg" variant="secondary" onClick={onRetryQuiz}>
              Ulitin ang pagsusulit
            </Button>
          </>
        ) : (
          <>
            <Button size="lg" onClick={onLesson} autoFocus>
              Balikan ang aralin
            </Button>
            <Button size="lg" variant="secondary" onClick={onRetryQuiz}>
              Ulitin ang pagsusulit
            </Button>
          </>
        )}
      </ResultSummary>

      <Section title="Mga detalye" className="mb-10">
        <div className="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-3">
          <StatBadge label="Nagawa" value={`${m.tasksDone} sa ${m.tasksTotal}`} hint={`${QUIZ_PASS} ang kailangan`} />
          <StatBadge
            label="Gamit ang shortcut"
            value={`${m.tasksShortcut} sa ${m.tasksTotal}`}
            hint="hindi kailangan, pero mas mabilis"
          />
          <StatBadge label="Tagal" value={formatClock(session.durationSec)} hint="walang oras na limit" />
        </div>
      </Section>

      <ExcelMistakesCard mistakes={session.mistakes} labels={lesson.content?.labels ?? {}} />
    </div>
  );
}
