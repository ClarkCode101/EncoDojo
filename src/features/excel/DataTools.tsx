/**
 * The data tools of the Excel sheet (Aralin 4), drawn like Excel's:
 * - a small toolbar (like the Data / Home tabs): Sort A to Z, Sort Z to A,
 *   Filter, Find, Replace, Remove Duplicates;
 * - the Find, Replace and Remove Duplicates dialogs;
 * - the filter list of a column (▼ in the header, or Alt + ↓).
 * They only ask for a SheetCommand (sheet.ts `runCommand`); the lesson or quiz
 * runs it. Labels are English like Excel, with the Taglish meaning beside the
 * buttons (EnTl).
 */
import { useState, type ReactNode } from 'react';
import { EnTl } from '../../components/ui';
import { columnValues, countDuplicates, countMatches, type Sheet, type SheetCommand } from './sheet';

export type Dialog = null | 'find' | 'replace' | 'dedupe' | { filterCol: number };

const toolBtn =
  'rounded border border-stone-300 bg-white px-2.5 py-1 text-sm font-semibold text-stone-800 hover:border-stone-500 hover:bg-stone-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-600';

export function Toolbar({
  sheet,
  onCommand,
  onOpen,
  message,
}: {
  sheet: Sheet;
  onCommand: (cmd: SheetCommand) => void;
  onOpen: (d: Dialog) => void;
  message: string | null;
}) {
  // mouseDown: keep the keyboard on the sheet; click: do it.
  const button = (label: ReactNode, action: () => void, pressed?: boolean) => (
    <button
      type="button"
      aria-pressed={pressed}
      onMouseDown={(e) => e.preventDefault()}
      onClick={action}
      className={toolBtn + (pressed ? ' border-green-700 bg-green-50 text-green-900' : '')}
    >
      {label}
    </button>
  );
  return (
    <div className="flex shrink-0 flex-wrap items-center gap-1.5 border-b border-stone-300 bg-stone-50 px-2 py-1.5">
      <span className="mr-1 text-xs font-semibold text-stone-500">Data</span>
      {button('Sort A to Z', () => onCommand({ kind: 'sort', asc: true }))}
      {button('Sort Z to A', () => onCommand({ kind: 'sort', asc: false }))}
      {button('Filter', () => onCommand({ kind: 'toggleFilter' }), sheet.filterOn)}
      {button('Find', () => onOpen('find'))}
      {button('Replace', () => onOpen('replace'))}
      {button('Remove Duplicates', () => onOpen('dedupe'))}
      {message && (
        <span role="status" className="ml-2 text-sm font-semibold text-green-800">
          {message}
        </span>
      )}
    </div>
  );
}

/** A dialog box floating over the sheet, like Excel's. Esc closes it. */
function Box({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div
      role="dialog"
      aria-label={title}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          e.preventDefault();
          onClose();
        }
      }}
      className="absolute right-3 top-24 z-40 w-[22rem] rounded-md border border-stone-400 bg-white p-4 shadow-lg"
    >
      <div className="mb-3 font-sans text-base font-bold text-stone-900">{title}</div>
      {children}
    </div>
  );
}

const field =
  'mt-1 w-full rounded border-[1.5px] border-stone-500 px-2 py-1.5 font-mono focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-200';
const primary =
  'rounded bg-brand-700 px-3 py-1.5 text-sm font-semibold text-white hover:bg-brand-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600';

