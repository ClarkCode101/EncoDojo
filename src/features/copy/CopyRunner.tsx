/**
 * One Copy Test run, in either layout:
 * - 'form': a record card beside a form (like hiring tests / company software),
 * - 'sheet': the record above an Excel-like sheet, one row per record.
 * Used by Copy Test practice and the Assessment (always 'form' there).
 *
 * The typing, keys, and timer live in the shared entry runners
 * (components/entry); this file only supplies the records and turns the
 * finished run into a Copy Test Session. It does NOT save anything.
 * To start over, the parent gives it a new `key`.
 */
import { useMemo } from 'react';
import EntryFormRunner from '../../components/entry/EntryFormRunner';
import EntrySheetRunner from '../../components/entry/EntrySheetRunner';
import type { EntryItem, EntryResult } from '../../components/entry/types';
import { EnTl } from '../../components/ui';
import { makeRng, randomSeed } from '../../lib/random';
import type { CopyMode, Session } from '../../lib/storage';
import { FIELDS, makeRecord, type CopyRecord, type FieldKey } from './records';
import { buildCopySession } from './scoreCopy';

/** Spreadsheet column widths: the longest values (name, address) get the most room. */
const COLUMN_WIDTHS: Record<FieldKey, string> = {
  name: 'w-[21%]',
  birthDate: 'w-[12%]',
  address: 'w-[31%]',
  contactNo: 'w-[18%]',
  idNo: 'w-[18%]',
};

/** The source document: the record on a paper card. `wide` = all fields in one row (above a sheet). */
function RecordCard({ record, wide }: { record: CopyRecord; wide: boolean }) {
  return (
    <div className="rounded-md border border-stone-200 bg-white shadow-paper">
      <div className="border-b-2 border-dashed border-stone-200 px-5 py-2 text-sm text-stone-600">
        Kopyahin nang eksakto
      </div>
      {/* Wide: fields side by side, each value kept whole (it wraps to the next line as a unit). */}
      <dl className={wide ? 'flex flex-wrap gap-x-10 gap-y-3 px-5 py-4' : 'space-y-4 px-5 py-5'}>
        {FIELDS.map((f) => (
          <div key={f.key} className={wide ? 'min-w-0 max-w-full' : ''}>
            <dt className="text-sm font-medium text-stone-600">
              <EnTl en={f.label} tl={f.tl} />
            </dt>
            <dd className="select-none font-mono text-lg text-stone-900">{record[f.key]}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export default function CopyRunner({
  mode = 'form',
  seconds,
  showLiveStats,
  allowFinishEarly,
  sound,
  onStart,
  onFinish,
}: {
  mode?: CopyMode;
  seconds: number;
  showLiveStats: boolean;
  allowFinishEarly: boolean;
  sound: boolean;
  onStart?: () => void;
  onFinish: (session: Session, finishedEarly: boolean) => void;
}) {
  // One random generator per run (the parent gives a new `key` for a new run).
  const nextItem = useMemo(() => {
    const rng = makeRng(randomSeed());
    return (): EntryItem => {
      const record = makeRecord(rng);
      return { title: 'Record', source: <RecordCard record={record} wide={mode === 'sheet'} />, fields: FIELDS, expected: record };
    };
  }, [mode]);

  function finish({ submitted, unfinished, elapsedSec }: EntryResult, finishedEarly: boolean) {
    onFinish(buildCopySession(submitted, unfinished, elapsedSec, seconds, mode), finishedEarly);
  }

  const props = { seconds, showLiveStats, allowFinishEarly, sound, nextItem, unit: 'record', onStart, onFinish: finish };
  return mode === 'sheet' ? (
    <EntrySheetRunner {...props} columnWidths={COLUMN_WIDTHS} />
  ) : (
    <EntryFormRunner {...props} />
  );
}
