/**
 * Assessment: every skill in a row, under fixed exam-like rules, then a
 * report card. Always saved, so improvement over time is honest.
 *
 * Steps: intro -> typing -> break -> numpad -> report
 * (A past report can also be opened from the history list on the intro.)
 */
import { useEffect, useMemo, useState } from 'react';
import { Button, Card, PageHeader } from '../../components/ui';
import { display } from '../../lib/scoring';
import { makeRng, randomSeed } from '../../lib/random';
import type { Session } from '../../lib/storage';
import { saveSession, useAppData } from '../../lib/useAppData';
import NumpadRunner from '../numpad/NumpadRunner';
import { buildMixedPassage, charsNeeded } from '../typing/buildPassage';
import TypingRunner from '../typing/TypingRunner';
import AssessmentReport from './AssessmentReport';
import { ASSESSMENT, buildAssessmentSession, previousAssessment } from './evaluate';

type Step =
  | { name: 'intro' }
  | { name: 'typing' }
  | { name: 'break'; typing: Session }
  | { name: 'numpad'; typing: Session }
  | { name: 'report'; assessment: Session; fromHistory: boolean };

function Rules() {
  return (
    <ul className="list-disc space-y-1 pl-5 text-slate-800">
      <li>
        <strong>Part 1 — Typing, 1 minute.</strong> A mix of plain sentences, names and addresses, and numbers.
      </li>
      <li>
        <strong>Part 2 — Numpad, 1 minute.</strong> A mix of whole numbers, amounts, and reference numbers.
      </li>
      <li>No live stats, no "Finish now", and no retry once a part starts — just like a real hiring test.</li>
      <li>Each part's timer starts on your first keystroke. There is a short break between parts.</li>
      <li>Your result is always saved so you can see your real progress. Don't leave this page until the report appears.</li>
    </ul>
  );
}

function History({ sessions, onOpen }: { sessions: Session[]; onOpen: (s: Session) => void }) {
  if (sessions.length === 0) {
    return <p className="text-slate-700">No assessments yet. Your first report will appear here.</p>;
  }
  return (
    <table className="w-full text-left text-sm">
      <thead className="text-slate-600">
        <tr>
          <th className="py-2 pr-4 font-medium">Date</th>
          <th className="py-2 pr-4 font-medium">Result</th>
          <th className="py-2 pr-4 font-medium">Net WPM</th>
          <th className="py-2 pr-4 font-medium">Typing acc.</th>
          <th className="py-2 pr-4 font-medium">KPH</th>
          <th className="py-2 pr-4 font-medium">Entry acc.</th>
          <th className="py-2 font-medium">
            <span className="sr-only">Open</span>
          </th>
        </tr>
      </thead>
      <tbody className="tabular-nums">
        {sessions.map((s) => (
          <tr key={s.id} className="border-t border-slate-100">
            <td className="py-2 pr-4 text-slate-700">
              {new Date(s.startedAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
            </td>
            <td className="py-2 pr-4">
              {s.metrics.jobReady === 1 ? '✅ Job-ready' : `${s.metrics.targetsMet}/${s.metrics.targetsTotal} targets`}
            </td>
            <td className="py-2 pr-4">{display(s.metrics.typingNetWpm)}</td>
            <td className="py-2 pr-4">{display(s.metrics.typingAccuracy)}%</td>
            <td className="py-2 pr-4">{display(s.metrics.numpadKph).toLocaleString()}</td>
            <td className="py-2 pr-4">{display(s.metrics.numpadEntryAccuracy)}%</td>
            <td className="py-2">
              <button
                type="button"
                onClick={() => onOpen(s)}
                className="rounded text-blue-700 underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600"
              >
                View report
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function AssessmentPage() {
  const data = useAppData();
  const { sound } = data.settings;
  const [step, setStep] = useState<Step>({ name: 'intro' });
  const [seed, setSeed] = useState(randomSeed);

  const passage = useMemo(
    () => buildMixedPassage(makeRng(seed), charsNeeded(ASSESSMENT.typingSeconds / 60)),
    [seed],
  );

  const history = useMemo(
    () =>
      data.sessions
        .filter((s) => s.type === 'assessment')
        .sort((a, b) => b.startedAt.localeCompare(a.startedAt)),
    [data.sessions],
  );

  // Warn before closing or reloading the tab in the middle of a part.
  const inProgress = step.name === 'typing' || step.name === 'break' || step.name === 'numpad';
  useEffect(() => {
    if (!inProgress) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [inProgress]);

  function start() {
    setSeed(randomSeed());
    setStep({ name: 'typing' });
  }

  function finishNumpad(typing: Session, numpad: Session) {
    const assessment = buildAssessmentSession(typing, numpad);
    saveSession(assessment);
    setStep({ name: 'report', assessment, fromHistory: false });
  }

  if (step.name === 'report') {
    return (
      <AssessmentReport
        assessment={step.assessment}
        previous={previousAssessment(data.sessions, step.assessment)}
        onBack={() => setStep({ name: 'intro' })}
        backLabel={step.fromHistory ? 'Back to history' : 'Done'}
        onRetake={start}
      />
    );
  }

  if (step.name === 'typing') {
    return (
      <div>
        <PageHeader title="Assessment — Part 1 of 2: Typing" description="Type the passage exactly as shown. 1 minute." />
        <TypingRunner
          passage={passage}
          seconds={ASSESSMENT.typingSeconds}
          difficulty={0}
          showLiveStats={false}
          allowFinishEarly={false}
          sound={sound}
          onFinish={(typing) => setStep({ name: 'break', typing })}
        />
      </div>
    );
  }

  if (step.name === 'break') {
    return (
      <div>
        <PageHeader title="Part 1 done!" description="Take a breath. Your typing result is kept for the report." />
        <Card title="Next: Part 2 — Numpad (1 minute)">
          <p className="mb-4 text-slate-700">
            Turn on Num Lock and place your fingers on 4-5-6. Type each number and press Enter. Commas are
            optional. The timer starts on your first keystroke.
          </p>
          <Button autoFocus onClick={() => setStep({ name: 'numpad', typing: step.typing })}>
            Start Part 2
          </Button>
        </Card>
      </div>
    );
  }

  if (step.name === 'numpad') {
    return (
      <div>
        <PageHeader title="Assessment — Part 2 of 2: Numpad" description="Type each number and press Enter. 1 minute." />
        <NumpadRunner
          seconds={ASSESSMENT.numpadSeconds}
          difficulty={ASSESSMENT.numpadDifficulty}
          showLiveStats={false}
          allowFinishEarly={false}
          sound={sound}
          onFinish={(numpad) => finishNumpad(step.typing, numpad)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Assessment"
        description="Test every skill in one go, like a real Encoder / Data Entry hiring exam, and see if you're job-ready."
      />

      <Card title="How it works">
        <Rules />
        <div className="mt-5">
          <Button onClick={start}>Start assessment</Button>
        </div>
      </Card>

      <Card title="Your assessment history">
        <History
          sessions={history}
          onOpen={(assessment) => setStep({ name: 'report', assessment, fromHistory: true })}
        />
      </Card>
    </div>
  );
}
