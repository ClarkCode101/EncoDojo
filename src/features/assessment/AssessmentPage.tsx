/**
 * Assessment: every skill in a row, under fixed exam-like rules, then a
 * report card. Saved automatically, so improvement over time is honest
 * (it can be deleted later from the history).
 *
 * Steps: intro -> typing -> break -> numpad -> report
 * (A past report can also be opened from the history list on the intro.)
 */
import { useEffect, useMemo, useState } from 'react';
import { AssessmentIcon, ClockIcon, KeyboardIcon, NumpadIcon } from '../../components/icons';
import { Button, Card, ConfirmButton, HelpTip, PageHeader } from '../../components/ui';
import { HELP } from '../../lib/glossary';
import { display } from '../../lib/scoring';
import { makeRng, randomSeed } from '../../lib/random';
import type { Session } from '../../lib/storage';
import { clearSessions, removeSession, saveSession, useAppData } from '../../lib/useAppData';
import NumpadRunner from '../numpad/NumpadRunner';
import { PLAIN_TEXT_LEVEL, buildPassage, charsNeeded } from '../typing/buildPassage';
import TypingRunner from '../typing/TypingRunner';
import AssessmentReport from './AssessmentReport';
import { ASSESSMENT, buildAssessmentSession, previousAssessment } from './evaluate';

type Step =
  | { name: 'intro' }
  | { name: 'typing' }
  | { name: 'break'; typing: Session }
  | { name: 'numpad'; typing: Session }
  | { name: 'report'; assessment: Session; fromHistory: boolean };

/** "Bahagi 1 sa 2" with a simple two-part progress bar. */
function PartProgress({ part }: { part: 1 | 2 }) {
  return (
    <div className="mb-6">
      <div className="mb-2 text-base font-semibold text-stone-700">Bahagi {part} sa 2</div>
      <div className="flex gap-2" aria-hidden="true">
        <div className="h-3 flex-1 rounded-full bg-brand-700" />
        <div className={'h-3 flex-1 rounded-full ' + (part === 2 ? 'bg-brand-700' : 'bg-stone-300')} />
      </div>
    </div>
  );
}

function Rules() {
  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
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
      </div>

      <div>
        <h3 className="mb-2 text-lg font-bold text-stone-900">Mga paalala</h3>
        <ul className="list-disc space-y-1 pl-6 text-stone-800">
          <li>Parang totoong exam: walang score habang nagta-type, walang &quot;Tapusin na&quot;, at walang ulitan kapag nasimulan na.</li>
          <li>Magsisimula ang oras sa unang pindot mo. May pahinga sa pagitan ng dalawang bahagi.</li>
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

  const passage = useMemo(
    () => buildPassage(makeRng(seed), PLAIN_TEXT_LEVEL, charsNeeded(ASSESSMENT.typingSeconds / 60)),
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
        backLabel={step.fromHistory ? 'Bumalik sa listahan' : 'Tapos na'}
        onRetake={start}
      />
    );
  }

  if (step.name === 'typing') {
    return (
      <div>
        <PageHeader
          icon={<KeyboardIcon className="h-8 w-8" />}
          title="Assessment: Typing"
          description="I-type ang text nang eksakto. 1 minuto."
        />
        <PartProgress part={1} />
        <TypingRunner
          passage={passage}
          seconds={ASSESSMENT.typingSeconds}
          level={PLAIN_TEXT_LEVEL}
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
        <PageHeader
          icon={<ClockIcon className="h-8 w-8" />}
          title="Tapos na ang Bahagi 1! 👏"
          description="Magpahinga muna saglit. Naka-save na ang typing result mo para sa report."
        />
        <PartProgress part={2} />
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
      <div>
        <PageHeader
          icon={<NumpadIcon className="h-8 w-8" />}
          title="Assessment: Numpad"
          description="I-type ang bawat numero at pindutin ang Enter. 1 minuto."
        />
        <PartProgress part={2} />
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
        icon={<AssessmentIcon className="h-8 w-8" />}
        title="Assessment"
        description="Parang totoong hiring exam para sa Encoder / Data Entry. Sa dulo, malalaman mo kung job-ready ka na at kung ano pa ang dapat i-practice."
      />

      <Card title="Paano ito gumagana">
        <Rules />
        <div className="mt-6 flex flex-wrap items-center gap-4">
          <Button size="lg" onClick={start}>
            Simulan ang Assessment
          </Button>
          <span className="text-stone-600">Mga 2 minuto lang ito.</span>
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
