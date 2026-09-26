/**
 * Assessment: every skill in a row, under fixed exam-like rules, then a
 * report card. Saved automatically, so improvement over time is honest
 * (it can be deleted later from the history).
 *
 * Steps: intro -> typing -> break -> numpad -> break -> copy -> break -> encoding -> report
 * (A past report can also be opened from the history list on the intro.)
 */
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import EntryFormRunner from '../../components/entry/EntryFormRunner';
import { AssessmentIcon, ClockIcon, CopyIcon, DocumentIcon, KeyboardIcon, NumpadIcon } from '../../components/icons';
import { PracticeFrame } from '../../components/Practice';
import { Button, Card, ConfirmButton, HelpTip, Kbd, Notice, PageHeader } from '../../components/ui';
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
import AssessmentReport from './AssessmentReport';
import { DEV_TOOLS, DevJumpPanel, blankPart, type JumpTarget } from './DevJump'; // TEMPORARY (DevJump)
import {
  ASSESSMENT,
  assessmentCopyKph,
  buildAssessmentSession,
  hasCopyPart,
  hasEncodingPart,
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
  | { name: 'report'; assessment: Session; fromHistory: boolean };

const TOTAL_PARTS = 4;

/**
 * One-line header for the parts and breaks: icon + title (+ a short note) on
 * the left, "Bahagi 2 sa 4" with a small progress bar on the right. Short, so
 * each part fits the window without scrolling.
 */
function PartHeader({ icon, title, note, part }: { icon: ReactNode; title: string; note?: string; part: number }) {
  return (
    <header className="mb-3 flex shrink-0 flex-wrap items-center justify-between gap-x-6 gap-y-2">
      <div className="flex min-w-0 items-center gap-3">
        <div className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-brand-800 sm:flex">
          {icon}
        </div>
        <h1 className="text-2xl font-bold text-stone-900">
          {title} {note && <span className="ml-1 text-base font-normal text-stone-600">{note}</span>}
        </h1>
      </div>
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
    </header>
  );
}

function Rules() {
  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="flex gap-3 rounded-xl bg-stone-50 p-4">
          <KeyboardIcon className="h-8 w-8 shrink-0 text-brand-700" />
          <div>
            <div className="text-lg font-bold">Bahagi 1: Typing (1 minuto)</div>
            <div className="text-stone-700">I-type ang ordinaryong text, gaya sa karaniwang hiring test.</div>
          </div>
        </div>
        <div className="flex gap-3 rounded-xl bg-stone-50 p-4">
          <NumpadIcon className="h-8 w-8 shrink-0 text-brand-700" />
          <div>
            <div className="text-lg font-bold">Bahagi 2: Numpad (1 minuto)</div>
            <div className="text-stone-700">I-type ang mga numero, halaga, at reference number.</div>
          </div>
        </div>
        <div className="flex gap-3 rounded-xl bg-stone-50 p-4">
          <CopyIcon className="h-8 w-8 shrink-0 text-brand-700" />
          <div>
            <div className="text-lg font-bold">Bahagi 3: Copy Test (2 minuto)</div>
            <div className="text-stone-700">Kopyahin ang pangalan, petsa, address, contact no., at ID sa form.</div>
          </div>
        </div>
        <div className="flex gap-3 rounded-xl bg-stone-50 p-4">
          <DocumentIcon className="h-8 w-8 shrink-0 text-brand-700" />
          <div>
            <div className="text-lg font-bold">Bahagi 4: Document Encoding (3 minuto)</div>
            <div className="text-stone-700">
              I-encode ang mahahalagang detalye mula sa invoice, delivery receipt, at application form.
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="mb-2 text-lg font-bold text-stone-900">Mga paalala</h3>
        <ul className="list-disc space-y-1 pl-6 text-stone-800">
          <li>Parang totoong exam: walang score habang nagta-type, walang &quot;Finish&quot; (tapusin nang maaga), at walang ulitan kapag nasimulan na.</li>
          <li>
            Sa totoong hiring test, karaniwang <strong>English</strong> ang instructions at mga label. Kaya dito, English
            ang mga label ng field at button (hal. <em>Name</em>, <em>Submit</em>), may Tagalog sa tabi para madaling
            maintindihan.
          </li>
          <li>Magsisimula ang oras sa unang pindot mo. May pahinga sa pagitan ng bawat bahagi.</li>
          <li>Huwag umalis sa page na ito hangga't hindi lumalabas ang resulta.</li>
          <li>Automatic na mase-save ang resulta. Puwede mo itong burahin mamaya sa listahan sa ibaba.</li>
        </ul>
      </div>
    </div>
  );
}

