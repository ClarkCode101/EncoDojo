# EncoDojo

**Live app: https://encodojo.vercel.app**

EncoDojo is a free practice app for **Encoder and Data Entry** jobs in the Philippines. It trains the skills
these jobs test and use every day: typing speed and accuracy, numpad (10-key) speed, copying records,
encoding from source documents, checking other people's work (QC), and Excel. An Assessment then tells you
whether you are job-ready.

- **Free and private.** No login, no server, no ads. Everything runs in your browser.
- **Made for everyone**, including older and non-techy users: big text and buttons, numbered steps, and a
  plain explanation for every number on screen.
- **Two languages:** Taglish (the default) or English, chosen on the welcome screen or in Settings.
- **Your progress stays in your browser** (localStorage). The app reminds you to download a backup file, and
  you can restore it on another computer.
- **All sample data is fake:** names, addresses, ID numbers, companies and amounts are made up.

## What you can do

### Practice

Practice any skill as often as you like. Results are saved by default, and you can choose not to save one.

| Practice | What it trains |
| --- | --- |
| Typing Practice | 30 seconds or 1 minute of plain office text. Shows Gross and Net WPM, accuracy, keystroke accuracy, a comparison with your last test and personal best, and every mistake. |
| Numpad Practice | 30 seconds or 1 minute of numbers typed on the numpad. **Mixed** uses the same numbers as the Assessment; **Beginner** uses short numbers. Shows KPH, entry accuracy, and the common KPH levels (8,000 / 10,000 / 12,000). |
| Copy Test | 1 or 2 minutes copying fake records (name, birth date, address, contact number, ID) exactly, in a **Form** (like a hiring test) or a **Spreadsheet** (like Excel: one row per record). Wrong fields show the exact wrong characters. |
| Document Encoding | 3 or 5 minutes reading a fake Sales Invoice, Delivery Receipt or Application Form, finding the key fields, and encoding them by simple rules (dates as mm/dd/yyyy, amounts without ₱ or commas, text copied exactly). |
| QC Check | 1 or 2 minutes comparing an original record with an encoded copy and marking the fields that have a mistake, like a QC checker. |

### Assessment

All five skills in a row under exam rules (fixed times, no live stats, no early finish), about 10 to 12
minutes with breaks. The report card shows a PASADO / HINDI PA stamp, each of the 10 job-ready targets,
tips for the parts not passed yet, the change since your last Assessment, and your mistakes. You can
download it as an image. It is a self-assessed practice result, not an official certificate.

Passing more targets earns **belt ranks**: White, Yellow, Orange, Green, Blue (job-ready once) and Black
(job-ready on three different days). A belt is never taken away.

### Learn Excel

A separate learning track with **14 short lessons**, from moving around a sheet to PivotTables: data entry
shortcuts, formatting, sort and filter, formulas (SUM, IF, COUNTIF, SUMIF), VLOOKUP and XLOOKUP, cleaning
text, splitting and joining names, Conditional Formatting, dropdowns, dates, rows and columns, several tabs,
and PivotTables. Each lesson explains a topic in one or two sentences, then you do it on an Excel-like sheet,
with a hint, the keys, or a step-by-step demo when you get stuck. A short quiz ends each lesson. There is no
timer, and the **Kodigo** (Cheat sheet) page lists every shortcut and formula from the lessons (printable).

