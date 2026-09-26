/**
 * Makes new typing paragraphs from fake Philippine data, so passages don't
 * repeat and can't be memorized.
 *
 *   Level 1: plain office sentences  <- the only level the Typing Test uses for now
 *   Level 2: names, addresses, dates
 *   Level 3: invoices, receipts, payroll, codes, amounts
 *
 * Levels 2 and 3 are kept (and tested) for upcoming features such as the
 * Copy Test and Document Encoding.
 *
 * Amounts are computed in centavos so totals always add up (like a real
 * document), and written as "PHP 1,234.50" because keyboards have no peso key.
 */
import type { PassageLevel } from '../../data/passages';
import * as ph from '../../data/ph';
import { formatCentavos, formatDate } from '../../lib/format';
import { intBetween, pick, shuffle, type Rng } from '../../lib/random';

// ---------- small building blocks ----------

export const digits = (rng: Rng, count: number) =>
  String(intBetween(rng, 0, 10 ** count - 1)).padStart(count, '0');

export const upperLetter = (rng: Rng) => String.fromCharCode(65 + intBetween(rng, 0, 25));

const recentYear = (rng: Rng) => intBetween(rng, 2024, 2026);

/** A date in the given year (or a random recent year). */
function recentDate(rng: Rng, year = recentYear(rng)): string {
  return formatDate(year, intBetween(rng, 1, 12), intBetween(rng, 1, 28));
}

export function birthDate(rng: Rng): string {
  return formatDate(intBetween(rng, 1965, 2005), intBetween(rng, 1, 12), intBetween(rng, 1, 28));
}

/** 13 -> "1:00 PM". Minutes are optional. */
function clockTime(hour: number, minute = 0): string {
  const h12 = hour > 12 ? hour - 12 : hour;
  return `${h12}:${String(minute).padStart(2, '0')} ${hour >= 12 ? 'PM' : 'AM'}`;
}

const randomMinute = (rng: Rng) => pick(rng, [0, 5, 15, 20, 30, 40, 45]);

/** A single office-hours time, e.g. "10:15 AM". */
const officeTime = (rng: Rng) => clockTime(intBetween(rng, 7, 17), randomMinute(rng));

/** A start and a later end time, e.g. ["9:00 AM", "1:00 PM"]. */
function timeRange(rng: Rng): [string, string] {
  const start = intBetween(rng, 7, 13);
  const end = start + intBetween(rng, 2, 4);
  return [clockTime(start), clockTime(end)];
}

/** Random peso amount, as centavos. */
const centavos = (rng: Rng, minPesos: number, maxPesos: number) =>
  intBetween(rng, minPesos * 100, maxPesos * 100);

/** e.g. "Ma. Kristine B. Dela Cruz" or "Ramon S. Soriano Jr." */
export function fullName(rng: Rng): string {
  const female = rng() < 0.5;
  let first = pick(rng, female ? ph.femaleFirstNames : ph.maleFirstNames);
  if (female && rng() < 0.25 && !first.startsWith('Maria')) first = `Ma. ${first}`;
  const middle = rng() < 0.8 ? ` ${upperLetter(rng)}.` : '';
  let last = pick(rng, ph.surnames);
  if (rng() < 0.12) last = `${last}-${pick(rng, ph.surnames)}`; // hyphenated married name
  const suffix = !female && rng() < 0.2 ? ` ${pick(rng, ph.suffixes)}` : '';
  return `${first}${middle} ${last}${suffix}`;
}

/** e.g. "Blk 7 Lot 22, Mabuhay Homes, Brgy. San Roque, Tanauan City, Batangas" */
export function address(rng: Rng): string {
  const [city, province] = pick(rng, ph.cities);
  const brgy = `Brgy. ${pick(rng, ph.barangays)}`;
  switch (intBetween(rng, 1, 3)) {
    case 1:
      return `Blk ${intBetween(rng, 1, 40)} Lot ${intBetween(rng, 1, 60)}, ${pick(rng, ph.subdivisions)}, ${brgy}, ${city}, ${province}`;
    case 2:
      return `Purok ${intBetween(rng, 1, 9)}, Sitio ${pick(rng, ph.sitios)}, ${brgy}, ${city}, ${province}`;
    default:
      return `${intBetween(rng, 1, 999)} ${pick(rng, ph.streets)} St., ${brgy}, ${city}, ${province}`;
  }
}