function History({ sessions, onOpen }: { sessions: Session[]; onOpen: (s: Session) => void }) {
  if (sessions.length === 0) {
    return <p className="text-lg text-stone-700">Wala ka pang nagagawang assessment. Dito lalabas ang mga resulta mo.</p>;
  }
  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-base">
          <thead className="text-stone-600">
            <tr>
              <th className="py-2 pr-4 font-semibold">Petsa</th>
              <th className="py-2 pr-4 font-semibold">Resulta</th>
              <th className="py-2 pr-4 font-semibold">Typing</th>
              <th className="py-2 pr-4 font-semibold">Numpad</th>
              <th className="py-2 pr-4 font-semibold">Copy</th>
              <th className="py-2 pr-4 font-semibold">Encoding</th>
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
                  {s.metrics.jobReady === 1
                    ? '✅ Job-ready'
                    : `${s.metrics.targetsMet} sa ${s.metrics.targetsTotal} pasado`}
                </td>
                <td className="py-3 pr-4">
                  {display(s.metrics.typingNetWpm)} WPM · {display(s.metrics.typingAccuracy)}%
                </td>
                <td className="py-3 pr-4">
                  {display(s.metrics.numpadKph).toLocaleString()} KPH · {display(s.metrics.numpadEntryAccuracy)}%
                </td>
                <td className="py-3 pr-4">
                  {hasCopyPart(s.metrics)
                    ? `${display(s.metrics.copyFieldAccuracy)}% · ${display(assessmentCopyKph(s.metrics)).toLocaleString()} KPH`
                    : '—'}
                </td>
                <td className="py-3 pr-4">
                  {hasEncodingPart(s.metrics)
                    ? `${display(s.metrics.encodingFieldAccuracy)}% · ${display(s.metrics.encodingKph).toLocaleString()} KPH`
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

      <div className="mt-5 flex justify-end border-t border-stone-200 pt-5">
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
    () =>
      data.sessions
        .filter((s) => s.type === 'assessment')
        .sort((a, b) => b.startedAt.localeCompare(a.startedAt)),
    [data.sessions],
  );

  // Warn before closing or reloading the tab in the middle of a part.
  const inProgress = step.name !== 'intro' && step.name !== 'report';
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

  function finishEncoding(typing: Session, numpad: Session, copy: Session, encoding: Session) {
    const assessment = buildAssessmentSession(typing, numpad, copy, encoding);
    if (!testRun) saveSession(assessment);
    setStep({ name: 'report', assessment, fromHistory: false });
  }

  // TEMPORARY (DevJump): start at a later part; skipped parts count as 0.
  function jump(to: JumpTarget) {
    setSeed(randomSeed());
    setTestRun(true);
    const typing = blankPart('typing');
    const numpad = blankPart('numpad');
    const copy = blankPart('copy');
    if (to === 'numpad') setStep({ name: 'numpad', typing });
    else if (to === 'copy') setStep({ name: 'copy', typing, numpad });
    else if (to === 'encoding') setStep({ name: 'encoding', typing, numpad, copy });
    else setStep({ name: 'report', assessment: buildAssessmentSession(typing, numpad, copy, blankPart('encoding')), fromHistory: false });
  }

  if (step.name === 'report') {
    return (
      <>
        {/* TEMPORARY (DevJump) */}
        {testRun && !step.fromHistory && (
          <Notice kind="warning" className="mb-4">
            🧪 TEST run: hindi ito na-save. 0 ang mga nilaktawang bahagi.
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
        <PartHeader icon={<KeyboardIcon className="h-6 w-6" />} title="Assessment: Typing" note="1 minuto" part={1} />
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
        <PartHeader icon={<ClockIcon className="h-6 w-6" />} title="Tapos na ang Bahagi 1! 👏" note="Magpahinga muna saglit." part={2} />
        <Card title="Susunod: Bahagi 2, Numpad (1 minuto)" icon={<NumpadIcon />}>
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
              Simulan ang Bahagi 2
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (step.name === 'numpad') {
    return (
      <PracticeFrame>
        <PartHeader icon={<NumpadIcon className="h-6 w-6" />} title="Assessment: Numpad" note="1 minuto" part={2} />
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
        <PartHeader icon={<ClockIcon className="h-6 w-6" />} title="Tapos na ang Bahagi 2! 👏" note="Magpahinga muna saglit." part={3} />
        <Card title="Susunod: Bahagi 3, Copy Test (2 minuto)" icon={<CopyIcon />}>
          <ol className="mb-5 list-decimal space-y-1 pl-6 text-lg text-stone-800">
            <li>Makikita mo ang isang record (pangalan, petsa, address, contact no., ID).</li>
            <li>Kopyahin ito nang EKSAKTO sa form — pati malalaking titik, tuldok, at comma.</li>
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
              Simulan ang Bahagi 3
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (step.name === 'copy') {
    return (
      <PracticeFrame>
        <PartHeader icon={<CopyIcon className="h-6 w-6" />} title="Assessment: Copy Test" note="2 minuto" part={3} />
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
        <PartHeader icon={<ClockIcon className="h-6 w-6" />} title="Tapos na ang Bahagi 3! 👏" note="Magpahinga muna saglit." part={4} />
        <Card title="Susunod: Bahagi 4, Document Encoding (3 minuto)" icon={<DocumentIcon />}>
          <ol className="mb-5 list-decimal space-y-1 pl-6 text-lg text-stone-800">
            <li>Makikita mo ang isang dokumento: invoice, delivery receipt, o application form (salitan).</li>
            <li>Hanapin sa dokumento ang 5 detalyeng hinihingi ng form. Hindi lahat ng nasa papel ay ie-encode.</li>
            <li>Sundin ang mga patakaran sa ibaba — lalo na sa petsa at halaga.</li>
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
              Simulan ang Bahagi 4
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (step.name === 'encoding') {
    return (
      <PracticeFrame>
        <PartHeader icon={<DocumentIcon className="h-6 w-6" />} title="Assessment: Document Encoding" note="3 minuto" part={4} />
        <EncodingRules compact className="mb-3" />
        <EntryFormRunner
          seconds={ASSESSMENT.encodingSeconds}
          showLiveStats={false}
          allowFinishEarly={false}
          sound={sound}
          nextItem={encodingNextItem}
          unit="dokumento"
          wideSource
          onFinish={({ submitted, unfinished, elapsedSec }) =>
            finishEncoding(
              step.typing,
              step.numpad,
              step.copy,
              buildEncodingSession(submitted, unfinished, elapsedSec, ASSESSMENT.encodingSeconds, 'form', 'mix'),
            )
          }
        />
      </PracticeFrame>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<AssessmentIcon className="h-8 w-8" />}
        title="Assessment"
        description="Parang totoong hiring exam para sa Encoder / Data Entry. Sa dulo, malalaman mo kung job-ready ka na at kung ano pa ang dapat i-practice."
      />

      {/* TEMPORARY (DevJump): localhost only */}
      {DEV_TOOLS && <DevJumpPanel onJump={jump} />}

      <Card title="Paano ito gumagana">
        <Rules />
        <div className="mt-6 flex flex-wrap items-center gap-4">
          <Button size="lg" onClick={start}>
            Simulan ang Assessment
          </Button>
          <span className="text-stone-600">Mga 8–10 minuto ito, kasama ang pahinga.</span>
        </div>
      </Card>

      <Card title="Mga dati mong resulta" icon={<ClockIcon />}>
        <History
          sessions={history}
          onOpen={(assessment) => setStep({ name: 'report', assessment, fromHistory: true })}
        />
      </Card>
    </div>
  );
}
