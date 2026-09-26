/**
 * The report card for one saved assessment: verdict, targets, comments,
 * change since the previous assessment, and the mistake lists.
 */
import type { ReactNode } from 'react';
import { TargetRow } from '../../components/ResultPieces';
import { Button, ButtonLink, Card, PageHeader, StatBadge } from '../../components/ui';
import { display } from '../../lib/scoring';
import type { Session } from '../../lib/storage';
import { NumpadMistakesCard } from '../numpad/NumpadResults';
import { TypingMistakesCard } from '../typing/TypingResults';
import { assessmentComments } from './comments';
import { assessmentChecks } from './evaluate';

/** "↑3" / "↓2" / "same" compared with the previous assessment (rounded values). */
function change(now: number, before: number | undefined, unit = ''): string | undefined {
  if (before === undefined) return undefined;
  const diff = display(now) - display(before);
  if (diff === 0) return 'same as last time';
  return `${diff > 0 ? '↑' : '↓'}${Math.abs(diff).toLocaleString()}${unit} vs last time`;
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card title={title} className="mb-6">
      {children}
    </Card>
  );
}

export default function AssessmentReport({
  assessment,
  previous,
  onBack,
  backLabel,
  onRetake,
}: {
  assessment: Session;
  previous: Session | null;
  onBack: () => void;
  backLabel: string;
  onRetake: () => void;
}) {
  const m = assessment.metrics;
  const p = previous?.metrics;
  const checks = assessmentChecks(m);
  const ready = m.jobReady === 1;
  const date = new Date(assessment.startedAt).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  return (
    <div>
      <PageHeader title="Assessment Report" description={date} />

      <div
        role="status"
        className={
          'mb-6 rounded-lg border-2 px-5 py-4 ' +
          (ready ? 'border-green-600 bg-green-50 text-green-900' : 'border-amber-500 bg-amber-50 text-amber-900')
        }
      >
        <div className="text-2xl font-bold">{ready ? '✅ Job-ready' : 'Not job-ready yet'}</div>
        <div className="mt-1">
          {m.targetsMet} of {m.targetsTotal} targets met
        </div>
      </div>

      <Section title="What to work on">
        <ul className="list-disc space-y-2 pl-5 text-slate-800">
          {assessmentComments(assessment).map((comment) => (
            <li key={comment}>{comment}</li>
          ))}
        </ul>
      </Section>

      <Section title="Part 1 — Typing (1 min)">
        <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatBadge label="Net WPM" value={display(m.typingNetWpm)} hint={change(m.typingNetWpm, p?.typingNetWpm)} />
          <StatBadge
            label="Accuracy"
            value={`${display(m.typingAccuracy)}%`}
            hint={change(m.typingAccuracy, p?.typingAccuracy, '%')}
          />
          <StatBadge label="Keystroke accuracy" value={`${display(m.typingKeystrokeAccuracy)}%`} />
          <StatBadge label="Gross WPM" value={display(m.typingGrossWpm)} />
        </div>
        <ul className="space-y-2">
          {checks
            .filter((c) => c.section === 'typing')
            .map((c) => (
              <TargetRow key={c.label} label={c.label} value={c.value} target={c.target} unit={c.unit} />
            ))}
        </ul>
      </Section>

      <Section title="Part 2 — Numpad (1 min)">
        <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatBadge
            label="KPH"
            value={display(m.numpadKph).toLocaleString()}
            hint={change(m.numpadKph, p?.numpadKph)}
          />
          <StatBadge
            label="Entry accuracy"
            value={`${display(m.numpadEntryAccuracy)}%`}
            hint={change(m.numpadEntryAccuracy, p?.numpadEntryAccuracy, '%')}
          />
          <StatBadge label="Entries" value={m.numpadEntries} hint={`${m.numpadCorrectEntries} correct`} />
        </div>
        <ul className="space-y-2">
          {checks
            .filter((c) => c.section === 'numpad')
            .map((c) => (
              <TargetRow key={c.label} label={c.label} value={c.value} target={c.target} unit={c.unit} />
            ))}
        </ul>
      </Section>

      <div className="mb-6 flex flex-wrap gap-3">
        <Button onClick={onBack} autoFocus>
          {backLabel}
        </Button>
        <Button variant="secondary" onClick={onRetake}>
          Retake assessment
        </Button>
        <ButtonLink to="/typing" variant="secondary">
          Train typing
        </ButtonLink>
        <ButtonLink to="/numpad" variant="secondary">
          Train numpad
        </ButtonLink>
      </div>

      <div className="space-y-6">
        <TypingMistakesCard
          mistakes={assessment.mistakes.filter((x) => x.section === 'typing')}
          errors={m.typingErrors}
        />
        <NumpadMistakesCard mistakes={assessment.mistakes.filter((x) => x.section === 'numpad')} />
      </div>
    </div>
  );
}