// ---------- Level 1: plain office sentences ----------

const level1Sentences: ((rng: Rng) => string)[] = [
  (r) => `Please check every ${pick(r, ph.documents)} before the end of the ${pick(r, ph.periods)}.`,
  (r) => `All ${pick(r, ph.documents)}s must be reviewed by the ${pick(r, ph.teams)} team.`,
  (r) => `The ${pick(r, ph.teams)} team will handle the new ${pick(r, ph.documents)}s this ${pick(r, ph.periods)}.`,
  (r) => `If a field on the ${pick(r, ph.documents)} is unclear, do not guess the value.`,
  (r) => `Report any missing ${pick(r, ph.documents)} to your team leader right away.`,
  (r) => `Do not change any record without approval from the ${pick(r, ph.teams)} office.`,
  () => 'Save your work often and lock your screen before you leave your station.',
  (r) => `Return each ${pick(r, ph.documents)} to the correct folder after encoding.`,
  () => 'Accuracy is more important than speed, so take a moment to review each entry.',
  (r) => `The ${pick(r, ph.teams)} section needs the updated list before the ${pick(r, ph.periods)} ends.`,
  () => 'Write down every problem in the issue log so the next person knows what happened.',
  (r) => `Please follow the same format when you encode a ${pick(r, ph.documents)}.`,
  (r) => `The ${pick(r, ph.teams)} team will have a short meeting on ${pick(r, ph.weekdays)} morning.`,
  (r) => `Please make sure the ${pick(r, ph.officeTools)} is turned off before you go home.`,
  (r) => `If the ${pick(r, ph.officeTools)} is not working, call the help desk and log the problem.`,
  (r) => `Each ${pick(r, ph.documents)} should be encoded exactly as it is written on the source document.`,
  () => 'Do not use shortcuts or abbreviations unless the guide allows them.',
  () => 'When a name is hard to read, mark the record for checking instead of guessing.',
  () => 'Double-check the spelling of every name before you save the record.',
  (r) => `New staff members will be trained by the ${pick(r, ph.teams)} team starting ${pick(r, ph.weekdays)}.`,
  () => 'Keep your desk clean and store all papers in the proper tray.',
  () => 'Please read the updated guidelines before you start encoding today.',
  (r) => `The quality check team will review a sample of your work every ${pick(r, ph.periods)}.`,
  (r) => `Send the finished batch to the ${pick(r, ph.teams)} team before lunch.`,
  () => 'Any record with missing information should be placed in the pending folder.',
  () => 'Take a short break every hour to rest your eyes and hands.',
  () => 'Sit up straight and keep your wrists relaxed while you type.',
  () => 'Ask your team leader if you are not sure how to encode a field.',
  (r) => `The ${pick(r, ph.teams)} office is closed on ${pick(r, ph.weekdays)} afternoon for inventory.`,
  (r) => `Always compare the encoded data with the original ${pick(r, ph.documents)}.`,
  (r) => `Late submissions must be approved by the head of the ${pick(r, ph.teams)} team.`,
  (r) => `Please update the tracking sheet each time you finish a ${pick(r, ph.documents)}.`,
  () => 'Never share your password or leave your account open on a shared computer.',
  (r) => `The system will be down for maintenance on ${pick(r, ph.weekdays)} evening.`,
  () => 'Use capital letters only where the source document uses them.',
  () => 'Customers expect their records to be correct the first time.',
];

function level1(rng: Rng): string {
  return shuffle(rng, level1Sentences)
    .slice(0, intBetween(rng, 3, 4))
    .map((make) => make(rng))
    .join(' ');
}

// ---------- Level 2: names, addresses, dates ----------

const level2Paragraphs: ((rng: Rng) => string)[] = [
  (r) =>
    `Applicant: ${fullName(r)}. Address: ${address(r)}. Date of birth: ${birthDate(r)}. ` +
    `The form was received on ${recentDate(r)} and assigned to ${pick(r, ph.titles)} ${fullName(r)} for review.`,
  (r) => {
    const [from, to] = timeRange(r);
    return (
      `Deliver to: ${fullName(r)}, ${address(r)}. Contact person: ${fullName(r)}. ` +
      `Expected delivery date is ${recentDate(r)}, between ${from} and ${to}.`
    );
  },
  (r) =>
    `Visitor log: ${pick(r, ph.titles)} ${fullName(r)} from ${pick(r, ph.companies)} arrived at ${officeTime(r)} ` +
    `on ${recentDate(r)} to meet ${fullName(r)}. Purpose of visit: submission of signed documents.`,
  (r) =>
    `Beneficiaries listed: ${fullName(r)} (spouse) and ${fullName(r)} (child). ` +
    `Permanent address: ${address(r)}. Last updated ${recentDate(r)}.`,
  (r) =>
    `Request for transfer of records filed by ${pick(r, ph.titles)} ${fullName(r)} on ${recentDate(r)}. ` +
    `New address: ${address(r)}. Approved by ${fullName(r)}.`,
];

