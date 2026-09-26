/**
 * Document Encoding — PRACTICE mode. Read a fake document (Sales Invoice,
 * Delivery Receipt, or Application Form), find the key fields, and encode
 * them following the encoding rules (dates -> mm/dd/yyyy, amounts -> digits
 * only). Into either a SPREADSHEET (default, like an invoice log in Excel) or
 * a FORM (like a hiring test). The layout choice is shared with the Copy Test.
 * Results are saved by default (optional).
 * Two screens (components/Practice.tsx): setup (with the full rules), then
 * the drill (with a one-line reminder of the rules).
 */
import { useMemo, useState } from 'react';
import EntryFormRunner from '../../components/entry/EntryFormRunner';
import EntrySheetRunner from '../../components/entry/EntrySheetRunner';
import type { EntryResult } from '../../components/entry/types';
import { DocumentIcon } from '../../components/icons';
import { PracticeHeader, PracticeSetup } from '../../components/Practice';
import { SegmentedPicker } from '../../components/ui';
import type { CopyMode, Session } from '../../lib/storage';
import { removeSession, saveSession, updateSettings, useAppData } from '../../lib/useAppData';
import { DOC_INFO, DOC_TYPES, type DocType } from './documents';
import { encodingItems } from './encodingItems';
import EncodingResults from './EncodingResults';
import EncodingRules from './EncodingRules';
import { buildEncodingSession } from './scoreEncoding';

/** A document takes about 30-60 seconds, so the runs are longer than the Copy Test. */
const DURATIONS = [180, 300] as const;
type Seconds = (typeof DURATIONS)[number];

const durationLabel = (s: Seconds) => `${s / 60} minuto`;

const MODES: CopyMode[] = ['sheet', 'form'];
const MODE_LABEL: Record<CopyMode, string> = {
  sheet: 'Spreadsheet (gaya ng Excel)',
  form: 'Form (gaya ng hiring test)',
};

/** Spreadsheet column widths per document (the widest values get the most room). */
const COLUMN_WIDTHS: Record<DocType, Record<string, string>> = {
  invoice: { invoiceNo: 'w-[18%]', date: 'w-[14%]', customer: 'w-[30%]', terms: 'w-[20%]' },
  delivery: { drNo: 'w-[18%]', date: 'w-[14%]', deliverTo: 'w-[24%]', address: 'w-[32%]' },
  application: { lastName: 'w-[15%]', firstName: 'w-[18%]', birthDate: 'w-[14%]', address: 'w-[32%]', contactNo: 'w-[21%]' },
};

type Result = { session: Session; finishedEarly: boolean };

export default function EncodingPage() {
  const data = useAppData();
  const { sound } = data.settings;
  // Same layout setting as the Copy Test (default = spreadsheet).
  const mode: CopyMode = data.settings.copyMode ?? 'sheet';

  const [docType, setDocType] = useState<DocType>('invoice');
  const [seconds, setSeconds] = useState<Seconds>(180);
  const [screen, setScreen] = useState<'setup' | 'practice'>('setup');
  const [attempt, setAttempt] = useState(0); // changes to start a fresh run
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [saved, setSaved] = useState(false);

  // A new random source of documents for every run.
  // eslint-disable-next-line react-hooks/exhaustive-deps -- `attempt` is here on purpose: new documents for each try
  const nextItem = useMemo(() => encodingItems(docType), [docType, attempt]);

  function handleFinish({ submitted, unfinished, elapsedSec }: EntryResult, finishedEarly: boolean) {
    const session = buildEncodingSession(submitted, unfinished, elapsedSec, seconds, mode, docType);
    // Finished early = unrealistic speed, so don't save unless asked.
    const save = !finishedEarly;
    if (save) saveSession(session);
    setSaved(save);
    setRunning(false);
    setResult({ session, finishedEarly });
  }

  function toggleSaved() {
    if (!result) return;
    if (saved) removeSession(result.session.id);
    else saveSession(result.session);
    setSaved(!saved);
  }

  function restart() {
    setResult(null);
    setSaved(false);
    setRunning(false);
    setAttempt((n) => n + 1);
  }

  if (result) {
    return (
      <EncodingResults
        session={result.session}
        saved={saved}
        finishedEarly={result.finishedEarly}
        onToggleSaved={toggleSaved}
        onRetry={restart}
      />
    );
  }

  const runnerProps = {
    seconds,
    showLiveStats: true, // always shown in practice
    allowFinishEarly: true,
    sound,
    nextItem,
    unit: 'dokumento',
    onStart: () => setRunning(true),
    onFinish: handleFinish,
  };
  const runKey = `${mode}-${docType}-${seconds}-${attempt}`;

  if (screen === 'setup') {
    return (
      <PracticeSetup
        icon={<DocumentIcon className="h-8 w-8" />}
        title="Document Encoding"
        description="Basahin ang dokumento at i-encode ang mahahalagang detalye ayon sa patakaran."
        chooseTitle="Pumili ng dokumento, kung saan mag-e-encode, at gaano katagal"
        choices={
          <div className="space-y-4">
            <SegmentedPicker
              label="Anong dokumento?"
              options={DOC_TYPES}
              value={docType}
              format={(t) => DOC_INFO[t].label}
              onChange={setDocType}
            />
            <div className="flex flex-wrap items-end gap-6">
              <SegmentedPicker
                label="Saan ka mag-e-encode?"
                options={MODES}
                value={mode}
                format={(m) => MODE_LABEL[m]}
                onChange={(m) => updateSettings({ copyMode: m })}
              />
              <SegmentedPicker label="Gaano katagal?" options={DURATIONS} value={seconds} format={durationLabel} onChange={setSeconds} />
            </div>
          </div>
        }
        howTo={[
          `Hanapin sa dokumento ang 5 detalyeng hinihingi ng ${mode === 'form' ? 'form' : 'sheet'} — hindi lahat ng nasa papel ay ie-encode.`,
          'Sundin ang mga patakaran sa ibaba, lalo na sa petsa at halaga.',
          mode === 'sheet'
            ? 'Tab = susunod na cell. Enter sa dulo ng row = susunod na dokumento.'
            : 'Tab = susunod na field. Enter sa huling field = ipasa ang dokumento.',
        ]}
        extra={<EncodingRules />}
        onStart={() => setScreen('practice')}
      />
    );
  }

  return (
    <div>
      <PracticeHeader
        icon={<DocumentIcon className="h-6 w-6" />}
        title="Document Encoding"
        summary={`${DOC_INFO[docType].label} · ${MODE_LABEL[mode]} · ${durationLabel(seconds)}`}
        canChangeSettings={!running}
        onChangeSettings={() => setScreen('setup')}
      />
      <EncodingRules compact className="mb-4" />

      {mode === 'form' ? (
        <EntryFormRunner key={runKey} {...runnerProps} wideSource />
      ) : (
        <EntrySheetRunner key={runKey} {...runnerProps} columnWidths={COLUMN_WIDTHS[docType]} scrollSource />
      )}
    </div>
  );
}