export function FindReplaceDialog({
  sheet,
  replace,
  onCommand,
  onClose,
}: {
  sheet: Sheet;
  replace: boolean;
  onCommand: (cmd: SheetCommand) => void;
  onClose: () => void;
}) {
  const [find, setFind] = useState('');
  const [replaceWith, setReplaceWith] = useState('');
  const [message, setMessage] = useState('');

  function run() {
    if (!find) return;
    if (replace) {
      const n = countMatches(sheet, find);
      onCommand({ kind: 'replaceAll', find, replace: replaceWith });
      setMessage(n === 0 ? 'Walang nakita.' : `Napalitan: ${n}.`);
    } else {
      onCommand({ kind: 'find', text: find });
      setMessage(countMatches(sheet, find) === 0 ? 'Walang nakita.' : '');
    }
  }

  return (
    <Box title={replace ? 'Find and Replace' : 'Find'} onClose={onClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          run();
        }}
      >
        <label className="block text-sm font-semibold text-stone-800">
          Find what
          <input autoFocus value={find} onChange={(e) => setFind(e.target.value)} className={field} />
        </label>
        {replace && (
          <label className="mt-2 block text-sm font-semibold text-stone-800">
            Replace with
            <input value={replaceWith} onChange={(e) => setReplaceWith(e.target.value)} className={field} />
          </label>
        )}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button type="submit" className={primary}>
            {replace ? <EnTl en="Replace All" tl="Palitan lahat" /> : <EnTl en="Find Next" tl="Hanapin" />}
          </button>
          <button type="button" onClick={onClose} className={toolBtn}>
            <EnTl en="Close" tl="Isara" />
          </button>
          {message && (
            <span role="status" className="text-sm font-semibold text-stone-700">
              {message}
            </span>
          )}
        </div>
      </form>
    </Box>
  );
}

export function DedupeDialog({
  sheet,
  onCommand,
  onClose,
  onDone,
}: {
  sheet: Sheet;
  onCommand: (cmd: SheetCommand) => void;
  onClose: () => void;
  onDone: (message: string) => void;
}) {
  return (
    <Box title="Remove Duplicates" onClose={onClose}>
      <p className="text-sm text-stone-700">
        Tatanggalin ang mga row na magkapareho ang LAHAT ng column. Ang una ay maiiwan. May header ang data.
      </p>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          autoFocus
          className={primary}
          onClick={() => {
            const n = countDuplicates(sheet);
            onCommand({ kind: 'removeDuplicates' });
            onDone(n === 0 ? 'Walang dobleng row.' : `${n} dobleng row ang natanggal.`);
          }}
        >
          <EnTl en="OK" tl="Sige" />
        </button>
        <button type="button" onClick={onClose} className={toolBtn}>
          <EnTl en="Cancel" tl="Huwag na" />
        </button>
      </div>
    </Box>
  );
}

/** The filter list of one column: tick the values to show. */
export function FilterPopup({
  sheet,
  col,
  onCommand,
  onClose,
}: {
  sheet: Sheet;
  col: number;
  onCommand: (cmd: SheetCommand) => void;
  onClose: () => void;
}) {
  const values = columnValues(sheet, col);
  const [checked, setChecked] = useState<Set<string>>(
    () => new Set(sheet.filter && sheet.filter.col === col ? sheet.filter.values : values),
  );
  const all = checked.size === values.length;
  const toggle = (v: string) =>
    setChecked((c) => {
      const next = new Set(c);
      if (next.has(v)) next.delete(v);
      else next.add(v);
      return next;
    });

  return (
    <Box title={`Filter: ${sheet.cells[0][col]}`} onClose={onClose}>
      <div className="max-h-56 space-y-1 overflow-y-auto rounded border border-stone-300 p-2 text-sm">
        <label className="flex items-center gap-2 font-semibold">
          <input
            type="checkbox"
            autoFocus
            checked={all}
            onChange={() => setChecked(all ? new Set() : new Set(values))}
            className="h-4 w-4 accent-brand-700"
          />
          (Select All)
        </label>
        {values.map((v) => (
          <label key={v} className="flex items-center gap-2 font-mono">
            <input
              type="checkbox"
              checked={checked.has(v)}
              onChange={() => toggle(v)}
              className="h-4 w-4 accent-brand-700"
            />
            {v || '(Blanks)'}
          </label>
        ))}
      </div>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          className={primary}
          disabled={checked.size === 0}
          onClick={() => {
            onCommand({ kind: 'setFilter', col, values: all ? null : [...checked] });
            onClose();
          }}
        >
          <EnTl en="OK" tl="Sige" />
        </button>
        <button type="button" onClick={onClose} className={toolBtn}>
          <EnTl en="Cancel" tl="Huwag na" />
        </button>
      </div>
    </Box>
  );
}
