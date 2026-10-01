/**
 * The report card for one saved assessment (reworked 2026-09-27: the old
 * long page felt overwhelming). From top to bottom:
 * 1. Verdict + stamp + buttons.
 * 2. Scorecard: every part in one glance, one ruled row per part (each target with ✓ / ✗).
 * 3. "Ano ang aayusin": tips for the parts that are NOT passed yet, each with
 *    a practice button (or one short "keep going" line when job-ready).
 * 4. Details per part, folded (<details>); parts that need work start open.
 *    Each part's mistake list is inside its own details.
 */
import type { ReactNode } from 'react';
import { KphLevels, Stamp } from '../../components/ResultPieces';
import FieldMistakesCard from '../../components/entry/FieldMistakesCard';
import {
  AssessmentIcon,
  CheckIcon,
  CopyIcon,
  DocumentIcon,
  DownloadIcon,
  KeyboardIcon,
  NumpadIcon,
  QcIcon,
  XIcon,
} from '../../components/icons';
import { Button, ButtonLink, PageHeader, Section, StatBadge } from '../../components/ui';
import { listNumber } from '../../lib/listNumber';
import { HELP } from '../../lib/glossary';
import { display } from '../../lib/scoring';
import type { Session } from '../../lib/storage';
import { useAppData } from '../../lib/useAppData';
import { localDayKey } from '../dashboard/stats';
import { CopyMistakesCard } from '../copy/CopyResults';
import { ENCODING_FIELD_LABEL } from '../encoding/documents';
import { NumpadMistakesCard } from '../numpad/NumpadResults';
import { QcMistakesCard } from '../qc/QcResults';
import { TypingMistakesCard } from '../typing/TypingResults';
import { assessmentCommentsBySection } from './comments';
import { downloadResultCard, resultCardData } from './resultCard';
import { downloadBackup } from '../../lib/backup';
import { useT } from '../../lib/i18n';
import { notBackedUpSince } from '../../lib/reminders';
import { assessmentChecks, assessmentCopyKph, hasCopyPart, hasEncodingPart, hasQcPart, type Check } from './evaluate';

/** Which part of the Assessment (typing, numpad, copy, encoding). */
type PartKey = Check['section'];

const PARTS: Record<
  PartKey,
  { number: number; title: string; short: string; practice: string; to: string; icon: (c: string) => ReactNode }
> = {
  typing: {
    number: 1,
    title: 'Typing',
    short: 'Typing',
    practice: 'Typing Practice',
    to: '/typing',
    icon: (c) => <KeyboardIcon className={c} />,
  },
  numpad: {
    number: 2,
    title: 'Numpad',
    short: 'Numpad',
    practice: 'Numpad Practice',
    to: '/numpad',
    icon: (c) => <NumpadIcon className={c} />,
  },
  copy: {
    number: 3,
    title: 'Copy Test',
    short: 'Copy Test',
    practice: 'Copy Test',
    to: '/copy',
    icon: (c) => <CopyIcon className={c} />,
  },
  encoding: {
    number: 4,
    title: 'Document Encoding',
    short: 'Encoding',
    practice: 'Document Encoding',
    to: '/encoding',
    icon: (c) => <DocumentIcon className={c} />,
  },
  qc: {
    number: 5,
    title: 'QC Check',
    short: 'QC Check',
    practice: 'QC Check',
    to: '/qc',
    icon: (c) => <QcIcon className={c} />,
  },
};

/** "↑3 mula sa huli" / "↓2 mula sa huli" / "pareho sa huli" (rounded values). */
function change(now: number, before: number | undefined, unit = ''): string | undefined {
  if (before === undefined) return undefined;
  const diff = display(now) - display(before);
  if (diff === 0) return 'pareho sa huli';
  return `${diff > 0 ? '↑' : '↓'}${Math.abs(diff).toLocaleString()}${unit} mula sa huli`;
}

