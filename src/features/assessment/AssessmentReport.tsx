/**
 * The report card for one saved assessment (reworked 2026-09-27: the old
 * long page felt overwhelming). From top to bottom:
 * 1. Verdict + stamp + buttons.
 * 2. Scorecard: every part in one glance (each target with ✓ / ✗).
 * 3. "Ano ang aayusin": tips for the parts that are NOT passed yet, each with
 *    a practice button (or one short "keep going" line when job-ready).
 * 4. Details per part, folded (<details>); parts that need work start open.
 *    Each part's mistake list is inside its own details.
 */
import type { ReactNode } from 'react';
import { KphLevels, Stamp } from '../../components/ResultPieces';
import FieldMistakesCard from '../../components/entry/FieldMistakesCard';
import { AssessmentIcon, CopyIcon, DocumentIcon, DownloadIcon, KeyboardIcon, NumpadIcon } from '../../components/icons';
import { Button, ButtonLink, Card, PageHeader, StatBadge } from '../../components/ui';
import { HELP } from '../../lib/glossary';
import { display } from '../../lib/scoring';
import type { Session } from '../../lib/storage';
import { useAppData } from '../../lib/useAppData';
import { localDayKey } from '../dashboard/stats';
import { CopyMistakesCard } from '../copy/CopyResults';
import { ENCODING_FIELD_LABEL } from '../encoding/documents';
import { NumpadMistakesCard } from '../numpad/NumpadResults';
import { TypingMistakesCard } from '../typing/TypingResults';
import { assessmentCommentsBySection } from './comments';
import { downloadResultCard, resultCardData } from './resultCard';
import { assessmentChecks, assessmentCopyKph, hasCopyPart, hasEncodingPart, type Check } from './evaluate';

type Section = Check['section'];

const PARTS: Record<
  Section,
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

