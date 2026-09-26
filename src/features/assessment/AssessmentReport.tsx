/**
 * The report card for one saved assessment: verdict, targets, comments,
 * change since the previous assessment, and the mistake lists.
 */
import { KphLevels, Stamp, TargetRow } from '../../components/ResultPieces';
import FieldMistakesCard from '../../components/entry/FieldMistakesCard';
import { AssessmentIcon, CopyIcon, DocumentIcon, KeyboardIcon, NumpadIcon } from '../../components/icons';
import { Button, ButtonLink, Card, PageHeader, StatBadge } from '../../components/ui';
import { HELP } from '../../lib/glossary';
import { display } from '../../lib/scoring';
import type { Session } from '../../lib/storage';
import { CopyMistakesCard } from '../copy/CopyResults';
import { ENCODING_FIELD_LABEL } from '../encoding/documents';
import { NumpadMistakesCard } from '../numpad/NumpadResults';
import { TypingMistakesCard } from '../typing/TypingResults';
import { assessmentComments } from './comments';
import { assessmentChecks, assessmentCopyKph, hasCopyPart, hasEncodingPart, type Check } from './evaluate';

/** "↑3 mula sa huli" / "↓2 mula sa huli" / "pareho sa huli" (rounded values). */
function change(now: number, before: number | undefined, unit = ''): string | undefined {
  if (before === undefined) return undefined;
  const diff = display(now) - display(before);
  if (diff === 0) return 'pareho sa huli';
  return `${diff > 0 ? '↑' : '↓'}${Math.abs(diff).toLocaleString()}${unit} mula sa huli`;
}

