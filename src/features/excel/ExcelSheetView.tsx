/**
 * Draws a Sheet (sheet.ts) like Excel: the Name Box ("B3") and the formula
 * bar on top, column letters, row numbers, the selection, and the active cell
 * with a green border. All keys go through `onKey` (the model decides what
 * they do); while a cell is being edited a real text box sits in it.
 */
import { useEffect, useRef, type KeyboardEvent } from 'react';
import {
  cellName,
  colLetter,
  isSelected,
  selectionRange,
  toKeyPress,
  type KeyPress,
  type Pos,
  type Sheet,
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
}: {
  sheet: Sheet;
  /** Tailwind width classes, one per column. */
  columnWidths: string[];
  /** A key was pressed; return true when the sheet used it (the browser's default is then stopped). */
  onKey: (k: KeyPress) => boolean;
  onEditChange: (value: string) => void;
  onCellClick: (p: Pos, shift: boolean) => void;
  onCellDoubleClick: (p: Pos) => void;
}) {
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

  const value = sheet.editing ? sheet.editing.value : sheet.cells[sheet.active.r][sheet.active.c];

  return (
    <div className="flex min-h-0 flex-col overflow-hidden rounded-md border border-stone-400 bg-white">
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

      {/* The grid. It gets the keyboard focus (tabIndex) so the shortcuts work. */}
      <div
        ref={gridRef}
        tabIndex={0}
        role="grid"
        aria-label={`Spreadsheet. Active cell ${cellName(sheet.active)}: ${sheet.cells[sheet.active.r][sheet.active.c] || 'walang laman'}`}
        onKeyDown={(e) => {
          if (sheet.editing) return; // the edit box handles its own keys
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
            {sheet.cells.map((row, r) => (
              <tr key={r}>
                <th
                  scope="row"
                  className={
                    // Row 1 (the table headers) stays on top while scrolling, like "Freeze Top Row" in Excel.
                    `sticky left-0 border-b border-r border-stone-300 px-1 text-center text-xs font-semibold ${r === 0 ? 'top-7 z-30' : 'z-10'} ` +
                    (r >= top && r <= bottom ? 'bg-green-100 text-green-900' : 'bg-stone-100 text-stone-500')
                  }
                >
                  {r + 1}
                </th>
                {row.map((v, c) => {
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
                          ? 'sticky top-7 z-[15] border-b-stone-400 font-sans font-bold text-stone-900 '
                          : 'text-stone-900 ') +
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
                        v
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