Formulas are computed by [HyperFormula](https://hyperformula.handsontable.com/), loaded only when a formula
lesson opens.

### Help and comfort

- **Sensei**, a small pixel-art guide, gives tips for the page you are on and comments on your results. He
  stays quiet while you practice and can be made small or turned off.
- **Home** shows what to practice next, your belt, your numbers against the job-ready targets, and your
  recent activity.
- **Settings:** language, your name, dark mode, larger text, bigger reading text, less motion, an on-screen
  **keyboard guide** (lights up the next key and names the finger to use), sounds, and backup / restore.

## How scores are calculated

- **Gross WPM** = (typed characters ÷ 5) ÷ minutes
- **Net WPM** = Gross WPM − (uncorrected errors ÷ minutes), never below 0
- **Accuracy** = correct characters ÷ (correct characters + mistakes) × 100
- **Keystroke accuracy** = keys typed without a mistake ÷ all keys typed × 100 (mistakes fixed with
  Backspace still count)
- **Mistakes** = wrong keys + extra keys (such as a double space) + skipped letters. Your typing is lined up
  with the passage like a "diff", so one slip counts as one mistake and does not make the rest of the line wrong.
- **KPH** = correct keystrokes ÷ hours (digits, the decimal point and Enter; commas are not needed)
- **Entry accuracy** = fully correct entries ÷ all entries × 100
- **Field accuracy** (Copy Test, Document Encoding) = fields typed exactly right ÷ all fields × 100
- **Net KPH** (Copy Test, Document Encoding) = (typed characters − mistakes) × 3600 ÷ seconds
- **Correct checks** (QC Check) = right decisions ("has a mistake" or "correct") ÷ all fields checked × 100;
  **speed** = records checked per minute

The job-ready targets are 40 Net WPM and 95% accuracy (Typing), 8,000 KPH and 95% (Numpad), 95% of fields
and 8,000 net KPH (Copy Test), 95% of fields and 6,000 net KPH (Document Encoding), and 95% correct checks
and 3 records per minute (QC Check). The Document Encoding and QC targets are EncoDojo's own estimates,
since there is no public standard.

The code is in [`src/lib/scoring.ts`](src/lib/scoring.ts), [`src/lib/fieldScoring.ts`](src/lib/fieldScoring.ts)
and [`src/features/qc/scoreQc.ts`](src/features/qc/scoreQc.ts); the targets are in
[`src/lib/targets.ts`](src/lib/targets.ts).

## Run it locally

You need [Node.js](https://nodejs.org/) 22 (the project is developed on 22.11).

```bash
npm install
npm run dev      # open the URL it prints, usually http://localhost:5173
```

Other commands:

```bash
npm run test     # unit tests (Vitest)
npm run lint     # ESLint
npm run build    # type check + production build into dist/
npm run preview  # serve the built dist/ folder locally
```

## Deploy for free

The app is a static site, so it needs no environment variables, secrets, or backend.

**Vercel (Hobby plan)**

1. Push this repo to GitHub.
2. On vercel.com, choose *Add New → Project* and import the repo.
3. Framework preset: **Vite**. Build command `npm run build`, output directory `dist`.
4. Deploy. `vercel.json` makes deep links like `/typing` work and adds the security headers.

**Cloudflare Pages**

1. Push this repo to GitHub.
2. In the Cloudflare dashboard, go to *Workers & Pages → Create → Pages → Connect to Git*.
3. Build command `npm run build`, output directory `dist`.
4. Deploy. `public/_redirects` makes deep links work and `public/_headers` adds the security headers.

## Tech and privacy

- React, TypeScript, Vite, Tailwind CSS, React Router, Vitest. Fonts are bundled (no outside requests).
- No analytics, no cookies, no network calls: the app never sends your data anywhere.
- A Content-Security-Policy and other security headers allow only the site's own code, and stop other sites
  from showing EncoDojo inside a frame.

## Project structure

```
src/
  app/          router, layout and sidebar
  components/   shared UI pieces and entry/ (the form and spreadsheet runners)
  data/         original typing passages and fake Filipino names and places
  features/     one folder per area: dashboard, assessment, typing, numpad, copy, encoding,
                qc, excel (lessons, the spreadsheet model in model/, the Cheat sheet), sensei,
                settings, welcome
  lib/          scoring, storage and backup, languages, belts, targets, random helpers, timer
```

## License

Copyright (C) 2026 ClarkCode101

EncoDojo is free software: you can redistribute it and/or modify it under the terms of the GNU General
Public License as published by the Free Software Foundation, either version 3 of the License, or (at your
option) any later version. It is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY;
without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
[GNU General Public License](LICENSE) for more details.

EncoDojo uses HyperFormula under its GPL-3.0 license, so this project stays open source.

## Name and logo

The GPL covers the code, not the brand. The name **EncoDojo** and the EncoDojo logo (the "E" key with a gold
belt) are not licensed for use in other projects. If you publish your own version of this code, please give it
a different name and logo, and do not suggest that it is the official EncoDojo or made by its author. Saying
that your project is based on EncoDojo, with a link to this repository, is welcome.
