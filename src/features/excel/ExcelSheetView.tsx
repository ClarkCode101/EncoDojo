/**
 * Draws a Sheet (sheet.ts) like Excel: the Name Box ("B3") and the formula
 * bar on top, column letters, row numbers, the selection, and the active cell
 * with a green border. All keys go through `onKey` (the model decides what
 * they do); while a cell is being edited a real text box sits in it.
 * With `tools` (Aralin 4) it also shows the Data toolbar, its dialogs, the
 * filter arrows in the header, and hides the rows a filter hides.
 */
import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import {
  CondFormatDialog,
  DedupeDialog,
  FreezeDialog,
  PivotDialog,
  PivotFields,
  FilterPopup,
  FindReplaceDialog,
  ListPopup,
  TextToColumnsDialog,
  Toolbar,
  ValidationDialog,
  type Dialog,
  type ToolName,
} from './DataTools';
import { useLang, useT } from '../../lib/i18n';
import { focusSheet } from './focusSheet';
import {
  alignsRight,
  cellName,
  colLetter,
  computedText,
  displayValue,
  formatOf,
  formulaBarValue,
  highlightedCells,
  formatKey,
  isFormula,
  isColHidden,
  isHidden,
  isDateText,
  isNumberText,
  isSelected,
  lastUsed,
  listFor,
  selectionRange,
  toKeyPress,
  type KeyPress,
  type Pos,
  type Sheet,
  type SheetCommand,
  type Tabs,
} from './sheet';

/** Keys the edit box passes to the sheet (the rest type text). */
function editKeyForSheet(e: KeyboardEvent, mode: 'enter' | 'edit'): boolean {
  if (['Enter', 'Tab', 'Escape', 'F2'].includes(e.key)) return true;
  if ((e.ctrlKey || e.metaKey) && e.key === ';') return true; // today's date
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'e') return true; // Flash Fill (not the browser's search)
  return mode === 'enter' && e.key.startsWith('Arrow');
}

