/**
 * Document Encoding — PRACTICE mode. Read a fake document (Sales Invoice,
 * Delivery Receipt, or Application Form), find the key fields, and encode
 * them following the encoding rules (dates -> mm/dd/yyyy, amounts -> digits
 * only). Into either a SPREADSHEET (default, like an invoice log in Excel) or
 * a FORM (like a hiring test). The layout choice is shared with the Copy Test.
 * Results are saved by default (optional).
 */
import { useMemo, useState } from 'react';
import EntryFormRunner from '../../components/entry/EntryFormRunner';
import EntrySheetRunner from '../../components/entry/EntrySheetRunner';
import type { EntryItem, EntryResult } from '../../components/entry/types';
import { DocumentIcon } from '../../components/icons';
import { Card, Kbd, PageHeader, SegmentedPicker, Step } from '../../components/ui';
import { makeRng, randomSeed } from '../../lib/random';
import type { CopyMode, Session } from '../../lib/storage';
import { removeSession, saveSession, updateSettings, useAppData } from '../../lib/useAppData';
import DocumentView from './DocumentView';
import { DOC_INFO, DOC_TYPES, expectedValues, makeDocument, type DocType } from './documents';
import EncodingResults from './EncodingResults';
import EncodingRules from './EncodingRules';
import { buildEncodingSession } from './scoreEncoding';

/** A document takes about 30-60 seconds, so the runs are longer than the Copy Test. */
const DURATIONS = [180, 300] as const;
type Seconds = (typeof DURATIONS)[number];

const durationLabel = (s: Seconds) => `${s / 60} minuto`;

const MODES: CopyMode[] = ['sheet', 'form'];
const MODE_INFO: Record<CopyMode, { label: string; description: string }> = {
  form: {
    label: 'Form (gaya ng hiring test)',
    description: 'Isang dokumento bawat form, gaya ng hiring test at ng software ng maraming kumpanya.',
  },
  sheet: {
    label: 'Spreadsheet (gaya ng Excel)',
    description: 'Isang row bawat dokumento, gaya ng "invoice log" o masterlist sa Excel o Google Sheets.',
  },
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
  const [attempt, setAttempt] = useState(0); // changes to start a fresh run
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [saved, setSaved] = useState(false);

  // A new random source of documents for every run.
  const nextItem = useMemo(() => {
    const rng = makeRng(randomSeed());
    return (): EntryItem => {
      const doc = makeDocument(rng, docType);
      return {
        title: DOC_INFO[docType].label,
        source: <DocumentView doc={doc} />,
        fields: DOC_INFO[docType].fields,
        expected: expectedValues(doc),
      };
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `attempt` is here on purpose: new documents for each try
  }, [docType, attempt]);

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

  return (
    <div>
      <PageHeader
        icon={<DocumentIcon className="h-8 w-8" />}
        title="Document Encoding"
        description="Basahin ang dokumento (invoice, delivery receipt, application form), hanapin ang mahahalagang detalye, at i-encode ayon sa patakaran. Practice lang ito."
      />

      <Card className="mb-6">
        <div className="space-y-6">
          <Step number={1} title="Pumili ng dokumento, kung saan mag-e-encode, at gaano katagal">
            <div className="flex flex-wrap items-end gap-6">
              <SegmentedPicker
                label="Anong dokumento?"
                options={DOC_TYPES}
                value={docType}
                format={(t) => DOC_INFO[t].label}
                disabled={running}
                onChange={setDocType}
              />
              <SegmentedPicker
                label="Saan ka mag-e-encode?"
                options={MODES}
                value={mode}
                format={(m) => MODE_INFO[m].label}
                disabled={running}
                onChange={(m) => updateSettings({ copyMode: m })}
              />
              <SegmentedPicker
                label="Gaano katagal?"
                options={DURATIONS}
                value={seconds}
                format={durationLabel}
                disabled={running}
                onChange={setSeconds}
              />
            </div>
            <p className="mt-3 rounded-lg bg-stone-100 px-4 py-2 text-stone-800">{MODE_INFO[mode].description}</p>
          </Step>
          <Step number={2} title="Hanapin ang 5 detalye sa dokumento at i-encode ayon sa patakaran">
            <p className="text-stone-700">
              Hindi lahat ng nasa dokumento ay ie-encode — ang nasa {mode === 'form' ? 'form' : 'header ng sheet'} lang.{' '}
              <Kbd>Tab</Kbd> para sa susunod na {mode === 'form' ? 'field' : 'cell'},{' '}
              {mode === 'form' ? (
                <>
                  <Kbd>Enter</Kbd> sa huling field para ipasa ang dokumento.
                </>
              ) : (
                <>
                  <Kbd>Enter</Kbd> sa dulo ng row para sa susunod na dokumento.
                </>
              )}
            </p>
          </Step>
        </div>
      </Card>

      <EncodingRules className="mb-6" />

      {mode === 'form' ? (
        <EntryFormRunner key={runKey} {...runnerProps} wideSource />
      ) : (
        <EntrySheetRunner key={runKey} {...runnerProps} columnWidths={COLUMN_WIDTHS[docType]} scrollSource />
      )}
    </div>
  );
}