function level2(rng: Rng): string {
  return pick(rng, level2Paragraphs)(rng);
}

// ---------- Level 3: numbers, amounts, codes ----------

function invoice(rng: Rng): string {
  const items = shuffle(rng, ph.officeItems).slice(0, intBetween(rng, 2, 3));
  let total = 0;
  const lines = items.map(([name, unit, min, max]) => {
    const qty = intBetween(rng, 2, 40);
    const price = centavos(rng, min, max);
    const line = qty * price;
    total += line;
    return `${qty} ${unit} ${name} @ PHP ${formatCentavos(price)} = PHP ${formatCentavos(line)}`;
  });
  const year = recentYear(rng);
  return (
    `Invoice No. SI-${year}-${digits(rng, 6)} dated ${recentDate(rng, year)}. ` +
    `Items: ${lines.join('; ')}. Total amount due: PHP ${formatCentavos(total)}.`
  );
}

function payroll(rng: Rng): string {
  const basic = centavos(rng, 8000, 25000);
  const hours = intBetween(rng, 1, 12);
  const overtime = centavos(rng, 80, 180) * hours;
  const deductions = centavos(rng, 300, 1500);
  const net = basic + overtime - deductions;
  return (
    `Employee No. ${digits(rng, 2)}-${digits(rng, 4)}-${upperLetter(rng)}. Basic pay: PHP ${formatCentavos(basic)}. ` +
    `Overtime (${hours} hrs): PHP ${formatCentavos(overtime)}. Deductions: PHP ${formatCentavos(deductions)}. ` +
    `Net pay: PHP ${formatCentavos(net)}.`
  );
}

function receipt(rng: Rng): string {
  const due = centavos(rng, 1000, 60000);
  const paid = Math.min(due, centavos(rng, 500, 60000));
  return (
    `Official Receipt No. ${digits(rng, 7)} received from ${fullName(rng)} the sum of PHP ${formatCentavos(paid)} ` +
    `for Account No. ${digits(rng, 4)}-${digits(rng, 4)}-${digits(rng, 2)}, dated ${recentDate(rng)}. ` +
    `Balance after payment: PHP ${formatCentavos(due - paid)}.`
  );
}

function inventory(rng: Rng): string {
  const codes = Array.from({ length: 3 }, () => `WH-${digits(rng, 5)}, ${intBetween(rng, 1, 4000).toLocaleString('en-US')} pcs`);
  return (
    `Inventory count as of ${recentDate(rng)}: Item code ${codes.join('; Item code ')}. ` +
    `Recount scheduled on ${recentDate(rng)} at ${officeTime(rng)}, Bay ${intBetween(rng, 1, 30)}-${upperLetter(rng)}.`
  );
}

function shipment(rng: Rng): string {
  const freight = centavos(rng, 5000, 80000);
  const vat = Math.round(freight * 0.12);
  return (
    `Shipment DR-${recentYear(rng)}-${digits(rng, 6)}: ${intBetween(rng, 5, 120)} cartons, ` +
    `gross weight ${intBetween(rng, 50, 3000)}.${intBetween(rng, 0, 9)} kg. Seal no. ${digits(rng, 8)}. ` +
    `Freight charge PHP ${formatCentavos(freight)} plus 12% VAT of PHP ${formatCentavos(vat)}.`
  );
}

const level3Paragraphs = [invoice, payroll, receipt, inventory, shipment];

function level3(rng: Rng): string {
  return pick(rng, level3Paragraphs)(rng);
}

/** One new paragraph for the given level. */
export function generateParagraph(rng: Rng, level: PassageLevel): string {
  if (level === 1) return level1(rng);
  if (level === 2) return level2(rng);
  return level3(rng);
}