export default function ExcelSheetView({
  sheet,
  columnWidths,
  onKey,
  onEditChange,
  onCellClick,
  onCellDoubleClick,
  tools = false,
  onCommand,
  taskKey,
  computed,
  flash = null,
}: {
  sheet: Sheet;
  /** Tailwind width classes, one per column. */
  columnWidths: string[];
  /** A key was pressed; return true when the sheet used it (the browser's default is then stopped). */
  onKey: (k: KeyPress) => boolean;
  onEditChange: (value: string) => void;
  onCellClick: (p: Pos, shift: boolean) => void;
  onCellDoubleClick: (p: Pos) => void;
  /** Show the tools toolbar, dialogs and filter arrows (Aralin 4+): true = all tools, or only the listed ones. */
  tools?: boolean | ToolName[];
  /** A data tool was used (sort, filter, find, replace, remove duplicates, or a dialog opened). */
  onCommand?: (cmd: SheetCommand) => void;
  /** Changes when a new task starts: open dialogs close and the toolbar message clears. */
  taskKey?: string | number;
  /** Formula lessons: the computed value of every cell (formula cells show this, the formula bar shows the formula). */
  computed?: string[][] | null;
  /** A task was just done: these cells ("row,col") light up green on the sheet. */
  flash?: Set<string> | null;
}) {
  /** What a cell shows: a formula's result (with the cell's number format), or the value itself. */
  const shown = (p: Pos): string => {
    const raw = sheet.cells[p.r][p.c];
    if (!computed || !isFormula(raw)) return displayValue(sheet, p);
    const v = computed[p.r]?.[p.c] ?? '';
    if (formatOf(sheet, p).number2 && isNumberText(v)) {
      return Number(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    return computedText(v) ?? v; // text like 00457 shows without its mark (and stays on the left)
  };
  /** Numbers (typed or computed) sit on the right of the cell; text like '00457 does not. */
  const rightAligned = (p: Pos): boolean => {
    const raw = sheet.cells[p.r][p.c];
    if (computed && isFormula(raw)) {
      const v = computed[p.r]?.[p.c] ?? '';
      return isNumberText(v) || isDateText(v); // a date result (=TODAY(), =B2+30) is a number too
    }
    return alignsRight(sheet, p);
  };
  const hasTools = tools === true || (Array.isArray(tools) && tools.length > 0);
  /** Cells colored by Conditional Formatting (Aralin 10). */
  const highlighted = highlightedCells(sheet);
  const activeList = listFor(sheet, sheet.active);
  const lang = useLang();
  const t = useT();
  const [dialog, setDialog] = useState<Dialog>(null);
  const [toolMessage, setToolMessage] = useState<string | null>(null);
  // A new task starts with no dialog open (like closing it after finishing).
  const [shownTask, setShownTask] = useState(taskKey);
  if (shownTask !== taskKey) {
    setShownTask(taskKey);
    setDialog(null);
    setToolMessage(null);
  }
  const command = (cmd: SheetCommand) => {
    setToolMessage(null);
    onCommand?.(cmd);
  };
  const open = (d: Dialog) => {
    command({ kind: 'open' });
    setDialog(d);
  };
  const close = () => {
    setDialog(null);
    focusSheet();
  };
  /** Columns of the table (the header row), for the filter arrows. */
  const tableCols = sheet.cells[0].filter((v) => v !== '').length;
  const gridRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLTableCellElement>(null);
  const { top, left, bottom, right } = selectionRange(sheet);
  const cols = sheet.cells[0]?.length ?? 0;
  /** The sheet's own widths (they move when a column is inserted, Aralin 12), else the lesson's. */
  const widths = sheet.colWidths ?? columnWidths;
  const widthOf = (c: number) => widths[c] ?? 'w-24 min-w-[6rem]';
  // Freeze Panes: frozen rows stick under the column letters, frozen columns next to the row numbers.
  const remOf = (c: number) => Number(/min-w-\[(\d+(?:\.\d+)?)rem\]/.exec(widthOf(c))?.[1] ?? 6);
  const frozenTop = (r: number) => `calc(1.75rem + ${r} * (2rem + 1px))`;
  const frozenLeft = (c: number) => {
    const before = Array.from({ length: c }, (_, i) => i).filter((i) => !isColHidden(sheet, i));
    return `calc(3rem + ${before.reduce((sum, i) => sum + remOf(i), 0)}rem + ${before.length}px)`;
  };

  // Keep the active cell in view (the sheet scrolls inside its own box, not the page).
  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }, [sheet.active.r, sheet.active.c]);

  // After an edit ends, the keys go back to the sheet.
  useEffect(() => {
    if (!sheet.editing) gridRef.current?.focus({ preventScroll: true });
  }, [sheet.editing]);

  const value = sheet.editing ? sheet.editing.value : formulaBarValue(sheet, sheet.active);

  return (
    <div className="relative flex min-h-0 flex-col overflow-hidden rounded-md border border-stone-400 bg-white">
      {/* Name Box + formula bar, like Excel */}
      <div className="flex shrink-0 items-stretch border-b border-stone-300 bg-stone-50 font-mono text-sm">
        <div
          aria-label="Name Box"
          className="w-24 shrink-0 border-r border-stone-300 px-2 py-1.5 font-semibold text-stone-900"
        >
          {cellName(sheet.active)}
        </div>
        <div aria-hidden="true" className="border-r border-stone-300 px-2 py-1.5 italic text-stone-500">
          fx
        </div>
        <div
          aria-label="Formula bar"
          className="min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-pre px-2 py-1.5 text-stone-900"
        >
          {value}
        </div>
      </div>

      {sheet.alert && (
        <div
          role="alert"
          className="shrink-0 border-b border-red-300 border-l-4 border-l-red-700 bg-red-50 px-3 py-1.5 text-sm font-semibold text-red-900"
        >
          {sheet.alert[lang]}
        </div>
      )}
      {hasTools && (
        <Toolbar
          sheet={sheet}
          onCommand={command}
          onOpen={open}
          message={toolMessage}
          only={Array.isArray(tools) ? tools : undefined}
        />
      )}
      {sheet.pivot && <PivotFields sheet={sheet} onCommand={command} />}
      {hasTools && dialog === 'pivot' && <PivotDialog sheet={sheet} onCommand={command} onClose={close} />}
      {dialog === 'pick' && activeList && <ListPopup sheet={sheet} onCommand={command} onClose={close} />}
      {hasTools && dialog === 'freeze' && (
        <FreezeDialog
          sheet={sheet}
          onCommand={command}
          onClose={close}
          onDone={(m) => {
            close();
            setToolMessage(m);
          }}
        />
      )}
      {hasTools && (dialog === 'cond' || dialog === 'validation') && (
        <ToolDialog
          kind={dialog}
          sheet={sheet}
          onCommand={command}
          onClose={close}
          onDone={(m) => {
            close();
            setToolMessage(m);
          }}
        />
      )}
      {hasTools && (dialog === 'find' || dialog === 'replace') && (
        <FindReplaceDialog
          key={dialog}
          sheet={sheet}
          replace={dialog === 'replace'}
          onCommand={command}
          onClose={close}
        />
      )}
      {hasTools && dialog === 'dedupe' && (
        <DedupeDialog
          sheet={sheet}
          onCommand={command}
          onClose={close}
          onDone={(m) => {
            close();
            setToolMessage(m);
          }}
        />
      )}
      {hasTools && dialog === 'split' && (
        <TextToColumnsDialog
          sheet={sheet}
          onCommand={command}
          onClose={close}
          onDone={(m) => {
            close();
            setToolMessage(m);
          }}
        />
      )}
      {hasTools && dialog && typeof dialog === 'object' && (
        <FilterPopup key={dialog.filterCol} sheet={sheet} col={dialog.filterCol} onCommand={command} onClose={close} />
      )}

      {/* The grid. It gets the keyboard focus (tabIndex) so the shortcuts work. */}
      <div
        ref={gridRef}
        tabIndex={0}
        role="grid"
        aria-label={`Spreadsheet. Active cell ${cellName(sheet.active)}: ${sheet.cells[sheet.active.r][sheet.active.c] || t('walang laman', 'empty')}`}
        onKeyDown={(e) => {
          if (sheet.editing) return; // the edit box handles its own keys
          // Alt+↓ on a dropdown cell: its list (Data Validation, Aralin 10).
          if (e.altKey && e.key === 'ArrowDown' && activeList) {
            e.preventDefault();
            open('pick');
            return;
          }
          if (hasTools) {
            const ctrl = e.ctrlKey || e.metaKey;
            const k = e.key.toLowerCase();
            // Ctrl+F / Ctrl+H: Excel's Find / Replace (not the browser's).
            if (ctrl && (k === 'f' || k === 'h')) {
              e.preventDefault();
              open(k === 'f' ? 'find' : 'replace');
              return;
            }
            // Alt+↓ on a header cell: its filter list.
            if (
              e.altKey &&
              e.key === 'ArrowDown' &&
              sheet.filterOn &&
              sheet.active.r === 0 &&
              sheet.active.c < tableCols
            ) {
              e.preventDefault();
              open({ filterCol: sheet.active.c });
              return;
            }
          }
          const used = onKey(toKeyPress(e));
          // Excel's shortcuts that are also the browser's (never let them through, even when nothing happens):
          // Ctrl+E (Flash Fill; the search bar) and Ctrl + + / - / 0 (insert, delete, hide; the page zoom).
          const ctrl = e.ctrlKey || e.metaKey;
          if (used || (ctrl && ['e', 'E', '=', '+', '-', '_', '0', ')'].includes(e.key))) e.preventDefault();
        }}
        className="min-h-0 flex-1 overflow-auto outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-brand-200"
      >
        <table className="border-separate border-spacing-0 text-left font-mono text-[0.95rem]">
          <thead>
            <tr>
              <th className="sticky left-0 top-0 z-30 h-7 w-12 min-w-[3rem] border-b border-r border-stone-300 bg-stone-100" />
              {Array.from({ length: cols }, (_, c) =>
                isColHidden(sheet, c) ? null : (
                  <th
                    key={c}
                    scope="col"
                    style={c < sheet.freeze.cols ? { left: frozenLeft(c) } : undefined}
                    className={
                      `sticky top-0 h-7 border-b border-r border-stone-300 px-2 text-center text-xs font-semibold ${widthOf(c)} ` +
                      (c < sheet.freeze.cols ? 'z-[25] ' : 'z-20 ') +
                      (c >= left && c <= right ? 'bg-green-100 text-green-900' : 'bg-stone-100 text-stone-500')
                    }
                  >
                    {colLetter(c)}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {sheet.cells.map((row, r) =>
              isHidden(sheet, r) ? null : (
                <tr key={r}>
                  <th
                    scope="row"
                    style={r < sheet.freeze.rows ? { top: frozenTop(r) } : undefined}
                    className={
                      // Frozen rows (by default row 1, the table headers) stay on top while scrolling.
                      `sticky left-0 border-b border-r border-stone-300 px-1 text-center text-xs font-semibold ${r < sheet.freeze.rows ? 'z-30' : 'z-10'} ` +
                      (r >= top && r <= bottom
                        ? 'bg-green-100 text-green-900'
                        : sheet.filter && r > 0 && r <= lastUsed(sheet).r
                          ? 'bg-stone-100 text-brand-700' // filtered: blue row numbers, like Excel
                          : 'bg-stone-100 text-stone-500')
                    }
                  >
                    {r + 1}
                  </th>
                  {row.map((_, c) => {
                    if (isColHidden(sheet, c)) return null;
                    const active = sheet.active.r === r && sheet.active.c === c;
                    const selected = isSelected(sheet, { r, c });
                    const frozenR = r < sheet.freeze.rows;
                    const frozenC = c < sheet.freeze.cols;
                    return (
                      <td
                        key={c}
                        ref={active ? activeRef : undefined}
                        style={
                          frozenR || frozenC
                            ? { top: frozenR ? frozenTop(r) : undefined, left: frozenC ? frozenLeft(c) : undefined }
                            : undefined
                        }
                        onMouseDown={(e) => {
                          e.preventDefault(); // keep the focus on the grid
                          onCellClick({ r, c }, e.shiftKey);
                        }}
                        onDoubleClick={() => onCellDoubleClick({ r, c })}
                        className={
                          // whitespace-pre: extra spaces show, like Excel (Aralin 8 cleans them with TRIM).
                          'relative h-8 max-w-0 cursor-cell overflow-hidden text-ellipsis whitespace-pre border-b border-r border-stone-200 px-2 scroll-ml-12 scroll-mt-[3.75rem] ' +
                          (r === 0 ? 'border-b-stone-400 font-sans text-stone-900 ' : 'text-stone-900 ') +
                          (frozenR || frozenC
                            ? `sticky ${frozenR && frozenC ? 'z-[16]' : frozenR ? 'z-[15]' : 'z-[12]'} `
                            : '') +
                          // The freeze line, like Excel's.
                          (frozenC && c === sheet.freeze.cols - 1 ? 'border-r-stone-500 ' : '') +
                          (frozenR && r === sheet.freeze.rows - 1 && r !== 0 ? 'border-b-stone-500 ' : '') +
                          // Aralin 1-2: the header row is always bold. With formatting (Aralin 3+), bold comes
                          // only from Ctrl+B, and numbers sit on the right, like Excel.
                          ((sheet.formatting ? formatOf(sheet, { r, c }).bold : r === 0) ? 'font-bold ' : '') +
                          (rightAligned({ r, c }) ? 'text-right ' : '') +
                          // Conditional Formatting: Excel's "Light Red Fill with Dark Red Text". It comes first, so a
                          // finished Conditional Formatting task still shows its red (that red IS the result).
                          // A task just done: the cells it changed, green (green = correct).
                          (highlighted.has(formatKey({ r, c }))
                            ? 'bg-red-100 text-red-900 '
                            : flash?.has(formatKey({ r, c }))
                              ? 'bg-green-100 text-green-950 transition-colors duration-300 '
                              : selected && !active
                                ? 'bg-green-50 '
                                : r === 0
                                  ? 'bg-stone-50 '
                                  : frozenR || frozenC
                                    ? 'bg-white '
                                    : '') +
                          (active ? 'outline outline-2 -outline-offset-2 outline-green-700' : '')
                        }
                      >
                        {active && sheet.editing ? (
                          <input
                            autoFocus
                            aria-label={t(`I-edit ang ${cellName({ r, c })}`, `Edit ${cellName({ r, c })}`)}
                            value={sheet.editing.value}
                            onChange={(e) => onEditChange(e.target.value)}
                            onKeyDown={(e) => {
                              if (editKeyForSheet(e, sheet.editing!.mode)) {
                                e.preventDefault();
                                onKey(toKeyPress(e));
                              } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') {
                                e.preventDefault(); // not the browser's "bookmark this page"
                              }
                            }}
                            onFocus={(e) => {
                              // Caret at the end, like Excel.
                              const len = e.target.value.length;
                              e.target.setSelectionRange(len, len);
                            }}
                            className="absolute inset-0 w-full bg-white px-2 font-mono text-[0.95rem] outline outline-2 -outline-offset-2 outline-green-700"
                          />
                        ) : (
                          shown({ r, c })
                        )}
                        {active && activeList && !sheet.editing && (
                          <button
                            type="button"
                            aria-label={t(
                              `Mga pagpipilian para sa ${cellName({ r, c })}`,
                              `Choices for ${cellName({ r, c })}`,
                            )}
                            onMouseDown={(e) => {
                              e.preventDefault();
                              e.stopPropagation(); // not a click on the cell
                              open('pick');
                            }}
                            className="absolute right-1 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded border border-stone-400 bg-white text-[0.6rem] text-stone-600"
                          >
                            ▼
                          </button>
                        )}
                        {hasTools && sheet.filterOn && r === 0 && c < tableCols && (
                          <button
                            type="button"
                            aria-label={t(`Filter ng ${sheet.cells[0][c]}`, `Filter of ${sheet.cells[0][c]}`)}
                            onMouseDown={(e) => {
                              e.preventDefault();
                              e.stopPropagation(); // not a click on the cell
                              open({ filterCol: c });
                            }}
                            className={
                              'absolute right-1 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded border text-[0.6rem] ' +
                              (sheet.filter?.col === c
                                ? 'border-green-700 bg-green-100 text-green-900'
                                : 'border-stone-400 bg-white text-stone-600')
                            }
                          >
                            ▼
                          </button>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ),
            )}
          </tbody>
        </table>
      </div>
      {sheet.tabs && <TabBar tabs={sheet.tabs} onCommand={command} />}
    </div>
  );
}

/** Conditional Formatting or Data Validation (Aralin 10). */
function ToolDialog({
  kind,
  ...props
}: {
  kind: 'cond' | 'validation';
  sheet: Sheet;
  onCommand: (cmd: SheetCommand) => void;
  onClose: () => void;
  onDone: (message: string) => void;
}) {
  return kind === 'cond' ? <CondFormatDialog {...props} /> : <ValidationDialog {...props} />;
}

/**
 * The sheet tabs under the grid, like Excel's (Aralin 13): a click goes to a tab, a double-click
 * renames it (Enter or a click elsewhere saves, Esc cancels). The keyboard: Ctrl+Shift+PgDn / PgUp.
 */
function TabBar({ tabs, onCommand }: { tabs: Tabs; onCommand: (cmd: SheetCommand) => void }) {
  const t = useT();
  const [renaming, setRenaming] = useState<number | null>(null);
  const [draft, setDraft] = useState('');
  const save = (i: number) => {
    if (draft.trim() !== tabs.names[i]) onCommand({ kind: 'renameTab', index: i, name: draft });
    setRenaming(null);
    focusSheet();
  };
  return (
    <div
      role="tablist"
      aria-label="Mga sheet (tab)"
      className="flex shrink-0 items-end gap-0.5 border-t border-stone-300 bg-stone-100 px-2 pt-1"
    >
      {tabs.names.map((name, i) =>
        renaming === i ? (
          <form
            key={i}
            onSubmit={(e) => {
              e.preventDefault();
              save(i);
            }}
          >
            <input
              autoFocus
              aria-label={t('Bagong pangalan ng tab', 'New tab name')}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={() => save(i)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  e.preventDefault();
                  setRenaming(null);
                  focusSheet();
                }
              }}
              onFocus={(e) => e.target.select()}
              className="w-32 rounded-t border border-b-0 border-green-700 bg-white px-2 py-1 font-sans text-sm outline-none"
            />
          </form>
        ) : (
          <button
            key={i}
            type="button"
            role="tab"
            aria-selected={i === tabs.index}
            title={t('I-double-click para palitan ang pangalan', 'Double-click to rename')}
            onMouseDown={(e) => e.preventDefault()} // keep the keyboard on the sheet
            onClick={() => onCommand({ kind: 'tab', index: i })}
            onDoubleClick={() => {
              setDraft(name);
              setRenaming(i);
            }}
            className={
              'rounded-t border border-b-0 px-3 py-1 font-sans text-sm ' +
              (i === tabs.index
                ? 'border-stone-400 bg-white font-bold text-green-800 shadow-[inset_0_-2px_0_#15803d]'
                : 'border-transparent text-stone-600 hover:bg-stone-200')
            }
          >
            {name}
          </button>
        ),
      )}
    </div>
  );
}