function Targets({ checks }: { checks: Check[] }) {
  return (
    <ul className="mt-4 space-y-2">
      {checks.map((c) => (
        <TargetRow key={c.label} label={c.label} value={c.value} target={c.target} unit={c.unit} />
      ))}
    </ul>
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
      <PageHeader icon={<AssessmentIcon className="h-8 w-8" />} title="Resulta ng Assessment" description={date} />

      <section
        role="status"
        className={
          'mb-6 rounded-2xl border-2 p-6 ' +
          (ready ? 'border-green-500 bg-green-50 text-green-950' : 'border-amber-400 bg-amber-50 text-amber-950')
        }
      >
        {/* Text on the left, stamp on the right (stamp goes on top on small screens). */}
        <div className="flex flex-col-reverse gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-3xl font-bold">{ready ? '✅ Job-ready ka na!' : 'Hindi pa job-ready'}</div>
            <p className="mt-2 text-xl">
              <strong>
                {m.targetsMet} sa {m.targetsTotal}
              </strong>{' '}
              na target ang pasado.
              {!ready && " Ayos lang 'yan — tingnan sa ibaba kung ano ang dapat i-practice."}
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Button size="lg" onClick={onBack} autoFocus>
                {backLabel}
              </Button>
              <Button size="lg" variant="secondary" onClick={onRetake}>
                Subukan ulit
              </Button>
            </div>
          </div>
          <div className="shrink-0 px-4 py-2 md:px-6">
            <Stamp passed={ready} />
          </div>
        </div>
      </section>

      <Card title="Ano ang dapat i-practice?" className="mb-6">
        <ul className="space-y-3 text-lg text-stone-800">
          {assessmentComments(assessment).map((comment) => (
            <li key={comment} className="flex gap-3">
              <span aria-hidden="true" className="text-brand-700">
                •
              </span>
              <span>{comment}</span>
            </li>
          ))}
        </ul>
        <div className="mt-5 flex flex-wrap gap-3">
          <ButtonLink to="/typing" variant="secondary">
            <KeyboardIcon className="h-5 w-5" /> Typing Practice
          </ButtonLink>
          <ButtonLink to="/numpad" variant="secondary">
            <NumpadIcon className="h-5 w-5" /> Numpad Practice
          </ButtonLink>
          <ButtonLink to="/copy" variant="secondary">
            <CopyIcon className="h-5 w-5" /> Copy Test
          </ButtonLink>
          <ButtonLink to="/encoding" variant="secondary">
            <DocumentIcon className="h-5 w-5" /> Document Encoding
          </ButtonLink>
        </div>
      </Card>

      <Card title="Bahagi 1: Typing" icon={<KeyboardIcon />} className="mb-6">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatBadge
            label="Bilis (Net WPM)"
            value={display(m.typingNetWpm)}
            hint={change(m.typingNetWpm, p?.typingNetWpm)}
            help={HELP.netWpm}
          />
          <StatBadge
            label="Accuracy (tama)"
            value={`${display(m.typingAccuracy)}%`}
            hint={change(m.typingAccuracy, p?.typingAccuracy, '%')}
            help={HELP.accuracy}
          />
          <StatBadge
            label="Keystroke accuracy"
            value={`${display(m.typingKeystrokeAccuracy)}%`}
            help={HELP.keystrokeAccuracy}
          />
          <StatBadge label="Gross WPM" value={display(m.typingGrossWpm)} help={HELP.grossWpm} />
        </div>
        <Targets checks={checks.filter((c) => c.section === 'typing')} />
      </Card>

      <Card title="Bahagi 2: Numpad" icon={<NumpadIcon />} className="mb-6">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <StatBadge
            label="Bilis (KPH)"
            value={display(m.numpadKph).toLocaleString()}
            hint={change(m.numpadKph, p?.numpadKph)}
            help={HELP.kph}
          />
          <StatBadge
            label="Tamang numero"
            value={`${display(m.numpadEntryAccuracy)}%`}
            hint={change(m.numpadEntryAccuracy, p?.numpadEntryAccuracy, '%')}
            help={HELP.entryAccuracy}
          />
          <StatBadge label="Natapos na numero" value={m.numpadEntries} hint={`${m.numpadCorrectEntries} ang tama`} />
        </div>
        <Targets checks={checks.filter((c) => c.section === 'numpad')} />
        <div className="mt-6 border-t border-stone-200 pt-5">
          <h3 className="mb-2 text-lg font-bold text-stone-900">Antas ng bilis mo (KPH)</h3>
          <KphLevels kph={m.numpadKph} />
        </div>
      </Card>

      {/* Older assessments were only typing + numpad, so this part may be missing. */}
      {hasCopyPart(m) && (
        <Card title="Bahagi 3: Copy Test" icon={<CopyIcon />} className="mb-6">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatBadge
              label="Tamang field"
              value={`${display(m.copyFieldAccuracy)}%`}
              hint={change(m.copyFieldAccuracy, p?.copyFieldAccuracy, '%')}
              help={HELP.fieldAccuracy}
            />
            <StatBadge
              label="Bilis (KPH)"
              value={display(assessmentCopyKph(m)).toLocaleString()}
              hint={p && hasCopyPart(p) ? change(assessmentCopyKph(m), assessmentCopyKph(p)) : undefined}
              help={HELP.copyKph}
            />
            <StatBadge label="Net WPM" value={display(m.copyNetWpm)} help={HELP.copyWpm} />
            <StatBadge
              label="Natapos na record"
              value={m.copyRecords}
              hint={`${m.copyCorrectFields} sa ${m.copyTotalFields} field ang tama`}
            />
          </div>
          <Targets checks={checks.filter((c) => c.section === 'copy')} />
        </Card>
      )}

      {/* Assessments from before Document Encoding don't have this part. */}
      {hasEncodingPart(m) && (
        <Card title="Bahagi 4: Document Encoding" icon={<DocumentIcon />} className="mb-6">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <StatBadge
              label="Tamang field"
              value={`${display(m.encodingFieldAccuracy)}%`}
              hint={p && hasEncodingPart(p) ? change(m.encodingFieldAccuracy, p.encodingFieldAccuracy, '%') : undefined}
              help={HELP.fieldAccuracy}
            />
            <StatBadge
              label="Bilis (KPH)"
              value={display(m.encodingKph).toLocaleString()}
              hint={p && hasEncodingPart(p) ? change(m.encodingKph, p.encodingKph) : undefined}
              help={HELP.encodingKph}
            />
            <StatBadge
              label="Natapos na dokumento"
              value={m.encodingDocuments}
              hint={`${m.encodingCorrectFields} sa ${m.encodingTotalFields} field ang tama`}
            />
          </div>
          <Targets checks={checks.filter((c) => c.section === 'encoding')} />
        </Card>
      )}

      <div className="space-y-6">
        <TypingMistakesCard
          mistakes={assessment.mistakes.filter((x) => x.section === 'typing')}
          errors={m.typingErrors}
        />
        <NumpadMistakesCard mistakes={assessment.mistakes.filter((x) => x.section === 'numpad')} />
        {hasCopyPart(m) && (
          <CopyMistakesCard
            title="Copy Test: mga maling field"
            mistakes={assessment.mistakes.filter((x) => x.section === 'copy')}
          />
        )}
        {hasEncodingPart(m) && (
          <FieldMistakesCard
            mistakes={assessment.mistakes.filter((x) => x.section === 'encoding')}
            labels={ENCODING_FIELD_LABEL}
            unitLabel="Dokumento"
            title="Document Encoding: mga maling field"
          />
        )}
      </div>
    </div>
  );
}
