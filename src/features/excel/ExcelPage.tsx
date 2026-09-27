/**
 * Excel, a LEARNING TRACK ("Matuto", owner's decision 2026-09-27): not part
 * of the Assessment or the belt, and NO timer. Screens:
 * 1. list: the lessons (ready ones can be started; "Pasado na" once passed);
 * 2. lesson: Alamin + Subukan per topic (ExcelLesson);
 * 3. lessonDone: "Tapos na ang aralin", then the Pagsusulit;
 * 4. quiz: the Pagsusulit (ExcelQuiz), saved when finished;
 * 5. result: the Pagsusulit result (ExcelResults).
 * The Pagsusulit can also be started directly from the list ("May alam na ako").
 */
import { useState, type ReactNode } from 'react';
import { ResultSummary } from '../../components/ResultPieces';
import { ArrowRightIcon, ExcelIcon } from '../../components/icons';
import { PracticeFrame } from '../../components/Practice';
import { Button, PageHeader, Section } from '../../components/ui';
import { listNumber } from '../../lib/listNumber';
import type { Session } from '../../lib/storage';
import { saveSession, useAppData } from '../../lib/useAppData';
import ExcelLesson from './ExcelLesson';
import ExcelQuiz from './ExcelQuiz';
import ExcelResults from './ExcelResults';
import { LESSONS, lessonByLevel, passedLessons } from './lessons';
import { QUIZ_PASS, QUIZ_TASKS } from './tasks';

/** Every screen except the list belongs to one lesson (`level`). */
type Screen =
  | { name: 'list' }
  | { name: 'lesson'; level: number }
  | { name: 'lessonDone'; level: number }
  | { name: 'quiz'; level: number }
  | { name: 'result'; session: Session };

/** The small header of the lesson and quiz screens. */
function Header({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <header className="mb-3 flex shrink-0 flex-wrap items-center justify-between gap-3">
      <h1 className="flex items-center gap-3 text-2xl font-bold text-stone-900">
        <span className="hidden text-brand-700 sm:inline-flex">
          <ExcelIcon className="h-6 w-6" />
        </span>
        {title}
      </h1>
      <Button variant="secondary" onClick={onBack}>
        ‹ Mga aralin
      </Button>
    </header>
  );
}

