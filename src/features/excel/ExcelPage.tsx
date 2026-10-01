/**
 * Excel, a LEARNING TRACK ("Matuto", owner's decision 2026-09-27): not part
 * of the Assessment or the belt, and NO timer. Screens:
 * 1. list: the lessons, ONE clear button each ("Simulan" / "Ulitin"); the
 *    topics and the Pagsusulit are folded under "Mga bahagi at pagsusulit"
 *    (owner's choice, 2026-09-28: the list had too many things to click);
 * 2. lesson: the guide on the left, the sheet on the right (ExcelLesson);
 * 3. lessonDone: "Tapos na ang aralin", then the Pagsusulit;
 * 4. quiz: the Pagsusulit (ExcelQuiz), saved when finished;
 * 5. result: the Pagsusulit result (ExcelResults).
 */
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ResultSummary } from '../../components/ResultPieces';
import { ArrowRightIcon, ExcelIcon } from '../../components/icons';
import { PracticeFrame } from '../../components/Practice';
import { Button, ButtonLink, PageHeader } from '../../components/ui';
import { useLang, useT } from '../../lib/i18n';
import { listNumber } from '../../lib/listNumber';
import type { Session } from '../../lib/storage';
import { saveSession, useAppData } from '../../lib/useAppData';
import ExcelLesson from './ExcelLesson';
import ExcelQuiz from './ExcelQuiz';
import ExcelResults from './ExcelResults';
import { LESSONS, lessonByLevel, lessonTitle, passedLessons, type Lesson, type LessonContent } from './lessons';
import { QUIZ_PASS, QUIZ_TASKS } from './tasks';

/** Every screen except the list belongs to one lesson (`level`). */
type Screen =
  | { name: 'list' }
  | { name: 'lesson'; level: number; topic?: number }
  | { name: 'lessonDone'; level: number }
  | { name: 'quiz'; level: number }
  | { name: 'result'; session: Session };

/**
 * The content of a lesson: right away, or loaded first (the formula lessons
 * bring HyperFormula, so it is only downloaded when such a lesson opens).
 */
function useLessonContent(lesson: Lesson | null): LessonContent | null {
  const [loaded, setLoaded] = useState<{ level: number; content: LessonContent } | null>(null);
  useEffect(() => {
    if (!lesson || lesson.content || !lesson.load) return;
    let alive = true;
    lesson.load().then((content) => {
      if (alive) setLoaded({ level: lesson.level, content });
    });
    return () => {
      alive = false;
    };
  }, [lesson]);
  if (!lesson) return null;
  return lesson.content ?? (loaded?.level === lesson.level ? loaded.content : null);
}