/** One part in the scorecard: its targets with ✓ / ✗. */
function ScoreTile({ section, checks }: { section: Section; checks: Check[] }) {
  const part = PARTS[section];
  const passed = checks.every((c) => c.pass);
  return (
    <div className={'rounded-xl border-2 bg-white p-4 ' + (passed ? 'border-green-300' : 'border-red-300')}>
      <div className="mb-2 flex items-center gap-2 font-bold text-stone-900">
        <span className="text-brand-700">{part.icon('h-5 w-5')}</span>
        {part.short}
        <span
          className={'ml-auto whitespace-nowrap text-sm font-semibold ' + (passed ? 'text-green-800' : 'text-red-700')}
        >
          {passed ? 'Pasado' : 'Hindi pa'}
        </span>
      </div>
      {/* One line per target: label on the left; ✓/✗, your number and the target on the right. */}
      <ul className="space-y-1">
        {checks.map((c) => (
          <li key={c.label} className="flex items-baseline justify-between gap-2">
            <span className="text-sm text-stone-600">{c.label}</span>
            <span className="whitespace-nowrap">
              <span aria-hidden="true" className={'mr-1 font-bold ' + (c.pass ? 'text-green-700' : 'text-red-600')}>
                {c.pass ? '✓' : '✗'}
              </span>
              <span className="text-lg font-bold tabular-nums text-stone-900">{fmt(c)}</span>
              <span className="text-sm text-stone-500">
                {' '}
                / {c.target.toLocaleString()}
                {c.unit}
              </span>
              <span className="sr-only">{c.pass ? ' pasado' : ' hindi pa pasado'}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** A part's details, folded; `open` when the part needs work. */
function PartDetails({
  section,
  passed,
  mistakeCount,
  children,
}: {
  section: Section;
  passed: boolean;
  mistakeCount: number;
  children: ReactNode;
}) {
  const part = PARTS[section];
  return (
    <details open={!passed} className="group rounded-xl border border-stone-200 bg-white shadow-sm">
      <summary className="flex cursor-pointer list-none items-center gap-3 rounded-xl px-5 py-4 text-lg font-bold text-stone-900 hover:bg-stone-50 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-brand-600 [&::-webkit-details-marker]:hidden">
        <span aria-hidden="true" className="inline-block text-brand-700 transition-transform group-open:rotate-90">
          ›
        </span>
        <span className="text-brand-700">{part.icon('h-6 w-6')}</span>
        Bahagi {part.number}: {part.title}
        <span className="ml-auto text-sm font-semibold text-stone-600">
          {mistakeCount > 0 ? `${mistakeCount} mali · ` : ''}
          <span className={passed ? 'text-green-800' : 'text-red-700'}>{passed ? 'Pasado' : 'Hindi pa'}</span>
        </span>
      </summary>
      <div className="space-y-5 border-t border-stone-200 px-5 py-5">{children}</div>
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
  const { sessions } = useAppData();
  const m = assessment.metrics;
  const p = previous?.metrics;
  const checks = assessmentChecks(m);
  const ready = m.jobReady === 1;
  const comments = assessmentCommentsBySection(assessment);
  const date = new Date(assessment.startedAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });

  // The parts this assessment has (older ones lack Copy Test / Document Encoding).
  const sections = (['typing', 'numpad', 'copy', 'encoding'] as Section[]).filter(
    (s) => (s !== 'copy' || hasCopyPart(m)) && (s !== 'encoding' || hasEncodingPart(m)),
  );
  const checksOf = (s: Section) => checks.filter((c) => c.section === s);
  const passedPart = (s: Section) => checksOf(s).every((c) => c.pass);
  const toFix = sections.filter((s) => !passedPart(s));
  const mistakesOf = (s: Section) => assessment.mistakes.filter((x) => x.section === s);

  return (
    <div>
      <PageHeader icon={<AssessmentIcon className="h-8 w-8" />} title="Resulta ng Assessment" description={date} />

      {/* 1. Verdict */}
      <section
        role="status"
        className={
          'mb-5 rounded-2xl border-2 p-6 ' +
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

      {/* 2. Scorecard */}
      <section aria-label="Scorecard" className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {sections.map((s) => (
          <ScoreTile key={s} section={s} checks={checksOf(s)} />
        ))}
      </section>

      {/* 3. What to fix (only the parts that are not passed yet) */}
      <Card title={toFix.length ? `Ano ang aayusin (${toFix.length})` : 'Ano ang susunod?'} className="mb-6">
        {toFix.length === 0 ? (
          <p className="text-lg text-stone-800">{comments.overall}</p>
        ) : (
          <ul className="space-y-5">
            {toFix.map((s) => (
              <li
                key={s}
                className="flex flex-col gap-3 border-l-4 border-red-300 pl-4 sm:flex-row sm:items-start sm:justify-between"
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
      </Card>

      {/* 4. Details per part (folded; the parts that need work start open) */}
      <h2 className="mb-3 text-xl font-bold text-stone-900">Mga detalye</h2>
      <div className="space-y-3">
        <PartDetails section="typing" passed={passedPart('typing')} mistakeCount={m.typingErrors ?? 0}>
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
          <TypingMistakesCard mistakes={mistakesOf('typing')} errors={m.typingErrors} />
        </PartDetails>

        <PartDetails section="numpad" passed={passedPart('numpad')} mistakeCount={mistakesOf('numpad').length}>
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
          <div>
            <h3 className="mb-2 text-lg font-bold text-stone-900">Antas ng bilis mo (KPH)</h3>
            <KphLevels kph={m.numpadKph} />
          </div>
          <NumpadMistakesCard mistakes={mistakesOf('numpad')} />
        </PartDetails>

        {/* Older assessments were only typing + numpad, so this part may be missing. */}
        {hasCopyPart(m) && (
          <PartDetails section="copy" passed={passedPart('copy')} mistakeCount={mistakesOf('copy').length}>
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
            <CopyMistakesCard title="Mga maling field" mistakes={mistakesOf('copy')} />
          </PartDetails>
        )}

        {/* Assessments from before Document Encoding don't have this part. */}
        {hasEncodingPart(m) && (
          <PartDetails section="encoding" passed={passedPart('encoding')} mistakeCount={mistakesOf('encoding').length}>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
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
            />
          </PartDetails>
        )}
      </div>
    </div>
  );
}