export default function ExcelPage() {
  const passed = passedLessons(useAppData().sessions);
  const [screen, setScreen] = useState<Screen>({ name: 'list' });
  const [attempt, setAttempt] = useState(0); // a new key = a fresh lesson / quiz
  const go = (s: Screen) => {
    setAttempt((n) => n + 1);
    setScreen(s);
  };

  if (screen.name === 'lesson' || screen.name === 'quiz') {
    const lesson = lessonByLevel(screen.level);
    if (!lesson.content) return null;
    return (
      <PracticeFrame>
        <Header
          title={screen.name === 'lesson' ? `Aralin ${lesson.level}: ${lesson.title}` : `Pagsusulit: ${lesson.title}`}
          onBack={() => go({ name: 'list' })}
        />
        {screen.name === 'lesson' ? (
          <ExcelLesson
            key={attempt}
            content={lesson.content}
            onDone={() => go({ name: 'lessonDone', level: lesson.level })}
          />
        ) : (
          <ExcelQuiz
            key={attempt}
            level={lesson.level}
            content={lesson.content}
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
        onList={() => go({ name: 'list' })}
      />
    );
  }

  if (screen.name === 'lessonDone') {
    const lesson = lessonByLevel(screen.level);
    return (
      <div>
        <PageHeader
          icon={<ExcelIcon className="h-8 w-8" />}
          title="Tapos na ang aralin!"
          description={`Aralin ${lesson.level}: ${lesson.title}`}
        />
        <ResultSummary
          ready
          headline="Nasubukan mo na ang lahat ng shortcut sa araling ito."
          message={`Handa ka na ba sa pagsusulit? ${QUIZ_TASKS} tanong, walang hint at walang oras. Pasado kapag ${QUIZ_PASS} ang tama.`}
        >
          <Button size="lg" autoFocus onClick={() => go({ name: 'quiz', level: lesson.level })}>
            Simulan ang pagsusulit <ArrowRightIcon className="h-5 w-5" />
          </Button>
          <Button size="lg" variant="secondary" onClick={() => go({ name: 'lesson', level: lesson.level })}>
            Ulitin ang aralin
          </Button>
        </ResultSummary>
      </div>
    );
  }

  // The list of lessons
  return (
    <div>
      <PageHeader
        icon={<ExcelIcon className="h-8 w-8" />}
        title="Excel"
        description="Matuto ng Excel, isang aralin sa isang pagkakataon. Walang oras, puwedeng ulitin."
      />

      <Section title="Mga aralin" className="mb-10">
        <ol className="-mt-4">
          {LESSONS.map((l) => {
            const ready = l.content !== null;
            // The first lesson not passed yet gets the focus (Enter starts it).
            const suggested = l.level === (LESSONS.find((x) => x.content && !passed.has(x.level)) ?? LESSONS[0]).level;
            return (
              <LessonRow key={l.level} n={l.level} title={l.title} ready={ready} passed={passed.has(l.level)}>
                {ready && (
                  <>
                    <Button
                      autoFocus={suggested}
                      variant={suggested ? 'primary' : 'secondary'}
                      onClick={() => go({ name: 'lesson', level: l.level })}
                    >
                      {passed.has(l.level) ? 'Ulitin ang aralin' : 'Simulan ang aralin'}
                    </Button>
                    <Button variant="secondary" onClick={() => go({ name: 'quiz', level: l.level })}>
                      Pagsusulit
                    </Button>
                  </>
                )}
              </LessonRow>
            );
          })}
        </ol>
      </Section>

      <Section title="Paano ito gumagana">
        <ul className="list-disc space-y-1 pl-6 text-lg text-stone-800">
          <li>
            <strong>Alamin</strong>: maikling paliwanag at ang mga key. <strong>Subukan</strong>: gawin ito sa sheet.
            May hint at &quot;Ipakita kung paano&quot; kapag nahirapan.
          </li>
          <li>
            <strong>Pagsusulit</strong> sa dulo: {QUIZ_TASKS} tanong, walang hint. Pasado kapag {QUIZ_PASS} ang tama.
            Kung may alam ka na, puwede kang dumiretso sa pagsusulit.
          </li>
          <li>Para matuto lang ito. Hindi kasama sa Assessment at sa belt.</li>
        </ul>
      </Section>
    </div>
  );
}

function LessonRow({
  n,
  title,
  ready,
  passed,
  children,
}: {
  n: number;
  title: string;
  ready: boolean;
  passed: boolean;
  children: ReactNode;
}) {
  return (
    <li className="grid grid-cols-[2.5rem_1fr] items-center gap-x-4 gap-y-2 border-b border-stone-300 py-4 sm:grid-cols-[2.5rem_1fr_auto]">
      <span aria-hidden="true" className="font-display text-2xl font-semibold tabular-nums text-stone-400">
        {listNumber(n)}
      </span>
      <span className="min-w-0">
        <span className={'block text-lg font-bold ' + (ready ? 'text-stone-900' : 'text-stone-500')}>
          <span className="sr-only">Aralin {n}: </span>
          {title}
        </span>
        <span className="block text-stone-600">
          {!ready ? (
            'Parating pa'
          ) : passed ? (
            <span className="font-semibold text-green-800">Pasado na, puwedeng ulitin</span>
          ) : (
            'Hindi pa nasusubukan ang pagsusulit'
          )}
        </span>
      </span>
      {ready && <span className="col-start-2 flex flex-wrap gap-2 sm:col-start-auto">{children}</span>}
    </li>
  );
}
