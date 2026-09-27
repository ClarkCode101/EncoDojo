/**
 * Assessment: every skill in a row, under fixed exam-like rules, then a
 * report card. Saved automatically, so improvement over time is honest
 * (it can be deleted later from the history).
 *
 * Steps: intro -> typing -> break -> numpad -> break -> copy -> break -> encoding -> break -> qc -> report
 * (A past report can also be opened from the history list on the intro.)
 */
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import EntryFormRunner from '../../components/entry/EntryFormRunner';
import {
  ArrowRightIcon,
  AssessmentIcon,
  CheckIcon,
  ClockIcon,
  CopyIcon,
  DocumentIcon,
  KeyboardIcon,
  NumpadIcon,
  QcIcon,
} from '../../components/icons';
import { PracticeFrame } from '../../components/Practice';
import { Button, ConfirmButton, HelpTip, Kbd, Notice, PageHeader, Section } from '../../components/ui';
import { listNumber } from '../../lib/listNumber';
import { HELP } from '../../lib/glossary';
import { display } from '../../lib/scoring';
import { makeRng, randomSeed } from '../../lib/random';
import type { Session } from '../../lib/storage';
import { clearSessions, removeSession, saveSession, useAppData } from '../../lib/useAppData';
import CopyRunner from '../copy/CopyRunner';
import { encodingItems } from '../encoding/encodingItems';
import EncodingRules from '../encoding/EncodingRules';
import { buildEncodingSession } from '../encoding/scoreEncoding';
import NumpadRunner from '../numpad/NumpadRunner';
import { PLAIN_TEXT_LEVEL, buildPassage, charsNeeded } from '../typing/buildPassage';
import TypingRunner from '../typing/TypingRunner';
import QcRunner from '../qc/QcRunner';
import { useFocusMode } from '../../lib/focusMode';
import { useSenseiQuiet } from '../sensei/quiet';
import AssessmentReport from './AssessmentReport';
import {
  DEV_TOOLS,
  DevJumpPanel,
  DevTimeUpButton,
  blankPart,
  samplePreset,
  type JumpTarget,
  type SamplePreset,
} from './DevJump'; // TEMPORARY (DevJump)
import {
  ASSESSMENT,
  assessmentCopyKph,
  buildAssessmentSession,
  hasCopyPart,
  hasEncodingPart,
  hasQcPart,
  previousAssessment,
} from './evaluate';

type Step =
  | { name: 'intro' }
  | { name: 'typing' }
  | { name: 'break1'; typing: Session }
  | { name: 'numpad'; typing: Session }
  | { name: 'break2'; typing: Session; numpad: Session }
  | { name: 'copy'; typing: Session; numpad: Session }
  | { name: 'break3'; typing: Session; numpad: Session; copy: Session }
  | { name: 'encoding'; typing: Session; numpad: Session; copy: Session }
  | { name: 'break4'; typing: Session; numpad: Session; copy: Session; encoding: Session }
  | { name: 'qc'; typing: Session; numpad: Session; copy: Session; encoding: Session }
  | { name: 'report'; assessment: Session; fromHistory: boolean };

const TOTAL_PARTS = 5;

/**
 * One-line header for the parts and breaks: icon + title (+ a short note) on
 * the left; "Itigil ang Assessment" and "Bahagi 2 sa 4" with a small progress
 * bar on the right. Short, so each part fits the window without scrolling.
 */
function PartHeader({
  icon,
  title,
  note,
  part,
  onCancel,
}: {
  icon: ReactNode;
  title: string;
  note?: string;
  part: number;
  onCancel: () => void;
}) {
  return (
    <header className="mb-3 flex shrink-0 flex-wrap items-center justify-between gap-x-6 gap-y-2">
      <div className="flex min-w-0 items-center gap-3">
        <span className="hidden text-brand-700 sm:inline-flex">{icon}</span>
        <h1 className="text-2xl font-bold text-stone-900">
          {title} {note && <span className="ml-1 text-base font-normal text-stone-600">{note}</span>}
        </h1>
      </div>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
        {/* Asks first; nothing is saved when the Assessment is stopped. */}
        <ConfirmButton
          label="Itigil ang Assessment"
          question="Itigil? Hindi mase-save ang nagawa mo."
          confirmLabel="Oo, itigil"
          onConfirm={onCancel}
        />
        <div className="w-56">
          <div className="mb-1 text-sm font-semibold text-stone-700">
            Bahagi {part} sa {TOTAL_PARTS}
          </div>
          <div className="flex gap-1.5" aria-hidden="true">
            {Array.from({ length: TOTAL_PARTS }, (_, i) => (
              <div key={i} className={'h-2.5 flex-1 rounded-full ' + (i < part ? 'bg-brand-700' : 'bg-stone-300')} />
            ))}
          </div>
        </div>
      </div>
    </header>
  );
}

