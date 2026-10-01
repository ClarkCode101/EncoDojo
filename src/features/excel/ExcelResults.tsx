import { ResultSummary } from '../../components/ResultPieces';
import { ExcelIcon } from '../../components/icons';
import { Button, PageHeader, Section, StatBadge } from '../../components/ui';
import { useLang, useT, type T } from '../../lib/i18n';
import type { Session, SessionMistake } from '../../lib/storage';
import { formatClock } from '../../lib/useCountdown';
import { lessonByLevel, lessonTitle } from './lessons';
import { QUIZ_PASS } from './tasks';
import TipKeys from './TipKeys';

/**
 * What happened, from the saved code: "Hindi natapos" (skipped), "Gumamit ng mouse", or "N pindot".
 * The codes are saved in Taglish (older sessions too), so they are only translated here.
 */
function whatHappened(typed: string, t: T): string {
  if (typed === 'Hindi natapos') return t('Nilaktawan', 'Skipped');
  if (typed === 'Gumamit ng mouse') return t('Tama, pero gumamit ng mouse', 'Correct, but used the mouse');
  const keys = typed.match(/^(\d+) pindot$/);
  if (keys) return t(`Tama, pero ${keys[1]} pindot`, `Correct, but ${keys[1]} key presses`);
  return t(`Tama, pero ${typed.toLowerCase()}`, `Correct, but ${typed.toLowerCase()}`);
}

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
  const t = useT();
  return (
    <Section title={`${t('Mga dapat pang sanayin', 'Still to practice')} (${mistakes.length})`} small={nested}>
      {mistakes.length === 0 ? (
        <p className="text-lg text-stone-700">
          {t('Lahat ay nagawa mo gamit ang shortcut. Ang galing!', 'You did everything with the shortcut. Great job!')}
        </p>
      ) : (
        <table className="w-full text-left text-base">
          <thead className="text-sm text-stone-600">
            <tr>
              <th className="py-2 pr-4 font-semibold">{t('Tanong', 'Question')}</th>
              <th className="py-2 pr-4 font-semibold">{t('Ang nangyari', 'What happened')}</th>
              <th className="py-2 font-semibold">{t('Shortcut na gagamitin', 'Shortcut to use')}</th>
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
                  {whatHappened(m.typed, t)}
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
  const lang = useLang();
  const t = useT();
  const m = session.metrics;
  const passed = m.passed === 1;
  const lesson = lessonByLevel(m.level ?? 1);

  return (
    <div>
      <PageHeader
        icon={<ExcelIcon className="h-8 w-8" />}
        title={t('Resulta ng Pagsusulit', 'Quiz results')}
        description={t(
          `Excel, Aralin ${lesson.level}: ${lessonTitle(lesson, lang)}`,
          `Excel, Lesson ${lesson.level}: ${lessonTitle(lesson, lang)}`,
        )}
      />

      <ResultSummary
        ready={passed}
        headline={
          lang === 'en' ? (
            <>
              You did <strong>{m.tasksDone}</strong> of <strong>{m.tasksTotal}</strong>
              {passed ? '. You passed this lesson!' : '.'}
            </>
          ) : (
            <>
              <strong>{m.tasksDone}</strong> sa <strong>{m.tasksTotal}</strong> ang nagawa mo
              {passed ? '. Pasado ka sa araling ito!' : '.'}
            </>
          )
        }
        message={
          passed
            ? t(
                'Puwede mo itong ulitin kahit kailan para lalong masanay ang mga daliri.',
                'You can do it again any time to train your fingers even more.',
              )
            : t(
                `Kailangan ng ${QUIZ_PASS} sa ${m.tasksTotal} para pumasa. Balikan ang aralin (may hint doon), tapos subukan ulit.`,
                `You need ${QUIZ_PASS} of ${m.tasksTotal} to pass. Go back to the lesson (it has hints), then try again.`,
              )
        }
      >
        {passed ? (
          <>
            <Button size="lg" onClick={onList} autoFocus>
              {t('Bumalik sa mga aralin', 'Back to the lessons')}
            </Button>
            <Button size="lg" variant="secondary" onClick={onRetryQuiz}>
              {t('Ulitin ang pagsusulit', 'Retake the quiz')}
            </Button>
          </>
        ) : (
          <>
            <Button size="lg" onClick={onLesson} autoFocus>
              {t('Balikan ang aralin', 'Go back to the lesson')}
            </Button>
            <Button size="lg" variant="secondary" onClick={onRetryQuiz}>
              {t('Ulitin ang pagsusulit', 'Retake the quiz')}
            </Button>
          </>
        )}
      </ResultSummary>

      <Section title={t('Mga detalye', 'Details')} className="mb-10">
        <div className="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-3">
          <StatBadge
            label={t('Nagawa', 'Done')}
            value={t(`${m.tasksDone} sa ${m.tasksTotal}`, `${m.tasksDone} of ${m.tasksTotal}`)}
            hint={t(`${QUIZ_PASS} ang kailangan`, `${QUIZ_PASS} needed`)}
          />
          <StatBadge
            label={t('Gamit ang shortcut', 'With the shortcut')}
            value={t(`${m.tasksShortcut} sa ${m.tasksTotal}`, `${m.tasksShortcut} of ${m.tasksTotal}`)}
            hint={t('hindi kailangan, pero mas mabilis', 'not required, but faster')}
          />
          <StatBadge
            label={t('Tagal', 'Time')}
            value={formatClock(session.durationSec)}
            hint={t('walang oras na limit', 'no time limit')}
          />
        </div>
      </Section>

      <ExcelMistakesCard mistakes={session.mistakes} labels={lesson.labels(lang)} />
    </div>
  );
}