export default function ExcelPage() {
  const lang = useLang();
  const t = useT();
  const passed = passedLessons(useAppData().sessions);
  // /excel?aralin=5 (the Kodigo's "Balikan" links) opens that lesson right away.
  const [params, setParams] = useSearchParams();
  const [screen, setScreen] = useState<Screen>(() => {
    const level = Number(params.get('aralin'));
    return LESSONS.some((l) => l.level === level && l.topics) ? { name: 'lesson', level } : { name: 'list' };
  });
  useEffect(() => {
    // Forget the link's lesson, so going back to the list and reloading shows the list.
    if (params.has('aralin')) setParams({}, { replace: true });
  }, [params, setParams]);
  const [attempt, setAttempt] = useState(0); // a new key = a fresh lesson / quiz
  const go = (s: Screen) => {
    setAttempt((n) => n + 1);
    setScreen(s);
  };
  const toList = () => go({ name: 'list' });
  const openLesson = screen.name === 'lesson' || screen.name === 'quiz' ? lessonByLevel(screen.level) : null;
  const content = useLessonContent(openLesson);

  if (screen.name === 'lesson' || screen.name === 'quiz') {
    const lesson = lessonByLevel(screen.level);
    if (!content) {
      return (
        <p role="status" className="py-10 text-lg text-stone-700">
          {t('Sandali lang, inihahanda ang aralin…', 'One moment, getting the lesson ready…')}
        </p>
      );
    }
    return (
      <PracticeFrame>
        {screen.name === 'lesson' ? (
          <ExcelLesson
            key={attempt}
            level={lesson.level}
            title={lessonTitle(lesson, lang)}
            content={content}
            startTopic={screen.topic ?? 0}
            onDone={() => go({ name: 'lessonDone', level: lesson.level })}
            onExit={toList}
          />
        ) : (
          <ExcelQuiz
            key={attempt}
            level={lesson.level}
            title={lessonTitle(lesson, lang)}
            content={content}
            onExit={toList}
            onFinish={(session) => {
              // A learning result is always saved (it can be deleted from the list on Home).
              saveSession(session);
              go({ name: 'result', session });
            }}
          />
        )}
      </PracticeFrame>
    );
  }

  if (screen.name === 'result') {
    const level = screen.session.metrics.level ?? 1;
    return (
      <ExcelResults
        session={screen.session}
        onRetryQuiz={() => go({ name: 'quiz', level })}
        onLesson={() => go({ name: 'lesson', level })}
        onList={toList}
      />
    );
  }

  if (screen.name === 'lessonDone') {
    const lesson = lessonByLevel(screen.level);
    return (
      <div>
        <PageHeader
          icon={<ExcelIcon className="h-8 w-8" />}
          title={t('Tapos na ang aralin!', 'Lesson done!')}
          description={t(
            `Aralin ${lesson.level}: ${lessonTitle(lesson, lang)}`,
            `Lesson ${lesson.level}: ${lessonTitle(lesson, lang)}`,
          )}
        />
        <ResultSummary
          ready
          headline={t(
            'Nasubukan mo na ang lahat ng itinuro sa araling ito.',
            'You have tried everything this lesson teaches.',
          )}
          message={t(
            `Handa ka na ba sa pagsusulit? ${QUIZ_TASKS} tanong, walang hint at walang oras. Pasado kapag ${QUIZ_PASS} ang tama.`,
            `Ready for the quiz? ${QUIZ_TASKS} questions, no hints and no time limit. You pass with ${QUIZ_PASS} correct.`,
          )}
        >
          <Button size="lg" autoFocus onClick={() => go({ name: 'quiz', level: lesson.level })}>
            {t('Simulan ang pagsusulit', 'Start the quiz')} <ArrowRightIcon className="h-5 w-5" />
          </Button>
          <Button size="lg" variant="secondary" onClick={() => go({ name: 'lesson', level: lesson.level })}>
            {t('Ulitin ang aralin', 'Redo the lesson')}
          </Button>
          <Button size="lg" variant="secondary" onClick={toList}>
            {t('Mga aralin', 'Lessons')}
          </Button>
        </ResultSummary>
      </div>
    );
  }

  // The list of lessons. The first lesson not passed yet is the suggested one (Enter starts it).
  const suggested = (LESSONS.find((l) => l.topics && !passed.has(l.level)) ?? LESSONS[0]).level;
  return (
    <div>
      <PageHeader
        icon={<ExcelIcon className="h-8 w-8" />}
        title="Excel"
        description={t(
          'Matuto ng Excel, isang aralin sa isang pagkakataon. Walang oras, at puwedeng ulitin kahit kailan.',
          'Learn Excel one lesson at a time. No timer, and you can redo any lesson any time.',
        )}
      />
      <div className="-mt-4 mb-6">
        <ButtonLink to="/excel/kodigo" variant="secondary">
          {t('Kodigo: lahat ng shortcut at formula', 'Cheat sheet: every shortcut and formula')}
        </ButtonLink>
      </div>

      <ol className="border-t-2 border-stone-800">
        {LESSONS.map((l) => (
          <LessonRow
            key={l.level}
            lesson={l}
            passed={passed.has(l.level)}
            suggested={l.level === suggested}
            onStart={(topic) => go({ name: 'lesson', level: l.level, topic })}
            onQuiz={() => go({ name: 'quiz', level: l.level })}
          />
        ))}
      </ol>

      <p className="mt-4 text-stone-600">
        {t(
          'Bawat aralin: maikling paliwanag, gagawin mo sa sheet (may tulong kapag nahirapan), tapos maikling pagsusulit. Para matuto lang ito, hindi kasama sa Assessment at sa belt.',
          'Each lesson: a short explanation, tasks on the sheet (with help when you get stuck), then a short quiz. This is for learning only, not part of the Assessment or the belt.',
        )}
      </p>
    </div>
  );
}