/** The four parts, in order. */
const PARTS = [
  {
    icon: <KeyboardIcon className="h-5 w-5" />,
    title: 'Typing',
    minutes: 1,
    text: 'Ordinaryong text, gaya sa karaniwang hiring test.',
  },
  {
    icon: <NumpadIcon className="h-5 w-5" />,
    title: 'Numpad',
    minutes: 1,
    text: 'Mga numero, halaga at reference number.',
  },
  {
    icon: <CopyIcon className="h-5 w-5" />,
    title: 'Copy Test',
    minutes: 2,
    text: 'Pangalan, petsa, address, contact no. at ID, sa form.',
  },
  {
    icon: <DocumentIcon className="h-5 w-5" />,
    title: 'Document Encoding',
    minutes: 3,
    text: 'Mga detalye mula sa invoice, delivery receipt at application form.',
  },
  {
    icon: <QcIcon className="h-5 w-5" />,
    title: 'QC Check',
    minutes: 2,
    text: 'Hanapin ang mali sa na-encode ng iba.',
  },
];

function Rules() {
  return (
    <>
      <Section title="Limang bahagi" className="mb-10">
        {/* Ruled rows like the "Ensayo" list on Home. */}
        <ol className="-mt-4">
          {PARTS.map((p, i) => (
            <li
              key={p.title}
              className="grid grid-cols-[2.5rem_1fr_auto] items-center gap-x-4 border-b border-stone-300 py-3"
            >
              <span aria-hidden="true" className="font-display text-2xl font-semibold tabular-nums text-stone-400">
                {listNumber(i + 1)}
              </span>
              <span>
                <span className="flex items-center gap-2 text-lg font-bold text-stone-900">
                  <span className="text-brand-700">{p.icon}</span>
                  <span className="sr-only">Bahagi {i + 1}: </span>
                  {p.title}
                </span>
                <span className="block text-stone-600">{p.text}</span>
              </span>
              <span className="whitespace-nowrap text-stone-700">{p.minutes} minuto</span>
            </li>
          ))}
        </ol>
      </Section>

      <Section title="Tandaan" className="mb-8">
        <ul className="list-disc space-y-1 pl-6 text-lg text-stone-800">
          <li>Parang totoong exam: walang score habang ginagawa, walang &quot;Finish&quot;, at walang ulitan.</li>
          <li>
            <strong>English</strong> ang mga label (hal. <em>Name</em>, <em>Submit</em>), gaya sa totoong hiring test.
            May Tagalog sa tabi.
          </li>
          <li>Magsisimula ang oras sa unang pindot mo. May pahinga pagkatapos ng bawat bahagi.</li>
          <li>Huwag umalis sa page hangga&apos;t wala pa ang resulta. Automatic itong mase-save.</li>
        </ul>
      </Section>
    </>
  );
}

