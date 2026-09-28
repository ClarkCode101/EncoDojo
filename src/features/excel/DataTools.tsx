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
import {
  cellName,
  columnValues,
  countDuplicates,
  countMatches,
  listFor,
  parseCellName,
  selectionRange,
  type Sheet,
  type SheetCommand,
} from './sheet';

export type Dialog =
  | null
  | 'find'
  | 'replace'
  | 'dedupe'
  | 'split'
  | 'cond'
  | 'validation'
  | 'freeze'
  /** The dropdown list of the active cell (Alt + ↓). */
  | 'pick'
  | { filterCol: number };

/** The tools a lesson can show on the toolbar (all of them when a lesson just says `tools: true`). */
export type ToolName = 'sort' | 'filter' | 'find' | 'replace' | 'dedupe' | 'split' | 'cond' | 'validation' | 'freeze';
const ALL_TOOLS: ToolName[] = ['sort', 'filter', 'find', 'replace', 'dedupe', 'split', 'cond', 'validation', 'freeze'];

const toolBtn =
  'rounded border border-stone-300 bg-white px-2.5 py-1 text-sm font-semibold text-stone-800 hover:border-stone-500 hover:bg-stone-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-600';

export function Toolbar({
  sheet,
  onCommand,
  onOpen,
  message,
  only = ALL_TOOLS,
}: {
  sheet: Sheet;
  onCommand: (cmd: SheetCommand) => void;
  onOpen: (d: Dialog) => void;
  message: string | null;
  /** Only these tools (a lesson shows what it teaches). */
  only?: ToolName[];
}) {
  const has = (t: ToolName) => only.includes(t);
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
      <span className="mr-1 text-xs font-semibold text-stone-500">Tools</span>
      {has('sort') && button('Sort A to Z', () => onCommand({ kind: 'sort', asc: true }))}
      {has('sort') && button('Sort Z to A', () => onCommand({ kind: 'sort', asc: false }))}
      {has('filter') && button('Filter', () => onCommand({ kind: 'toggleFilter' }), sheet.filterOn)}
      {has('find') && button('Find', () => onOpen('find'))}
      {has('replace') && button('Replace', () => onOpen('replace'))}
      {has('dedupe') && button('Remove Duplicates', () => onOpen('dedupe'))}
      {has('split') && button('Text to Columns', () => onOpen('split'))}
      {has('cond') && button('Conditional Formatting', () => onOpen('cond'))}
      {has('validation') && button('Data Validation', () => onOpen('validation'))}
      {has('freeze') && button('Freeze Panes', () => onOpen('freeze'))}
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

const DELIMITERS = [
  { label: 'Comma ( , )', value: ',' },
  { label: 'Space', value: ' ' },
  { label: 'Dash ( - )', value: '-' },
];

/**
 * Text to Columns (Aralin 9), Excel's wizard in one box: the delimiter and the Destination
 * (Excel's default is the first selected cell, so the parts replace the original).
 */
export function TextToColumnsDialog({
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
  const { top, left, bottom } = selectionRange(sheet);
  const [delimiter, setDelimiter] = useState(',');
  const [dest, setDest] = useState(`$${cellName({ r: top, c: left })}`.replace(/(\d+)$/, '$$$1'));
  const [error, setError] = useState('');

  function finish() {
    const p = parseCellName(dest);
    if (!p || p.r >= sheet.cells.length || p.c >= sheet.cells[0].length) {
      setError('Hindi kilalang cell. Halimbawa: B2');
      return;
    }
    onCommand({ kind: 'textToColumns', delimiter, dest: p });
    onDone(`Nahati ang ${bottom - top + 1} cell.`);
  }

  return (
    <Box title="Convert Text to Columns" onClose={onClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          finish();
        }}
      >
        <fieldset>
          <legend className="text-sm font-semibold text-stone-800">Delimiter (pangharang)</legend>
          <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1">
            {DELIMITERS.map((d, i) => (
              <label key={d.value} className="flex items-center gap-1.5 text-sm">
                <input
                  type="radio"
                  name="delimiter"
                  autoFocus={i === 0}
                  checked={delimiter === d.value}
                  onChange={() => setDelimiter(d.value)}
                  className="h-4 w-4 accent-brand-700"
                />
                {d.label}
              </label>
            ))}
          </div>
        </fieldset>
        <label className="mt-3 block text-sm font-semibold text-stone-800">
          Destination (saan ilalagay)
          <input
            value={dest}
            onChange={(e) => {
              setDest(e.target.value);
              setError('');
            }}
            className={field}
          />
        </label>
        {error && (
          <p role="alert" className="mt-1 text-sm font-semibold text-red-700">
            {error}
          </p>
        )}
        <div className="mt-3 flex gap-2">
          <button type="submit" className={primary}>
            <EnTl en="Finish" tl="Tapusin" />
          </button>
          <button type="button" onClick={onClose} className={toolBtn}>
            <EnTl en="Cancel" tl="Huwag na" />
          </button>
        </div>
      </form>
    </Box>
  );
}

/** Conditional Formatting (Aralin 10): color the duplicates or the blanks of the selected cells light red. */
export function CondFormatDialog({
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
  const [rule, setRule] = useState<'duplicates' | 'blanks'>('duplicates');
  const { top, left, bottom, right } = selectionRange(sheet);
  const range = `${cellName({ r: top, c: left })}:${cellName({ r: bottom, c: right })}`;
  return (
    <Box title="Conditional Formatting" onClose={onClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onCommand({ kind: 'condFormat', rule });
          onDone(`May kulay na ang ${rule === 'duplicates' ? 'mga doble' : 'mga blangko'} sa ${range}.`);
        }}
      >
        <p className="text-sm text-stone-700">
          Highlight Cells Rules, sa <span className="font-mono">{range}</span> (Light Red Fill):
        </p>
        <div className="mt-2 space-y-1">
          {(
            [
              ['duplicates', 'Duplicate Values', 'doble'],
              ['blanks', 'Blanks', 'walang laman'],
            ] as const
          ).map(([value, en, tl], i) => (
            <label key={value} className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="rule"
                autoFocus={i === 0}
                checked={rule === value}
                onChange={() => setRule(value)}
                className="h-4 w-4 accent-brand-700"
              />
              <EnTl en={en} tl={tl} />
            </label>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="submit" className={primary}>
            <EnTl en="OK" tl="Sige" />
          </button>
          <button type="button" onClick={onClose} className={toolBtn}>
            <EnTl en="Cancel" tl="Huwag na" />
          </button>
          {sheet.condRules.length > 0 && (
            <button
              type="button"
              onClick={() => {
                onCommand({ kind: 'clearRules' });
                onDone('Natanggal ang lahat ng kulay.');
              }}
              className={toolBtn}
            >
              <EnTl en="Clear Rules" tl="Tanggalin lahat" />
            </button>
          )}
        </div>
      </form>
    </Box>
  );
}

/** Data Validation (Aralin 10), Allow: List: the selected cells get a dropdown with these values. */
export function ValidationDialog({
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
  const [source, setSource] = useState('');
  const [error, setError] = useState('');
  const { top, left, bottom, right } = selectionRange(sheet);
  const range = `${cellName({ r: top, c: left })}:${cellName({ r: bottom, c: right })}`;
  return (
    <Box title="Data Validation" onClose={onClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const list = source
            .split(',')
            .map((v) => v.trim())
            .filter((v) => v !== '');
          if (list.length === 0) {
            setError('Isulat ang mga pagpipilian, hiwalay sa comma. Halimbawa: Paid,Unpaid');
            return;
          }
          onCommand({ kind: 'validation', list });
          onDone(`May dropdown na ang ${range}.`);
        }}
      >
        <p className="text-sm text-stone-700">
          Para sa <span className="font-mono">{range}</span>. Allow: <span className="font-semibold">List</span>
        </p>
        <label className="mt-2 block text-sm font-semibold text-stone-800">
          Source (mga pagpipilian, hiwalay sa comma)
          <input
            autoFocus
            value={source}
            placeholder="Paid,Unpaid"
            onChange={(e) => {
              setSource(e.target.value);
              setError('');
            }}
            className={field}
          />
        </label>
        {error && (
          <p role="alert" className="mt-1 text-sm font-semibold text-red-700">
            {error}
          </p>
        )}
        <div className="mt-3 flex gap-2">
          <button type="submit" className={primary}>
            <EnTl en="OK" tl="Sige" />
          </button>
          <button type="button" onClick={onClose} className={toolBtn}>
            <EnTl en="Cancel" tl="Huwag na" />
          </button>
        </div>
      </form>
    </Box>
  );
}

/**
 * Freeze Panes (Aralin 12), Excel's View > Freeze Panes menu: at the active cell (the rows above it
 * and the columns left of it stay in view), the top row, the first column, or unfreeze.
 */
export function FreezeDialog({
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
  const { r, c } = sheet.active;
  const options: { en: string; tl: string; rows: number; cols: number }[] = [
    { en: 'Freeze Panes', tl: `sa itaas at kaliwa ng ${cellName(sheet.active)}`, rows: r, cols: c },
    { en: 'Freeze Top Row', tl: 'row 1 lang', rows: 1, cols: 0 },
    { en: 'Freeze First Column', tl: 'column A lang', rows: 0, cols: 1 },
    { en: 'Unfreeze Panes', tl: 'tanggalin', rows: 0, cols: 0 },
  ];
  return (
    <Box title="Freeze Panes" onClose={onClose}>
      <div className="space-y-1.5">
        {options.map((o, i) => (
          <button
            key={o.en}
            type="button"
            autoFocus={i === 0}
            onClick={() => {
              onCommand({ kind: 'freeze', rows: o.rows, cols: o.cols });
              onDone(o.rows + o.cols === 0 ? 'Wala nang naka-freeze.' : `Naka-freeze: ${o.en}.`);
            }}
            className="block w-full rounded border border-stone-300 px-3 py-1.5 text-left text-sm hover:bg-green-50 focus-visible:bg-green-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-green-700"
          >
            <EnTl en={o.en} tl={o.tl} />
          </button>
        ))}
      </div>
    </Box>
  );
}

/** The dropdown of a Data Validation cell (▼ or Alt + ↓): ↑ ↓ to move, Enter or a click to choose. */
export function ListPopup({
  sheet,
  onCommand,
  onClose,
}: {
  sheet: Sheet;
  onCommand: (cmd: SheetCommand) => void;
  onClose: () => void;
}) {
  const list = listFor(sheet, sheet.active) ?? [];
  return (
    <Box title={`Pumili para sa ${cellName(sheet.active)}`} onClose={onClose}>
      <div
        role="listbox"
        aria-label="Mga pagpipilian"
        onKeyDown={(e) => {
          if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
          e.preventDefault();
          const buttons = [...e.currentTarget.querySelectorAll('button')];
          const i = buttons.indexOf(document.activeElement as HTMLButtonElement);
          buttons[Math.max(0, Math.min(buttons.length - 1, i + (e.key === 'ArrowDown' ? 1 : -1)))]?.focus();
        }}
        className="space-y-1"
      >
        {list.map((v, i) => (
          <button
            key={v}
            type="button"
            role="option"
            aria-selected={sheet.cells[sheet.active.r][sheet.active.c] === v}
            autoFocus={i === 0}
            onClick={() => {
              onCommand({ kind: 'pick', value: v });
              onClose();
            }}
            className="block w-full rounded border border-stone-300 px-3 py-1.5 text-left font-mono hover:bg-green-50 focus-visible:bg-green-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-green-700"
          >
            {v}
          </button>
        ))}
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
