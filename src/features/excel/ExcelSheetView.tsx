/**
 * Draws a Sheet (sheet.ts) like Excel: the Name Box ("B3") and the formula
 * bar on top, column letters, row numbers, the selection, and the active cell
 * with a green border. All keys go through `onKey` (the model decides what
 * they do); while a cell is being edited a real text box sits in it.
 * With `tools` (Aralin 4) it also shows the Data toolbar, its dialogs, the
 * filter arrows in the header, and hides the rows a filter hides.
 */
import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { DedupeDialog, FilterPopup, FindReplaceDialog, Toolbar, type Dialog } from './DataTools';
import { focusSheet } from './focusSheet';
import {
  alignsRight,
  cellName,
  colLetter,
  displayValue,
  formatOf,
  formulaBarValue,
  isHidden,
  isSelected,
  lastUsed,
  selectionRange,
  toKeyPress,
  type KeyPress,
  type Pos,
  type Sheet,
  type SheetCommand,
} from './sheet';

/** Keys the edit box passes to the sheet (the rest type text). */
function editKeyForSheet(e: KeyboardEvent, mode: 'enter' | 'edit'): boolean {
  if (['Enter', 'Tab', 'Escape', 'F2'].includes(e.key)) return true;
  if ((e.ctrlKey || e.metaKey) && e.key === ';') return true; // today's date
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
}: {
  sheet: Sheet;
  /** Tailwind width classes, one per column. */
  columnWidths: string[];
  /** A key was pressed; return true when the sheet used it (the browser's default is then stopped). */
  onKey: (k: KeyPress) => boolean;
  onEditChange: (value: string) => void;
  onCellClick: (p: Pos, shift: boolean) => void;
  onCellDoubleClick: (p: Pos) => void;
  /** Show the Data toolbar, dialogs and filter arrows (Aralin 4). */
  tools?: boolean;
  /** A data tool was used (sort, filter, find, replace, remove duplicates, or a dialog opened). */
  onCommand?: (cmd: SheetCommand) => void;
  /** Changes when a new task starts: open dialogs close and the toolbar message clears. */
  taskKey?: string | number;
}) {
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
        <div aria-label="Formula bar" className="min-w-0 flex-1 truncate px-2 py-1.5 text-stone-900">
          {value}
        </div>
      </div>

      {tools && <Toolbar sheet={sheet} onCommand={command} onOpen={open} message={toolMessage} />}
      {tools && (dialog === 'find' || dialog === 'replace') && (
        <FindReplaceDialog
          key={dialog}
          sheet={sheet}
          replace={dialog === 'replace'}
          onCommand={command}
          onClose={close}
        />
      )}
      {tools && dialog === 'dedupe' && (
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
      {tools && dialog && typeof dialog === 'object' && (
        <FilterPopup key={dialog.filterCol} sheet={sheet} col={dialog.filterCol} onCommand={command} onClose={close} />
      )}

      {/* The grid. It gets the keyboard focus (tabIndex) so the shortcuts work. */}
      <div
        ref={gridRef}
        tabIndex={0}
        role="grid"
        aria-label={`Spreadsheet. Active cell ${cellName(sheet.active)}: ${sheet.cells[sheet.active.r][sheet.active.c] || 'walang laman'}`}
        onKeyDown={(e) => {
          if (sheet.editing) return; // the edit box handles its own keys
          if (tools) {
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
          if (onKey(toKeyPress(e))) e.preventDefault();
        }}
        className="min-h-0 flex-1 overflow-auto outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-brand-200"
      >
        <table className="border-separate border-spacing-0 text-left font-mono text-[0.95rem]">
          <thead>
            <tr>
              <th className="sticky left-0 top-0 z-30 h-7 w-12 min-w-[3rem] border-b border-r border-stone-300 bg-stone-100" />
              {Array.from({ length: cols }, (_, c) => (
                <th
                  key={c}
                  scope="col"
                  className={
                    `sticky top-0 z-20 h-7 border-b border-r border-stone-300 px-2 text-center text-xs font-semibold ${columnWidths[c] ?? 'w-24 min-w-[6rem]'} ` +
                    (c >= left && c <= right ? 'bg-green-100 text-green-900' : 'bg-stone-100 text-stone-500')
                  }
                >
                  {colLetter(c)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sheet.cells.map((row, r) =>
              isHidden(sheet, r) ? null : (
                <tr key={r}>
                  <th
                    scope="row"
                    className={
                      // Row 1 (the table headers) stays on top while scrolling, like "Freeze Top Row" in Excel.
                      `sticky left-0 border-b border-r border-stone-300 px-1 text-center text-xs font-semibold ${r === 0 ? 'top-7 z-30' : 'z-10'} ` +
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
                    const active = sheet.active.r === r && sheet.active.c === c;
                    const selected = isSelected(sheet, { r, c });
                    return (
                      <td
                        key={c}
                        ref={active ? activeRef : undefined}
                        onMouseDown={(e) => {
                          e.preventDefault(); // keep the focus on the grid
                          onCellClick({ r, c }, e.shiftKey);
                        }}
                        onDoubleClick={() => onCellDoubleClick({ r, c })}
                        className={
                          'relative h-8 max-w-0 cursor-cell truncate whitespace-nowrap border-b border-r border-stone-200 px-2 scroll-ml-12 scroll-mt-[3.75rem] ' +
                          (r === 0
                            ? 'sticky top-7 z-[15] border-b-stone-400 font-sans text-stone-900 '
                            : 'text-stone-900 ') +
                          // Aralin 1-2: the header row is always bold. With formatting (Aralin 3+), bold comes
                          // only from Ctrl+B, and numbers sit on the right, like Excel.
                          ((sheet.formatting ? formatOf(sheet, { r, c }).bold : r === 0) ? 'font-bold ' : '') +
                          (alignsRight(sheet, { r, c }) ? 'text-right ' : '') +
                          (selected && !active ? 'bg-green-50 ' : r === 0 ? 'bg-stone-50 ' : '') +
                          (active ? 'outline outline-2 -outline-offset-2 outline-green-700' : '')
                        }
                      >
                        {active && sheet.editing ? (
                          <input
                            autoFocus
                            aria-label={`I-edit ang ${cellName({ r, c })}`}
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
                          displayValue(sheet, { r, c })
                        )}
                        {tools && sheet.filterOn && r === 0 && c < tableCols && (
                          <button
                            type="button"
                            aria-label={`Filter ng ${sheet.cells[0][c]}`}
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
    </div>
  );
}