function History({ sessions, onOpen }: { sessions: Session[]; onOpen: (s: Session) => void }) {
  if (sessions.length === 0) {
    return (
      <p className="text-lg text-stone-700">Wala ka pang nagagawang assessment. Dito lalabas ang mga resulta mo.</p>
    );
  }
  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-base">
          <thead className="text-sm text-stone-600">
            <tr>
              <th className="py-2 pr-4 font-semibold">Petsa</th>
              <th className="py-2 pr-4 font-semibold">Resulta</th>
              <th className="py-2 pr-4 font-semibold">Typing</th>
              <th className="py-2 pr-4 font-semibold">Numpad</th>
              <th className="py-2 pr-4 font-semibold">Copy</th>
              <th className="py-2 pr-4 font-semibold">Encoding</th>
              <th className="py-2 pr-4 font-semibold">QC</th>
              <th className="py-2 font-semibold">
                <span className="sr-only">Mga aksyon</span>
              </th>
            </tr>
          </thead>
          <tbody className="tabular-nums">
            {sessions.map((s) => (
              <tr key={s.id} className="border-t border-stone-200">
                <td className="py-3 pr-4 text-stone-700">
                  {new Date(s.startedAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                </td>
                <td className="py-3 pr-4 font-semibold">
                  {s.metrics.jobReady === 1 ? (
                    <span className="inline-flex items-center gap-1 text-green-800">
                      <CheckIcon className="h-5 w-5" /> Job-ready
                    </span>
                  ) : (
                    `${s.metrics.targetsMet} sa ${s.metrics.targetsTotal} pasado`
                  )}
                </td>
                <td className="py-3 pr-4">
                  {display(s.metrics.typingNetWpm)} WPM, {display(s.metrics.typingAccuracy)}%
                </td>
                <td className="py-3 pr-4">
                  {display(s.metrics.numpadKph).toLocaleString()} KPH, {display(s.metrics.numpadEntryAccuracy)}%
                </td>
                <td className="py-3 pr-4">
                  {hasCopyPart(s.metrics)
                    ? `${display(s.metrics.copyFieldAccuracy)}%, ${display(assessmentCopyKph(s.metrics)).toLocaleString()} KPH`
                    : '—'}
                </td>
                <td className="py-3 pr-4">
                  {hasEncodingPart(s.metrics)
                    ? `${display(s.metrics.encodingFieldAccuracy)}%, ${display(s.metrics.encodingKph).toLocaleString()} KPH`
                    : '—'}
                </td>
                <td className="py-3 pr-4">
                  {hasQcPart(s.metrics)
                    ? `${display(s.metrics.qcDecisionAccuracy)}%, ${display(s.metrics.qcPerMinute)}/min`
                    : '—'}
                </td>
                <td className="py-3">
                  <div className="flex flex-wrap items-center justify-end gap-2">
                    <Button size="sm" variant="secondary" onClick={() => onOpen(s)}>
                      Tingnan
                    </Button>
                    <ConfirmButton
                      size="sm"
                      label="Burahin"
                      question="Burahin ito?"
                      onConfirm={() => removeSession(s.id)}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex justify-end">
        <ConfirmButton
          label="Burahin lahat ng assessment"
          question={
            sessions.length === 1 ? 'Burahin ang 1 assessment?' : `Burahin lahat ng ${sessions.length} assessment?`
          }
          confirmLabel="Oo, burahin lahat"
          onConfirm={() => clearSessions(['assessment'])}
        />
      </div>
    </>
  );
}

export default function AssessmentPage() {
  const data = useAppData();
  const { sound } = data.settings;
  const [step, setStep] = useState<Step>({ name: 'intro' });
  const [seed, setSeed] = useState(randomSeed);
  // TEMPORARY (DevJump): a test run started from the jump buttons is not saved.
  const [testRun, setTestRun] = useState(false);

  const passage = useMemo(
    () => buildPassage(makeRng(seed), PLAIN_TEXT_LEVEL, charsNeeded(ASSESSMENT.typingSeconds / 60)),
    [seed],
  );

  // A new mix of documents (invoice -> delivery -> application, repeated) for each attempt.
  // eslint-disable-next-line react-hooks/exhaustive-deps -- `seed` is here on purpose: new documents for each attempt
  const encodingNextItem = useMemo(() => encodingItems('mix'), [seed]);

  const history = useMemo(
    () => data.sessions.filter((s) => s.type === 'assessment').sort((a, b) => b.startedAt.localeCompare(a.startedAt)),
    [data.sessions],
  );

  // Warn before closing or reloading the tab in the middle of a part.
  const inProgress = step.name !== 'intro' && step.name !== 'report';
  // Sensei stays hidden during the whole Assessment (parts and breaks).
  useSenseiQuiet(inProgress);
  // "Exam mode": the sidebar is hidden while the Assessment is running.
  useFocusMode(inProgress);
  useEffect(() => {
    if (!inProgress) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [inProgress]);

  function start() {
    setSeed(randomSeed());
    setTestRun(false);
    setStep({ name: 'typing' });
  }

  function finishQc(typing: Session, numpad: Session, copy: Session, encoding: Session, qc: Session) {
    const assessment = buildAssessmentSession(typing, numpad, copy, encoding, qc);
    if (!testRun) saveSession(assessment);
    setStep({ name: 'report', assessment, fromHistory: false });
  }

  /** "Itigil ang Assessment": back to the start; nothing is saved. */
  function cancel() {
    setTestRun(false);
    setStep({ name: 'intro' });
  }

  // TEMPORARY (DevJump): start at a later part; skipped parts count as 0.
  function jump(to: JumpTarget) {
    setSeed(randomSeed());
    setTestRun(true);
    const typing = blankPart('typing');
    const numpad = blankPart('numpad');
    const copy = blankPart('copy');
    const encoding = blankPart('encoding');
    if (to === 'typing') setStep({ name: 'typing' });
    else if (to === 'break1') setStep({ name: 'break1', typing });
    else if (to === 'numpad') setStep({ name: 'numpad', typing });
    else if (to === 'break2') setStep({ name: 'break2', typing, numpad });
    else if (to === 'copy') setStep({ name: 'copy', typing, numpad });
    else if (to === 'break3') setStep({ name: 'break3', typing, numpad, copy });
    else if (to === 'encoding') setStep({ name: 'encoding', typing, numpad, copy });
    else if (to === 'break4') setStep({ name: 'break4', typing, numpad, copy, encoding });
    else setStep({ name: 'qc', typing, numpad, copy, encoding });
  }

  // TEMPORARY (DevJump): a made-up report (not saved).
  function sampleReport(preset: SamplePreset) {
    setTestRun(true);
    const p = samplePreset(preset);
    setStep({
      name: 'report',
      assessment: buildAssessmentSession(p.typing, p.numpad, p.copy, p.encoding, p.qc),
      fromHistory: false,
    });
  }

  if (step.name === 'report') {
    return (
      <>
        {/* TEMPORARY (DevJump) */}
        {DEV_TOOLS && testRun && !step.fromHistory && (
          <Notice kind="warning" className="mb-4">
            🧪 TEST: hindi ito na-save.
          </Notice>
        )}
        <AssessmentReport
          assessment={step.assessment}
          previous={previousAssessment(data.sessions, step.assessment)}
          onBack={() => setStep({ name: 'intro' })}
          backLabel={step.fromHistory ? 'Bumalik sa listahan' : 'Tapos na'}
          onRetake={start}
        />
      </>
    );
  }

  if (step.name === 'typing') {
    return (
      <PracticeFrame>
        <PartHeader
          onCancel={cancel}
          icon={<KeyboardIcon className="h-6 w-6" />}
          title="Assessment: Typing"
          note="1 minuto"
          part={1}
        />
        {DEV_TOOLS && testRun && <DevTimeUpButton />} {/* TEMPORARY (DevJump) */}
        <TypingRunner
          passage={passage}
          seconds={ASSESSMENT.typingSeconds}
          level={PLAIN_TEXT_LEVEL}
          showLiveStats={false}
          allowFinishEarly={false}
          sound={sound}
          onFinish={(typing) => setStep({ name: 'break1', typing })}
        />
      </PracticeFrame>
    );
  }

  if (step.name === 'break1') {
    return (
      <div>
        <PartHeader
          onCancel={cancel}
          icon={<ClockIcon className="h-6 w-6" />}
          title="Tapos na ang Bahagi 1."
          note="Magpahinga muna saglit."
          part={2}
        />
        <Section title="Susunod: Bahagi 2, Numpad (1 minuto)" className="mt-6">
          <ol className="mb-5 list-decimal space-y-1 pl-6 text-lg text-stone-800">
            <li>
              Siguraduhing naka-ON ang <strong>Num Lock</strong>.
            </li>
            <li>Ilagay ang mga daliri sa 4-5-6 ng numpad.</li>
            <li>
              I-type ang bawat numero at pindutin ang <strong>Enter</strong>. Hindi kailangan ang comma.
            </li>
          </ol>
          <HelpTip label="Nasaan ang numpad?">{HELP.numpad}</HelpTip>
          <div className="mt-6">
            <Button size="lg" autoFocus onClick={() => setStep({ name: 'numpad', typing: step.typing })}>
              Simulan ang Bahagi 2 <ArrowRightIcon className="h-5 w-5" />
            </Button>
          </div>
        </Section>
      </div>
    );
  }

  if (step.name === 'numpad') {
    return (
      <PracticeFrame>
        <PartHeader
          onCancel={cancel}
          icon={<NumpadIcon className="h-6 w-6" />}
          title="Assessment: Numpad"
          note="1 minuto"
          part={2}
        />
        {DEV_TOOLS && testRun && <DevTimeUpButton />} {/* TEMPORARY (DevJump) */}
        <NumpadRunner
          seconds={ASSESSMENT.numpadSeconds}
          difficulty={ASSESSMENT.numpadDifficulty}
          showLiveStats={false}
          allowFinishEarly={false}
          sound={sound}
          onFinish={(numpad) => setStep({ name: 'break2', typing: step.typing, numpad })}
        />
      </PracticeFrame>
    );
  }

  if (step.name === 'break2') {
    return (
      <div>
        <PartHeader
          onCancel={cancel}
          icon={<ClockIcon className="h-6 w-6" />}
          title="Tapos na ang Bahagi 2."
          note="Magpahinga muna saglit."
          part={3}
        />
        <Section title="Susunod: Bahagi 3, Copy Test (2 minuto)" className="mt-6">
          <ol className="mb-5 list-decimal space-y-1 pl-6 text-lg text-stone-800">
            <li>Makikita mo ang isang record (pangalan, petsa, address, contact no., ID).</li>
            <li>Kopyahin ito nang EKSAKTO sa form, pati malalaking titik, tuldok at comma.</li>
            <li>
              Pindutin ang <Kbd>Tab</Kbd> para lumipat sa susunod na field. Sa huling field, pindutin ang{' '}
              <Kbd>Enter</Kbd> para ipasa ang record at lalabas ang susunod.
            </li>
          </ol>
          <HelpTip label="Ano ang field accuracy?">{HELP.fieldAccuracy}</HelpTip>
          <div className="mt-6">
            <Button
              size="lg"
              autoFocus
              onClick={() => setStep({ name: 'copy', typing: step.typing, numpad: step.numpad })}
            >
              Simulan ang Bahagi 3 <ArrowRightIcon className="h-5 w-5" />
            </Button>
          </div>
        </Section>
      </div>
    );
  }

  if (step.name === 'copy') {
    return (
      <PracticeFrame>
        <PartHeader
          onCancel={cancel}
          icon={<CopyIcon className="h-6 w-6" />}
          title="Assessment: Copy Test"
          note="2 minuto"
          part={3}
        />
        {DEV_TOOLS && testRun && <DevTimeUpButton />} {/* TEMPORARY (DevJump) */}
        <CopyRunner
          seconds={ASSESSMENT.copySeconds}
          showLiveStats={false}
          allowFinishEarly={false}
          sound={sound}
          onFinish={(copy) => setStep({ name: 'break3', typing: step.typing, numpad: step.numpad, copy })}
        />
      </PracticeFrame>
    );
  }

  if (step.name === 'break3') {
    return (
      <div>
        <PartHeader
          onCancel={cancel}
          icon={<ClockIcon className="h-6 w-6" />}
          title="Tapos na ang Bahagi 3."
          note="Magpahinga muna saglit."
          part={4}
        />
        <Section title="Susunod: Bahagi 4, Document Encoding (3 minuto)" className="mt-6">
          <ol className="mb-5 list-decimal space-y-1 pl-6 text-lg text-stone-800">
            <li>Makikita mo ang isang dokumento: invoice, delivery receipt, o application form (salitan).</li>
            <li>Hanapin sa dokumento ang 5 detalyeng hinihingi ng form. Hindi lahat ng nasa papel ay ie-encode.</li>
            <li>Sundin ang mga patakaran sa ibaba, lalo na sa petsa at halaga.</li>
            <li>
              <Kbd>Tab</Kbd> para sa susunod na field, <Kbd>Enter</Kbd> sa huling field para ipasa ang dokumento.
            </li>
          </ol>
          <EncodingRules />
          <div className="mt-6">
            <Button
              size="lg"
              autoFocus
              onClick={() => setStep({ name: 'encoding', typing: step.typing, numpad: step.numpad, copy: step.copy })}
            >
              Simulan ang Bahagi 4 <ArrowRightIcon className="h-5 w-5" />
            </Button>
          </div>
        </Section>
      </div>
    );
  }

  if (step.name === 'encoding') {
    return (
      <PracticeFrame>
        <PartHeader
          onCancel={cancel}
          icon={<DocumentIcon className="h-6 w-6" />}
          title="Assessment: Document Encoding"
          note="3 minuto"
          part={4}
        />
        {DEV_TOOLS && testRun && <DevTimeUpButton />} {/* TEMPORARY (DevJump) */}
        <EntryFormRunner
          seconds={ASSESSMENT.encodingSeconds}
          showLiveStats={false}
          allowFinishEarly={false}
          sound={sound}
          nextItem={encodingNextItem}
          unit="dokumento"
          wideSource
          onFinish={({ submitted, unfinished, elapsedSec }) =>
            setStep({
              name: 'break4',
              typing: step.typing,
              numpad: step.numpad,
              copy: step.copy,
              encoding: buildEncodingSession(
                submitted,
                unfinished,
                elapsedSec,
                ASSESSMENT.encodingSeconds,
                'form',
                'mix',
              ),
            })
          }
        />
      </PracticeFrame>
    );
  }

  if (step.name === 'break4') {
    return (
      <div>
        <PartHeader
          onCancel={cancel}
          icon={<ClockIcon className="h-6 w-6" />}
          title="Tapos na ang Bahagi 4."
          note="Huling bahagi na."
          part={5}
        />
        <Section title="Susunod: Bahagi 5, QC Check (2 minuto)" className="mt-6">
          <ol className="mb-5 list-decimal space-y-1 pl-6 text-lg text-stone-800">
            <li>Makikita mo ang Original na record at ang Encoded (na-type ng ibang tao).</li>
            <li>
              Ihambing ang bawat field. Markahan ang may mali: i-click ang row o pindutin ang numero nito (1 hanggang
              5).
            </li>
            <li>
              Pindutin ang <Kbd>Enter</Kbd> para ipasa ang record. Walang minarkahan = walang mali.
            </li>
          </ol>
          <HelpTip label="Ano ang tamang check?">{HELP.qcAccuracy}</HelpTip>
          <div className="mt-6">
            <Button
              size="lg"
              autoFocus
              onClick={() =>
                setStep({
                  name: 'qc',
                  typing: step.typing,
                  numpad: step.numpad,
                  copy: step.copy,
                  encoding: step.encoding,
                })
              }
            >
              Simulan ang Bahagi 5 <ArrowRightIcon className="h-5 w-5" />
            </Button>
          </div>
        </Section>
      </div>
    );
  }

  if (step.name === 'qc') {
    return (
      <PracticeFrame>
        <PartHeader
          onCancel={cancel}
          icon={<QcIcon className="h-6 w-6" />}
          title="Assessment: QC Check"
          note="2 minuto"
          part={5}
        />
        {DEV_TOOLS && testRun && <DevTimeUpButton />} {/* TEMPORARY (DevJump) */}
        <QcRunner
          seconds={ASSESSMENT.qcSeconds}
          showLiveStats={false}
          allowFinishEarly={false}
          sound={sound}
          onFinish={(qc) => finishQc(step.typing, step.numpad, step.copy, step.encoding, qc)}
        />
      </PracticeFrame>
    );
  }

  return (
    <div>
      <PageHeader
        icon={<AssessmentIcon className="h-8 w-8" />}
        title="Assessment"
        description="Parang totoong hiring exam para sa Encoder / Data Entry. Sa dulo, malalaman mo kung job-ready ka na."
      />

      {/* TEMPORARY (DevJump): localhost only */}
      {DEV_TOOLS && <DevJumpPanel onJump={jump} onSampleReport={sampleReport} />}

      <Rules />

      {/* The start button, set apart with a gold edge like the Assessment row on Home. */}
      <div className="mb-12 flex flex-wrap items-center gap-x-5 gap-y-3 rounded-r-lg border-l-4 border-belt-400 bg-belt-50 px-5 py-5">
        <Button size="lg" onClick={start}>
          Simulan ang Assessment <ArrowRightIcon className="h-5 w-5" />
        </Button>
        <span className="text-stone-700">Mga 10 hanggang 12 minuto, kasama ang pahinga.</span>
      </div>

      <Section title="Mga dati mong resulta">
        <History
          sessions={history}
          onOpen={(assessment) => setStep({ name: 'report', assessment, fromHistory: true })}
        />
      </Section>
    </div>
  );
}