/** The part name is already the heading, so drop "Copy Test: " at the start of a tip (and start with a capital). */
function withoutPartName(text: string): string {
  const t = text.replace(/^(Typing|Numpad|Copy Test|Document Encoding): /, '');
  return t.charAt(0).toUpperCase() + t.slice(1);
}

const fmt = (c: Check) => `${display(c.value).toLocaleString()}${c.unit}`;

/** One ruled row of the scorecard: the part, then each target (✓/✗, your number / the target), then the verdict. */
function ScoreRow({ section, checks }: { section: PartKey; checks: Check[] }) {
  const part = PARTS[section];
  const passed = checks.every((c) => c.pass);
  return (
    <li className="grid grid-cols-[2.5rem_1fr_auto] items-center gap-x-4 gap-y-2 border-b border-stone-300 py-3 md:grid-cols-[2.5rem_13rem_1fr_1fr_6rem]">
      <span aria-hidden="true" className="font-display text-2xl font-semibold tabular-nums text-stone-400">
        {listNumber(part.number)}
      </span>
      <span className="flex items-center gap-2 text-lg font-bold text-stone-900">
        <span className="text-brand-700">{part.icon('h-5 w-5')}</span>
        {part.short}
      </span>
      <span
        className={
          'whitespace-nowrap text-right font-semibold md:order-last ' + (passed ? 'text-green-800' : 'text-red-700')
        }
      >
        {passed ? 'Pasado' : 'Hindi pa'}
      </span>
      {checks.map((c) => (
        <span key={c.label} className="col-start-2 col-end-4 md:col-auto">
          <span className="block text-sm text-stone-600">{c.label}</span>
          <span className="flex items-center gap-1.5 whitespace-nowrap">
            <span aria-hidden="true">
              {c.pass ? <CheckIcon className="h-5 w-5 text-green-700" /> : <XIcon className="h-5 w-5 text-red-700" />}
            </span>
            <span className="font-display text-xl font-bold tabular-nums text-stone-900">{fmt(c)}</span>
            <span className="text-sm text-stone-500">
              / {c.target.toLocaleString()}
              {c.unit}
            </span>
            <span className="sr-only">{c.pass ? ' pasado' : ' hindi pa pasado'}</span>
          </span>
        </span>
      ))}
    </li>
  );
}

