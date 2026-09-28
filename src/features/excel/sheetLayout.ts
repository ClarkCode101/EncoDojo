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

/**
 * Aralin 6: the sales per agent (Agent, Branch, Sales, Result), a narrow gap, and the Summary block
 * (label, value). Narrow on purpose: all 7 columns fit a 1366px screen, so the sheet never scrolls sideways.
 */
export const COLUMN_WIDTHS_6 = [
  'w-32 min-w-[8rem]',
  'w-44 min-w-[11rem]', // the branch names matter here (COUNTIF, SUMIF): "San Fernando City" fits
  'w-[5.5rem] min-w-[5.5rem]',
  'w-[5.5rem] min-w-[5.5rem]',
  'w-4 min-w-[1rem]',
  'w-60 min-w-[15rem]',
  'w-[5.5rem] min-w-[5.5rem]',
];

/** Aralin 7: the orders (Code, Qty, Item, Price), a narrow gap, and the Price List (Code, Item, Price). */
export const COLUMN_WIDTHS_7 = [
  'w-[5.5rem] min-w-[5.5rem]',
  'w-14 min-w-[3.5rem]',
  'w-40 min-w-[10rem]',
  'w-[5.5rem] min-w-[5.5rem]',
  'w-4 min-w-[1rem]',
  'w-[5.5rem] min-w-[5.5rem]',
  'w-40 min-w-[10rem]',
  'w-[5.5rem] min-w-[5.5rem]',
];

/** Aralin 8: Name (raw), Name, Ref (raw), Ref No., Branch, No. */
export const COLUMN_WIDTHS_8 = [
  'w-56 min-w-[14rem]',
  'w-52 min-w-[13rem]',
  'w-28 min-w-[7rem]',
  'w-28 min-w-[7rem]',
  'w-20 min-w-[5rem]',
  'w-20 min-w-[5rem]',
];

/** Aralin 2 adds a Status column (F). */
export const COLUMN_WIDTHS_2 = [...COLUMN_WIDTHS, 'w-36 min-w-[9rem]'];
