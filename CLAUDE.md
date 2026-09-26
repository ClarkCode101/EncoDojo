# EncoDojo — Encoder / Data Entry Practice Simulator

## Project Overview
**EncoDojo** (repo: `github.com/ClarkCode101/EncoDojo`, package name `encodojo`) is a browser-based practice app for skills tested and used in **Encoder / Data Entry jobs in the Philippines**: typing speed & accuracy, numpad (10-key) speed, alphanumeric copy tests, source-document encoding, QC/error-spotting, and basic-to-intermediate Excel.

The owner is learning while building. When you finish a task, **explain what you did in simple terms (Taglish is fine)**, and point out anything they should test manually.

## Brand (decided 2026-09-26): "Dojo Indigo + Belt Gold"
- Colors are defined ONCE in `tailwind.config.js`: `brand-*` (indigo, main `brand-800` #2E2A6B), `belt-*` (gold accent, `belt-400` #F5B301), `paper` (#FBF8F1 page background). Neutrals use Tailwind `stone-*` (warm gray). Never use raw `blue-*`/`slate-*` for UI.
- Gold is for fills/badges with dark text on top — never gold text on white (low contrast).
- Red = mistake, green = correct, amber = warning: keep these meanings; they are never brand colors.
- Logo: a tied belt on a gold tile (`<Logo />` in `components/icons.tsx`, same drawing in `public/favicon.svg`).
- Signature touches: the passage looks like a sheet of paper (`shadow-paper`), and the Assessment report has a rubber stamp ("PASADO" / "HINDI PA", `Stamp` in `components/ResultPieces.tsx`).
- Planned: belt ranks (White → Yellow → Orange → Green → Blue → Black) as the Phase 4 level system; optional "Sensei" tips character; optional on-screen keyboard/numpad guide.

## UI & Language Rules (decided 2026-09-26)
The app must be easy for **older and non-techy users**:
- **"Taglish ang gabay, English ang trabaho"** (decided 2026-09-26):
  - Guidance is **Taglish**: instructions, explanations ("Ano ito?"), results, comments, Settings. Keep job terms in English (WPM, KPH, Accuracy, Encoder, Assessment).
  - The work itself looks like a real **English** hiring test/form: field labels and in-test buttons are English with the Taglish meaning smaller beside them, via `EnTl` (e.g. "Name (Pangalan)", "Submit (Ipasa)", "Finish (Tapusin na)"). Typing passages stay English; records use real-looking Filipino names/places.
  - Exception (owner's choice, 2026-09-26): **spreadsheet column headers are English only** + the format hint (e.g. "Date" + `mm/dd/yyyy`), no Taglish, to keep them short like a real sheet.
  - Code, comments, and commit messages stay in English.
- Big readable text (root 17px; Settings → "Mas malaking text" = 19px via `html.large-text`, `settings.largeText`). Buttons at least 44px tall. No ALL-CAPS labels.
- Every page: icon + title + one-sentence explanation, then numbered steps (`Step` component) for what to do.
- **Practice pages use two screens** (owner's decision, 2026-09-26, because one long page felt overwhelming) — `components/Practice.tsx`:
  1. `PracticeSetup`: choices, **at most 3** short "Tandaan" points (+ optional extra like the encoding rules), one big "Simulan" button (focused, so Enter starts).
  2. Practice screen: `PracticeHeader` (title, chosen settings, "‹ Palitan ang settings" only before the first key) + the drill only: a sticky one-line `LiveStatsBar` and a one-line `KeyTips` reminder. No instruction boxes, and never repeat the same instruction in two places. "Ulitin" on results goes straight back to the practice screen.
  - The practice screen **fits the window with no page scroll** (owner's request) from tablet width up: `PracticeFrame` is exactly window-high; long parts (passage, document, sheet rows, form) shrink and scroll inside their own box (`min-h-0` + `overflow-auto`). Checked at 1366×650, 1366×720, 1920×950. Keep new drills inside this frame and compact (`Card compact`).
- Every number shown gets a plain explanation via `HelpTip` ("Ano ito?", click-to-open `<details>`, never hover-only). Explanations live in `lib/glossary.ts`.
- Results screens start with a one-sentence plain summary + the main action buttons, then details.
- Use shared pieces in `components/ui.tsx` (Button, Card, Step, HelpTip, Notice, Checkbox, LiveStatsBar, KeyTips, SegmentedPicker, ConfirmButton) and `components/icons.tsx` (hand-made SVG icons, no icon library).
- Deletes always ask first (ConfirmButton). Sidebar shows only usable pages; "coming soon" features are listed on Home.

## Product Direction: Training + Assessment (decided 2026-09-26)
- **Training (the "dojo")**: every feature (Typing, Numpad, Copy Test, Document Encoding, and later QC, Excel) is a training ground. User picks settings, can "Finish now", can retry. Results are saved by default but optional ("Don't save this result" / "Save it again"). A run ended with "Finish now" starts **unsaved** ("Save anyway") because short runs inflate WPM/KPH.
- **Assessment** (`features/assessment`): runs every feature in a fixed order under exam rules — fixed duration/difficulty, no live stats, no "Finish now", no retry — then shows a **report card**: per-target ✅/❌, overall "Job-ready" verdict, rule-based comments (no AI), change vs previous assessment, and mistake lists. Always saved as ONE session of type `'assessment'`.
- Each drill has a **Runner** component (`TypingRunner`, `NumpadRunner`, `CopyRunner`) that runs one attempt and returns a Session without saving; training pages and the Assessment both use it. **When adding a new feature, build its Runner first, then add it as a new part of the Assessment** (`evaluate.ts` checks + a `has…Part()` guard for older saved assessments, `comments.ts` rules, `AssessmentReport.tsx` section, history column).
- Field-by-field entry drills (Copy Test, Document Encoding) share the **entry runners** in `components/entry/`: `EntryFormRunner` (form) and `EntrySheetRunner` (Excel-like), fed by `nextItem(index)` → `{ title, source, fields, expected }`, scored by `lib/fieldScoring.ts`, mistakes shown by `FieldMistakesCard`. Reuse them for new entry-style drills instead of copying code.
- Practice "clear all" uses `PRACTICE_TYPES` (every session type except `'assessment'`), so new session types are included automatically.
- Job-ready targets live in `lib/targets.ts` (typing 40 Net WPM / 95%; numpad 8,000 net KPH / 95%; copy 95% fields / 8,000 net KPH — KPH is the commonly quoted alphanumeric data entry test minimum; per-FIELD accuracy is EncoDojo's stricter choice; encoding 95% fields / 6,000 net KPH — EncoDojo estimates, no public standard). KPH levels (`KPH_LEVELS`): 8,000 Pasado (entry-level), 10,000 Karaniwang hinihingi, 12,000 Magaling — commonly quoted 10-key benchmarks (checked 2026-09 on typing/hiring sites; PH job posts usually state WPM, not KPH). Shown by `KphLevels` on Numpad results and the Assessment report.

## Hard Constraints (never break these)
- **Zero cost.** No backend, no database, no login, no paid APIs, no paid services, no API keys or secrets.
- **All logic runs in the browser.** Scoring, data generation, formulas, charts, PDF — client-side only.
- **Storage = localStorage only**, always with Export/Import (JSON) available.
- **All sample data is fake.** No real names tied to real ID numbers, no real addresses, no scraped data.
- **Desktop-first.** Mobile should not break, but layouts are optimized for keyboard + mouse at 1280px+.
- Only use libraries with free/open licenses (MIT, Apache, GPL-compatible). Ask before adding any new dependency.

## Tech Stack
- React + Vite + **TypeScript**
- React Router (use lazy-loaded routes via `React.lazy` per screen)
- Tailwind CSS
- Vitest for unit tests (scoring and storage logic must be tested). Test config lives in `vite.config.ts`.
- Node 22.11 on the owner's machine: stay on Vitest 4.x (Vitest 5 needs Node 22.12+).
- Later phases: react-data-grid, HyperFormula, Chart.js, jsPDF
- **HyperFormula license:** use `licenseKey: 'gpl-v3'`. This repo must stay public and GPL-compatible (use GPL-3.0 as the project license).

## Deploy
- Target: Vercel Hobby (free) or Cloudflare Pages (free). Static build only (`npm run build` → `dist/`).
- Add SPA fallback so deep links work: `vercel.json` rewrite to `/index.html`, and `public/_redirects` with `/* /index.html 200` for Cloudflare.
- No environment variables should be required to build or run.

## Commands
- `npm run dev` — local dev server
- `npm run build` — production build
- `npm run test` — Vitest
- `npm run lint` — ESLint

## Folder Structure
```
src/
  app/            # router, layout, nav
  features/
    dashboard/
    typing/
    numpad/
    copy/         # Copy Test
    encoding/     # Document Encoding (documents, rules, paper views)
    assessment/
    settings/
    (later) qc/, excel/, reports/
  lib/
    storage.ts    # localStorage read/write, schema versioning, export/import
    scoring.ts    # WPM, accuracy, KPH calculations
    random.ts     # seeded random helpers for reproducible drills
  data/
    passages/     # typing passages (original text only)
    ph/           # fake Filipino names, streets, barangays, amounts
  components/     # shared UI (Button, Card, Timer, StatBadge); entry/ = form + spreadsheet runners
```

## Scoring Definitions (single source of truth: `lib/scoring.ts`)
- **Gross WPM** = (total typed characters ÷ 5) ÷ minutes
- **Net WPM** = Gross WPM − (uncorrected errors ÷ minutes), minimum 0
- **Accuracy %** = correct characters ÷ (correct characters + mistakes) × 100, where mistakes = wrong + extra + skipped keys. (Same as correct ÷ typed when there are no extra/skipped keys.)
- **Keystroke accuracy %** (typing) = keys that did not add a mistake ÷ all keys that added text × 100. Counts mistakes even if later fixed with Backspace.
- **KPH (numpad)** = correct keystrokes ÷ elapsed hours (count digits, decimal point, and Enter)
- **Entry accuracy (numpad/encoding)** = fully correct entries ÷ total entries × 100
- Round displayed values to whole numbers; store raw values.

## Storage Schema (`lib/storage.ts`)
Single key: `encodojo:v1` (the key name never changes; the schema version is `data.version`, currently **4**)
```ts
type AppData = {
  version: 4;
  profile: { displayName: string; createdAt: string };
  settings: {
    numpadMode: 'mixed' | 'beginner';     // Numpad Practice: Halo-halo (= Assessment) or Pang-baguhan
    sound: boolean;
    showLiveStats: boolean;                  // UNUSED: practice always shows live stats, Assessment always hides them; drop at next schema bump
    largeText: boolean;                      // v3: "Mas malaking text" in Settings
    copyMode?: 'form' | 'sheet';             // optional, missing = 'sheet'; shared by Copy Test + Document Encoding practice (no schema bump)
  };
  // History: v1 one `difficulty` 1-6 -> v2 typingLevel + numpadDifficulty -> v3 + largeText
  // -> v4 numpadMode (everyone starts on "mixed"; typingLevel/numpadDifficulty removed).
  sessions: Session[];
};

type Session = {
  id: string;
  type: 'typing' | 'numpad' | 'copy' | 'encoding' | 'assessment';  // extend in later phases (SESSION_TYPES)
  startedAt: string;                // ISO
  durationSec: number;
  metrics: Record<string, number>;  // e.g. { grossWpm, netWpm, accuracy } or { kph, entryAccuracy }
  mistakes: { expected: string; typed: string; index: number; section?: 'typing' | 'numpad' | 'copy' | 'encoding'; field?: string }[];
};
```
- Assessment sessions store flattened metrics with a part prefix (`typingNetWpm`, `numpadKph`, `copyFieldAccuracy`, ... plus `targetsMet`, `targetsTotal`, `jobReady` 0/1) and tag each mistake with `section`. The report is always recomputed from the saved session. Assessments from before the Copy Test have no `copy*` metrics: `hasCopyPart()` hides that part (4 targets instead of 6). Assessments from before Document Encoding have no `encoding*` metrics: `hasEncodingPart()` hides Part 4 (6 targets instead of 8).
- Encoding practice sessions store `metrics.documents`, `sheet` (0/1), `seconds`, and `docType` (1 invoice, 2 delivery, 3 application, 0 mix; see `DOC_TYPE_CODE`).
- Wrap all reads/writes in try/catch; if data is missing or corrupt, fall back to defaults and never crash.
- Include a `migrate()` function so future schema versions can upgrade old data.
- **Export:** download `encodojo-progress-YYYY-MM-DD.json`. **Import:** validate shape before replacing; show a confirm dialog.
- Cap stored sessions (e.g. keep latest 500) to stay well under the localStorage limit.

---

## PHASE 1 — DONE (2026-09-26)
Status: built, tested, and live at https://encodojo.vercel.app (Vercel project `encodojo`, auto-deploys on every push to `main`). Do not rename the Vercel project — localStorage progress is tied to the domain.

### 1. Project setup
- Vite + React + TS, Tailwind, React Router, Vitest, ESLint.
- Layout with sidebar nav: Dashboard, Typing Test, Numpad Drill, Settings. Placeholder "Coming soon" entries for later screens.
- LICENSE (GPL-3.0), README with run/deploy steps.

### 2. Typing Test (`features/typing`)
- Training modes: **30 sec** and **1 min** (changed from 1/3/5 min at the owner's request). Save rules: see "Product Direction".
- Results also show: keystroke accuracy, comparison with the last saved test + personal best, and a job-ready check (targets in `lib/targets.ts`: 40 Net WPM, 95% accuracy).
- **Plain office text only for now** (owner's decision, 2026-09-26) in both training and the Assessment: hiring typing tests use plain prose, so the 40 WPM target stays fair. Names, addresses, and numbers will be trained by upcoming features (Copy Test, Document Encoding) instead.
- Passages: ~75% generated (`features/typing/generatePassage.ts`, level 1 = ~36 office sentence templates), ~25% hand-written (`data/passages/`). Levels 2 (names/addresses/dates) and 3 (invoices/payroll/codes, totals must add up) still exist and are tested — reuse them for the Copy Test / Document Encoding.
- Typed text is compared with the passage by **alignment** (edit distance, `features/typing/alignTyping.ts`), not position by position. Each wrong key, extra key (incl. double space or a space inside a word), or skipped letter = 1 mistake, and the following letters stay in sync (no "domino" of errors).
- Show passage; highlight current character; mark correct (neutral) vs wrong (red) as the user types.
- Timer starts on first keystroke. Backspace allowed.
- Live stats (toggleable): Net WPM, Accuracy, time left.
- Results screen: Gross WPM, Net WPM, Accuracy, list of mistakes (expected vs typed), "Try again" button.
- Passages: original text only (no copyrighted content). Mix of plain sentences, names, addresses, and numbers typical of office documents.
- Disable paste into the input.

### 3. Numpad Drill (`features/numpad`)
- Show one entry at a time; user types it and presses Enter to submit.
- Entry types by difficulty: short integers → amounts with decimals (e.g. `12,450.75`) → reference numbers (e.g. `DR-2026-004517` style, digits only for numpad mode).
- Training modes: **30 sec** and **1 min** (changed from 2/5 min at the owner's request).
- Two number types (owner's decision, replaced difficulty 1-6): **Halo-halo** (default, difficulty 6 = exactly the Assessment mix, `MIXED_DIFFICULTY`) and **Pang-baguhan** (difficulty 1, short numbers). Only Halo-halo counts for "Pinakamabilis na numpad" on Home (`forNumpadBest`); beginner results skip the hiring target and KPH levels.
- Live stats: KPH, entry accuracy, entries done.
- Results: KPH, entry accuracy, job-ready check, list of wrong entries.

### 4. Dashboard (`features/dashboard`)
- Cards: best Net WPM, latest accuracy, best KPH, total sessions, current streak (days with at least one session).
- Quick-launch buttons for Typing Test and Numpad Drill.
- Recent sessions list (last 10).

### 5. Settings (`features/settings`)
- Display name, larger text, sound. (No live-stats toggle: practice always shows live stats; the Assessment never does.) (Difficulty is not in Settings: Numpad Practice has a Halo-halo / Pang-baguhan picker; Typing has no level picker while it is plain text only.)
- Export progress, Import progress, Reset all data (with typed confirmation).

### 6. Tests
- Unit tests for every function in `lib/scoring.ts` (including edge cases: 0 time, 0 characters, all errors).
- Unit tests for storage: default load, corrupt data fallback, export/import round-trip.

### Phase 1 Done When
- All four screens work, data persists after refresh, export/import round-trips correctly.
- `npm run build` succeeds with no errors, tests pass.
- Deployed and reachable on a free `*.vercel.app` or `*.pages.dev` URL.

---

## Later Phases (do not build yet — for context only)

**Assessment — DONE (2026-09-26):** Typing (1 min, plain office text) + Numpad (1 min, Halo-halo) + Copy Test (2 min, Form) + Document Encoding (3 min, Form, fixed mix invoice → delivery → application, repeated) with report card (8 targets). About 8–10 minutes with breaks. Every later feature must also be added as a new Assessment part (see "Product Direction").

**Phase 2 — DONE (2026-09-26):**
- ✅ **Copy Test** (`features/copy`, DONE 2026-09-26): copy fake records (Pangalan, Petsa ng kapanganakan, Address, Contact No. `(0NN) 000-NNNN` — local part starting with 0 can never be a real line, ID No. `ED-YYYY-NNNNN-L`) into a 5-field form, like an alphanumeric data entry hiring test. **Tab** is taught as the way to move between fields (real forms/software); Enter also moves to the next field for beginners, and Enter on the last field submits. Speed shown as net KPH (target) + Net WPM (extra); `copyKphOf()` falls back to WPM×300 for the first sessions saved before KPH.
  - **Two layouts** (owner's decision): **Spreadsheet** (`CopySheetRunner`, the DEFAULT in practice because most encoder jobs use Excel/Google Sheets; like Excel/Google Sheets: one row per record, column letters A–E, headers on row 1, Tab = next cell, Enter = next row, earlier rows can be fixed; the final sheet contents are scored) and **Form** (`CopyRunner`; like hiring tests and company software). Saved as optional `settings.copyMode` ('form' | 'sheet', missing = sheet; no schema bump). Sessions store `metrics.sheet` 0/1. The Assessment always uses the Form layout, because hiring tests use forms ("Spreadsheet para sa trabaho, Form para makapasa sa hiring test"). A field is correct only on an exact match (outer spaces ignored). Practice 1 or 2 min; Assessment part 3 (2 min). Wrong fields show the exact wrong/missing characters.
- ❌ **Mistake Review — REMOVED on purpose** (owner's decision, 2026-09-26): built, then removed because an extra menu confused non-techy users; practicing the feature itself again works better, and results/reports already show mistakes. Do NOT add it back unless the owner asks (the code is in git history, commit ed61290).
- ✅ **Source Document Encoding** (`features/encoding`, DONE 2026-09-26; owner's decisions, built in this order):
  1. Document generators + encoding rules + scoring (tests). Generalize Copy Test scoring to any field list and reuse it.
  2. Paper-like HTML views for 3 documents: **Sales Invoice** (encode: Invoice No., Date, Customer ["Sold to:" on paper], Terms, Total Amount), **Delivery Receipt** (DR No., Date, Deliver To, Address, Total Qty), **Application Form** (Last Name, First Name, Birth Date, Address, Contact No.; names in "Surname / Given Name" boxes on paper). KEY FIELDS only, not every line item. Invoice math must add up (tested).
  3. Practice page: pick document type + 3 or 5 minutes; **Spreadsheet** layout default (one row per document, like an invoice log in Excel; headers show the format hint) + **Form** layout; encoding rules always visible (`EncodingRules`); results with highlighted mistakes. Built on the shared entry runners (the Copy Test was moved onto them too).
  4. Assessment **Part 4** (3 min, Form layout, a fixed mix of the 3 document types) + report section + comments.
  5. Home: Typing, Numpad, Copy Test, Document Encoding as steps 1–4 in one row; Assessment is a wide card (step 5) below. Sidebar link. Docs.
  - **Encoding rules** shown on screen: dates → mm/dd/yyyy (paper may show "Sept. 14, 2026", "September 14, 2026", "14-Sep-2026"); amounts → digits and decimal point only, no ₱ or commas (₱5,115.25 → 5115.25); names/text → exact copy. Fields are scored exactly against the rule-converted value.
  - **Targets (EncoDojo estimates, no public standard):** 95% fields correct, 6,000 net KPH (lower than Copy Test's 8,000 because of searching and converting). Also show documents completed.
  - Fake data only: fake companies/people, made-up "Ref. No." (never a TIN/SSS-like pattern).
  - Later (Level 4): "scanned" look (tilt, stamps) and handwriting.

Original Phase 2 plan: Alphanumeric Copy Test (timed list of fake names/addresses/IDs), Source Document Encoding (rendered fake invoices, receipts, application forms, delivery receipts, timesheets → form fields, per-field QC), Mistake Review screen with "Retry mistakes only" (built, then removed — see above).

**Phase 3 (NEXT — ask before adding react-data-grid / HyperFormula):** Excel Drills with react-data-grid + HyperFormula and auto-checker, in this order: shortcuts/navigation → formatting (dates, numbers, leading zeros) → sort/filter/find & replace/remove duplicates → SUM/COUNT/IF/COUNTIF/SUMIF → text cleanup (TRIM, PROPER, split/combine names) → VLOOKUP/XLOOKUP → pivot tables (bonus). Also Spot-the-Difference / QC drill.

**Phase 4:** (The Assessment now covers the "diagnostic test" and "L6 hiring-exam simulation" ideas.) 6-level unlock system (90%+ accuracy to advance), daily loop, weekly review with weakest-skill highlight, Progress & Reports with Chart.js, PDF "Practice Certificate — self-assessed" via jsPDF at Job-ready (95%+ accuracy, 40+ Net WPM, target KPH).

**Levels (for reference):**
L1 clean typed documents · L2 numpad + simple forms · L3 Excel basics · L4 messy documents + formulas · L5 VLOOKUP, cleanup, QC · L6 full timed hiring-exam simulation

## Fake Data Rules (Philippine context)
- Names with realistic quirks: "Ma.", "Jr.", "III", "Dela Cruz" vs "De la Cruz", compound first names.
- Addresses: Brgy., Purok, Sitio, Blk/Lot, city + province.
- Amounts in ₱ with commas and 2 decimals; dates as mm/dd/yyyy.
  - Exception: in text the user must TYPE (typing passages), write `PHP` instead of `₱`, because most keyboards have no peso key.
- ID-like numbers must follow a made-up pattern, never real SSS/TIN/PhilHealth structures copied from real people.
- Later "messy" data: extra spaces, inconsistent capitalization, duplicates, missing fields.

## Working Style
- Work in small, reviewable steps; commit after each working feature with a clear message.
- Before big changes, briefly state the plan.
- Prefer simple, readable code over clever code — the owner is learning from it.
- Accessible UI: visible focus states, labels on inputs, sufficient contrast.