/** A part's details, folded; `open` when the part needs work. */
function PartDetails({
  section,
  passed,
  mistakeCount,
  children,
}: {
  section: PartKey;
  passed: boolean;
  mistakeCount: number;
  children: ReactNode;
}) {
  const part = PARTS[section];
  return (
    <details open={!passed} className="group border-b border-stone-300">
      <summary className="flex cursor-pointer list-none items-center gap-3 px-1 py-4 text-lg font-bold text-stone-900 hover:bg-white/70 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-brand-600 [&::-webkit-details-marker]:hidden">
        <span aria-hidden="true" className="inline-block text-brand-700 transition-transform group-open:rotate-90">
          ›
        </span>
        <span className="text-brand-700">{part.icon('h-6 w-6')}</span>
        Bahagi {part.number}: {part.title}
        <span className="ml-auto text-sm font-semibold text-stone-600">
          {mistakeCount > 0 ? `${mistakeCount} mali, ` : ''}
          <span className={passed ? 'text-green-800' : 'text-red-700'}>{passed ? 'Pasado' : 'Hindi pa'}</span>
        </span>
      </summary>
      <div className="space-y-6 pb-6 pl-8 pr-1 pt-1">{children}</div>
    </details>
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
  const data = useAppData();
  const { sessions } = data;
  const t = useT();
  const m = assessment.metrics;
  const p = previous?.metrics;
  const checks = assessmentChecks(m);
  const ready = m.jobReady === 1;
  const comments = assessmentCommentsBySection(assessment);
  const date = new Date(assessment.startedAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });

  // The parts this assessment has (older ones lack Copy Test / Document Encoding).
  const sections = (['typing', 'numpad', 'copy', 'encoding', 'qc'] as PartKey[]).filter(
    (s) => (s !== 'copy' || hasCopyPart(m)) && (s !== 'encoding' || hasEncodingPart(m)) && (s !== 'qc' || hasQcPart(m)),
  );
  const checksOf = (s: PartKey) => checks.filter((c) => c.section === s);
  const passedPart = (s: PartKey) => checksOf(s).every((c) => c.pass);
  const toFix = sections.filter((s) => !passedPart(s));
  const mistakesOf = (s: PartKey) => assessment.mistakes.filter((x) => x.section === s);

  return (
    <div>
      <PageHeader icon={<AssessmentIcon className="h-8 w-8" />} title="Resulta ng Assessment" description={date} />

      {/* 1. Verdict */}
      <section
        role="status"
        className={
          'mb-10 rounded-r-lg border-l-4 py-6 pl-6 pr-5 ' +
          (ready ? 'border-green-600 bg-green-50 text-green-950' : 'border-amber-500 bg-amber-50 text-amber-950')
        }
      >
        {/* Text on the left, stamp on the right (stamp goes on top on small screens). */}
        <div className="flex flex-col-reverse gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-4xl font-bold">{ready ? 'Job-ready ka na!' : 'Hindi pa job-ready'}</h2>
            <p className="mt-2 text-xl">
              <strong>
                {m.targetsMet} sa {m.targetsTotal}
              </strong>{' '}
              na target ang pasado.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Button size="lg" onClick={onBack} autoFocus>
                {backLabel}
              </Button>
              <Button size="lg" variant="secondary" onClick={onRetake}>
                Subukan ulit
              </Button>
              {/* A PNG "result card" to keep or share (a practice result, not a certificate). */}
              <Button
                size="lg"
                variant="secondary"
                onClick={() =>
                  downloadResultCard(resultCardData(assessment, sessions), localDayKey(new Date(assessment.startedAt)))
                }
              >
                <DownloadIcon className="h-5 w-5" /> I-download (larawan)
              </Button>
            </div>
          </div>
          <div className="shrink-0 px-4 py-2 md:px-6">
            <Stamp passed={ready} />
          </div>
        </div>
      </section>

      {/* The belt lives only in this browser: offer the backup right here until this assessment is in one. */}
      {notBackedUpSince(data.settings.lastBackupAt, assessment) && (
        <div
          role="status"
          className="-mt-6 mb-10 flex flex-wrap items-center gap-x-5 gap-y-3 rounded-r-lg border-l-4 border-brand-600 bg-brand-50 px-5 py-3 text-stone-900"
        >
          <p className="min-w-0 flex-1 basis-80">
            {t(
              'I-download ang backup para hindi mawala ang resultang ito at ang belt mo. Sa browser na ito lang sila naka-save.',
              'Download a backup so this result and your belt are not lost. They are saved only in this browser.',
            )}
          </p>
          <Button variant="secondary" onClick={() => downloadBackup(data)}>
            <DownloadIcon className="h-5 w-5" /> {t('I-download ang backup', 'Download a backup')}
          </Button>
        </div>
      )}

      {/* 2. Scorecard */}
      <Section title="Scorecard" className="mb-10">
        <ol className="-mt-4">
          {sections.map((s) => (
            <ScoreRow key={s} section={s} checks={checksOf(s)} />
          ))}
        </ol>
      </Section>

      {/* 3. What to fix (only the parts that are not passed yet) */}
      <Section title={toFix.length ? `Ano ang aayusin (${toFix.length})` : 'Ano ang susunod?'} className="mb-10">
        {toFix.length === 0 ? (
          <p className="text-lg text-stone-800">{comments.overall}</p>
        ) : (
          <ul className="space-y-5">
            {toFix.map((s) => (
              <li
                key={s}
                className="flex flex-col gap-3 border-l-4 border-red-400 pl-4 sm:flex-row sm:items-start sm:justify-between"
              >
                <div>
                  <div className="flex items-center gap-2 font-bold text-stone-900">
                    <span className="text-brand-700">{PARTS[s].icon('h-5 w-5')}</span>
                    {PARTS[s].title}
                  </div>
                  <ul className="mt-1 space-y-1 text-lg text-stone-800">
                    {comments[s].map((c) => (
                      <li key={c}>{withoutPartName(c)}</li>
                    ))}
                  </ul>
                </div>
                <div className="shrink-0">
                  <ButtonLink to={PARTS[s].to} variant="secondary">
                    Mag-practice ng {PARTS[s].practice}
                  </ButtonLink>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Section>

      {/* 4. Details per part (folded; the parts that need work start open) */}
      <Section title="Mga detalye">
        <div className="-mt-4">
          <PartDetails section="typing" passed={passedPart('typing')} mistakeCount={m.typingErrors ?? 0}>
            <div className="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-4">
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
            <TypingMistakesCard mistakes={mistakesOf('typing')} errors={m.typingErrors} nested />
          </PartDetails>

          <PartDetails section="numpad" passed={passedPart('numpad')} mistakeCount={mistakesOf('numpad').length}>
            <div className="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-3">
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
              <StatBadge
                label="Natapos na numero"
                value={m.numpadEntries}
                hint={`${m.numpadCorrectEntries} ang tama`}
              />
            </div>
            <Section title="Antas ng bilis mo (KPH)" small>
              <KphLevels kph={m.numpadKph} />
            </Section>
            <NumpadMistakesCard mistakes={mistakesOf('numpad')} nested />
          </PartDetails>

          {/* Older assessments were only typing + numpad, so this part may be missing. */}
          {hasCopyPart(m) && (
            <PartDetails section="copy" passed={passedPart('copy')} mistakeCount={mistakesOf('copy').length}>
              <div className="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-4">
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
              <CopyMistakesCard title="Mga maling field" mistakes={mistakesOf('copy')} nested />
            </PartDetails>
          )}

          {/* Assessments from before Document Encoding don't have this part. */}
          {hasEncodingPart(m) && (
            <PartDetails
              section="encoding"
              passed={passedPart('encoding')}
              mistakeCount={mistakesOf('encoding').length}
            >
              <div className="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-3">
                <StatBadge
                  label="Tamang field"
                  value={`${display(m.encodingFieldAccuracy)}%`}
                  hint={
                    p && hasEncodingPart(p) ? change(m.encodingFieldAccuracy, p.encodingFieldAccuracy, '%') : undefined
                  }
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
              <FieldMistakesCard
                mistakes={mistakesOf('encoding')}
                labels={ENCODING_FIELD_LABEL}
                unitLabel="Dokumento"
                title="Mga maling field"
                nested
              />
            </PartDetails>
          )}

          {/* Assessments from before QC Check don't have this part. */}
          {hasQcPart(m) && (
            <PartDetails section="qc" passed={passedPart('qc')} mistakeCount={mistakesOf('qc').length}>
              <div className="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-4">
                <StatBadge
                  label="Tamang check"
                  value={`${display(m.qcDecisionAccuracy)}%`}
                  hint={p && hasQcPart(p) ? change(m.qcDecisionAccuracy, p.qcDecisionAccuracy, '%') : undefined}
                  help={HELP.qcAccuracy}
                />
                <StatBadge
                  label="Bilis (bawat minuto)"
                  value={display(m.qcPerMinute)}
                  hint={p && hasQcPart(p) ? change(m.qcPerMinute, p.qcPerMinute) : 'record'}
                  help={HELP.qcSpeed}
                />
                <StatBadge label="Hindi napansin" value={m.qcMissed} hint={`sa ${m.qcErrorsTotal} na mali`} />
                <StatBadge
                  label="Tama pero minarkahan"
                  value={m.qcFalseAlarms}
                  hint={`${m.qcRecords} record ang na-check`}
                />
              </div>
              <QcMistakesCard mistakes={mistakesOf('qc')} nested />
            </PartDetails>
          )}
        </div>
      </Section>
    </div>
  );
}
