/** Column widths of the sales log sheet: Ref No., Customer, Branch, Date, Amount (then the empty columns). */
export const COLUMN_WIDTHS = [
  'w-40 min-w-[10rem]',
  'w-60 min-w-[15rem]',
  'w-40 min-w-[10rem]',
  'w-32 min-w-[8rem]',
  'w-28 min-w-[7rem]',
];

/** Aralin 3: the payroll list (Emp No., Name, Branch, Account No., Daily Rate). */
export const COLUMN_WIDTHS_3 = [
  'w-28 min-w-[7rem]',
  'w-60 min-w-[15rem]',
  'w-40 min-w-[10rem]',
  'w-40 min-w-[10rem]',
  'w-32 min-w-[8rem]',
];

/** Aralin 5: the order list (Item, Qty, Unit Price, Amount), a gap, and the Summary block (label, value). */
export const COLUMN_WIDTHS_5 = [
  'w-44 min-w-[11rem]',
  'w-20 min-w-[5rem]',
  'w-28 min-w-[7rem]',
  'w-32 min-w-[8rem]',
  'w-8 min-w-[2rem]',
  'w-40 min-w-[10rem]',
  'w-28 min-w-[7rem]',
];

/** Aralin 2 adds a Status column (F). */
export const COLUMN_WIDTHS_2 = [...COLUMN_WIDTHS, 'w-36 min-w-[9rem]'];
