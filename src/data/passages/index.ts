/**
 * Typing passages. ORIGINAL text written for this app — no copied content.
 * All names, addresses, and numbers are made up.
 *
 * Levels:
 *   1 = plain office sentences
 *   2 = names, addresses, dates
 *   3 = heavy on numbers, amounts, reference codes, punctuation
 *
 * Amounts use "PHP" instead of the peso sign because most keyboards have no
 * peso key.
 */

export type PassageLevel = 1 | 2 | 3;

export type Passage = { id: string; level: PassageLevel; text: string };

export const passages: Passage[] = [
  // ---------- Level 1: plain sentences ----------
  {
    id: 'l1-memo',
    level: 1,
    text:
      'Please be reminded that all encoded records must be checked before the end of each shift. ' +
      'If you find a missing field, write it down on the issue log and inform your team leader. ' +
      'Do not guess any value that you cannot read clearly on the source document.',
  },
  {
    id: 'l1-filing',
    level: 1,
    text:
      'Every folder in the records room is arranged by date and then by last name. ' +
      'When you return a folder, place it back in the same box and update the logbook. ' +
      'Keep the area clean so that the next person can find what they need quickly.',
  },
  {
    id: 'l1-quality',
    level: 1,
    text:
      'Accuracy is more important than speed in data entry work. A fast encoder who makes many ' +
      'errors creates extra work for the checker. Take a short pause to review each entry, ' +
      'and your speed will improve naturally as you gain more practice.',
  },
  {
    id: 'l1-schedule',
    level: 1,
    text:
      'The morning team will handle the new batch of forms, while the afternoon team will focus ' +
      'on corrections. Breaks will follow the usual schedule. Please log in to the system on ' +
      'time and log out properly before you leave your station.',
  },
  {
    id: 'l1-customer',
    level: 1,
    text:
      'A customer called to ask about the status of her application. The request was forwarded ' +
      'to the processing section, and a reply will be sent by email within three working days. ' +
      'Kindly note the call in the tracking sheet for follow up.',
  },
  {
    id: 'l1-equipment',
    level: 1,
    text:
      'Report any problem with your computer, keyboard, or scanner to the help desk right away. ' +
      'Do not install any program on office equipment. Save your work often, and make sure your ' +
      'screen is locked whenever you step away from your desk.',
  },

  // ---------- Level 2: names, addresses, dates ----------
  {
    id: 'l2-application',
    level: 2,
    text:
      'Applicant: Ma. Kristina Dela Cruz-Villanueva. Address: Blk 7 Lot 22, Mabuhay Homes, ' +
      'Brgy. San Roque, Tanauan City, Batangas. Date of birth: 04/15/1998. The form was ' +
      'received on 09/02/2026 and was assigned to Mr. Ramon B. Soriano Jr. for review.',
  },
  {
    id: 'l2-delivery',
    level: 2,
    text:
      'Deliver to: Jose Emmanuel De la Paz III, Purok 3, Sitio Malinis, Brgy. Bagong Silang, ' +
      'Malaybalay City, Bukidnon. Contact person: Aling Remedios Tolentino. Expected delivery ' +
      'date is 10/08/2026, between 9:00 AM and 3:00 PM.',
  },
  {
    id: 'l2-roster',
    level: 2,
    text:
      'Staff on duty for Saturday: Juan Paolo Reyes, Maria Luisa Santos-Abad, Kevin Dela Rosa, ' +
      'and Ana Patricia Magbanua. Reliever: Christian John Ocampo. Please confirm your ' +
      'availability with Ms. Liza Q. Manalastas on or before 09/30/2026.',
  },
  {
    id: 'l2-transfer',
    level: 2,
    text:
      'Request for transfer of records from the Iloilo branch to the Cebu branch. Requested by ' +
      'Engr. Mark Anthony Villareal. Approved by Atty. Josefina M. Dimaculangan on 08/21/2026. ' +
      'New address: 2F Lim Building, 45 Mabini St., Brgy. Kamputhaw, Cebu City.',
  },
  {
    id: 'l2-beneficiary',
    level: 2,
    text:
      'Beneficiaries listed: Rosario P. Gatchalian (mother), Jericho Gatchalian (son), and ' +
      'Ma. Angelica Gatchalian-Uy (daughter). Permanent address: Sitio Kawayanan, Brgy. Poblacion ' +
      'Norte, Paniqui, Tarlac. Last updated 07/11/2026.',
  },
  {
    id: 'l2-visitor',
    level: 2,
    text:
      'Visitor log entry: Mr. Danilo Castillo Sr. from Northstar Trading arrived at 10:15 AM on ' +
      '09/19/2026 to meet Ms. Hazel Anne Buenaventura. Purpose of visit: submission of signed ' +
      'contracts. Visitor ID number V-0412 was issued and returned at 11:02 AM.',
  },

  // ---------- Level 3: numbers, amounts, codes ----------
  {
    id: 'l3-invoice',
    level: 3,
    text:
      'Invoice No. SI-2026-018734 dated 09/14/2026. Items: 12 boxes bond paper @ PHP 245.50 = ' +
      'PHP 2,946.00; 3 units stapler @ PHP 189.75 = PHP 569.25; 25 packs ballpen @ PHP 64.00 = ' +
      'PHP 1,600.00. Total amount due: PHP 5,115.25. Terms: 30 days.',
  },
  {
    id: 'l3-payroll',
    level: 3,
    text:
      'Payroll period 09/01/2026 to 09/15/2026. Employee No. 20-4471-B. Basic pay: PHP 11,250.00. ' +
      'Overtime (6.5 hrs): PHP 1,015.63. Deductions: PHP 562.50 and PHP 225.00. ' +
      'Net pay: PHP 11,478.13. Released via payroll account ending in 0083.',
  },
  {
    id: 'l3-inventory',
    level: 3,
    text:
      'Inventory count as of 09/25/2026: Item code WH-00417, 1,284 pcs; Item code WH-00418, ' +
      '96 pcs; Item code WH-01102, 3,050 pcs. Variance on WH-00418 is -4 pcs (4.00%). ' +
      'Recount scheduled on 09/27/2026 at 7:30 AM, Bay 12-C.',
  },
  {
    id: 'l3-receipt',
    level: 3,
    text:
      'Official Receipt No. 0058291 received from Lorna T. Pacheco the sum of PHP 18,720.40 ' +
      'as payment for Account No. 7730-2215-09. Mode: check no. 00124567, dated 09/20/2026. ' +
      'Balance after payment: PHP 3,279.60.',
  },
  {
    id: 'l3-shipment',
    level: 3,
    text:
      'Shipment DR-2026-004517: 48 cartons, gross weight 1,152.5 kg, volume 6.84 cbm. ' +
      'Seal no. 88302114. Departure 09/22/2026 23:40; ETA 09/24/2026 06:15. ' +
      'Freight charge PHP 27,600.00 plus 12% VAT of PHP 3,312.00.',
  },
  {
    id: 'l3-loan',
    level: 3,
    text:
      'Loan Ref. LN-88-2026-00931. Principal: PHP 150,000.00 at 1.25% per month for 24 months. ' +
      'Monthly amortization: PHP 7,265.14. First due date 10/15/2026. Penalty for late ' +
      'payment is 3% of the amount due. Co-maker ID: CM-51207.',
  },
];