/** One lesson: number, title, a small "Pasado" mark, one main button; topics and quiz folded below. */
function LessonRow({
  lesson,
  passed,
  suggested,
  onStart,
  onQuiz,
}: {
  lesson: Lesson;
  passed: boolean;
  suggested: boolean;
  /** Start the lesson (at a topic, if given). */
  onStart: (topic?: number) => void;
  onQuiz: () => void;
}) {
  const lang = useLang();
  const t = useT();
  const ready = lesson.topics !== null;
  const topics = lesson.topics ? lesson.topics(lang) : null;
  return (
    <li className="border-b border-stone-300 py-4">
      <div className="grid grid-cols-[2.5rem_1fr_auto] items-center gap-x-4">
        <span aria-hidden="true" className="font-display text-2xl font-semibold tabular-nums text-stone-400">
          {listNumber(lesson.level)}
        </span>
        <span className="min-w-0">
          <span className={'text-lg font-bold ' + (ready ? 'text-stone-900' : 'text-stone-500')}>
            <span className="sr-only">{t(`Aralin ${lesson.level}: `, `Lesson ${lesson.level}: `)}</span>
            {lessonTitle(lesson, lang)}
          </span>
          {passed && (
            <span className="ml-2 rounded-full bg-green-100 px-2 py-0.5 text-sm font-semibold text-green-800">
              {t('Pasado', 'Passed')}
            </span>
          )}
          {!ready && <span className="ml-2 text-sm text-stone-500">{t('parating pa', 'coming soon')}</span>}
        </span>
        {ready && (
          <Button autoFocus={suggested} variant={suggested ? 'primary' : 'secondary'} onClick={() => onStart()}>
            {passed ? t('Ulitin', 'Redo') : t('Simulan', 'Start')}
          </Button>
        )}
      </div>

      {/* Folded: go straight to one topic, or straight to the Pagsusulit ("may alam na ako"). */}
      {topics && (
        <details className="group col-start-2 ml-14 mt-1">
          <summary className="inline-flex cursor-pointer list-none items-center gap-1 rounded text-sm text-brand-700 hover:text-brand-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-600 [&::-webkit-details-marker]:hidden">
            <span aria-hidden="true" className="inline-block transition-transform group-open:rotate-90">
              ›
            </span>
            {t('Mga bahagi at pagsusulit', 'Parts and quiz')}
          </summary>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {topics.map((tp, i) => (
              <button
                key={tp.title}
                type="button"
                onClick={() => onStart(i)}
                className="rounded-full border border-stone-300 bg-white px-3 py-1 text-sm text-stone-800 hover:border-stone-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-600"
              >
                <span className="font-display tabular-nums text-stone-500">{i + 1}</span> {tp.title}
              </button>
            ))}
            <button
              type="button"
              onClick={onQuiz}
              className="rounded-full border border-belt-400 bg-belt-50 px-3 py-1 text-sm font-semibold text-stone-900 hover:bg-belt-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-600"
            >
              {t('Pagsusulit', 'Quiz')}
            </button>
          </div>
        </details>
      )}
    </li>
  );
}
