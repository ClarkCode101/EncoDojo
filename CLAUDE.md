# EncoDojo — Encoder / Data Entry Practice Simulator

## Project Overview
**EncoDojo** (repo: `github.com/ClarkCode101/EncoDojo`, package name `encodojo`) is a browser-based practice app for skills tested and used in **Encoder / Data Entry jobs in the Philippines**: typing speed & accuracy, numpad (10-key) speed, alphanumeric copy tests, source-document encoding, QC/error-spotting, and basic-to-intermediate Excel.

The owner is learning while building. When you finish a task, **explain what you did in simple terms (Taglish is fine)**, and point out anything they should test manually.

## Brand (decided 2026-09-26): "Dojo Indigo + Belt Gold"
- Colors are defined ONCE in `tailwind.config.js`: `brand-*` (indigo, main `brand-800` #2E2A6B), `belt-*` (gold accent, `belt-400` #F5B301), `paper` (#FBF8F1 page background). Neutrals use Tailwind `stone-*` (warm gray). Never use raw `blue-*`/`slate-*` for UI.
- **"Dojo notebook" style** (owner's choice, 2026-09-27, to stop the app looking AI-made): fonts bundled via `@fontsource` (Atkinson Hyperlegible body, Zilla Slab `font-display` for h1–h3 and the sidebar name). Thin rules instead of boxes, ruled lists instead of card grids, real greetings, short natural Taglish, no emoji as icons, no em dashes in UI text. Applied to every page (2026-09-27). Shared pieces: `Section` (slab heading over a dark rule; `small` for nested), `Step` numbers "01/02" (`lib/listNumber.ts`), `ResultSummary` (results top), `Notice`/`SaveBanner` with a thick left edge, `StatBadge` under a thin rule, check/x icons (no ✅❌). Practice drills have no box around them (the source is the paper sheet). Zilla Slab uses lining numbers (`"lnum"` in tailwind.config.js) because its default old-style 0 looks like the letter o. Plain ✓/✗ text marks are fine; emoji are not.
- Gold is for fills/badges with dark text on top — never gold text on white (low contrast).
- Red = mistake, green = correct, amber = warning: keep these meanings; they are never brand colors.
- Logo: a tied belt on a gold tile (`<Logo />` in `components/icons.tsx`, same drawing in `public/favicon.svg`).
- Signature touches: the passage looks like a sheet of paper (`shadow-paper`), and the Assessment report has a rubber stamp ("PASADO" / "HINDI PA", `Stamp` in `components/ResultPieces.tsx`).
- **Belt ranks — early version LIVE** (owner's decision, 2026-09-26): `lib/belts.ts` + `components/BeltCard.tsx` at the bottom of the sidebar ("Ang belt mo", progress bar, what to do next; links to the Assessment; icon only when the sidebar is collapsed). The belt comes from the BEST Assessment, so it is never taken away: White (none / <25% of targets), Yellow 25%+, Orange 50%+, Green 75%+, Blue = Job-ready once, Black = Job-ready on 3 different (local) days. Percentages, so older 4-, 6- and 8-target assessments still count. Phase 4 may extend this (e.g. per-skill levels), but keep these rules unless the owner changes them.
- **Sidebar coach** (owner's decision, 2026-09-27), rule-based, no AI — `features/dashboard/coach.ts` (tested):
  - No "done today" ✓ marks on the practice links (owner's decision, 2026-09-27): a ✓ made a practice look finished and not repeatable. Don't add completion marks to practice links.
  - "Susunod na gagawin" card above the belt card (`NextFocusCard`): first a practice never tried yet (Home order), else the practice whose LATEST result is furthest below its target (speed or accuracy, whichever is weaker, with the number), else the Assessment. Links to it.
  - On short screens (<900px tall, and tighter again below 720px) the sidebar spacing tightens and the card/belt hint lines hide (hover title keeps them), so the sidebar doesn't scroll.
- **Sensei guide — LIVE** (owner's idea, 2026-09-27): `features/sensei/`. An original pixel-art Sensei (`SenseiArt`, one SVG rect per pixel: white beard, gold headband, indigo gi, black belt) fixed at the lower-right. A speech bubble pops up ~1s after a page opens and hides after ~9s; clicking him gives a new line. Lines are rule-based (`lines.ts`, tested): page tips, lines about the user's own results (next focus, near next belt, streak), encouragement; right after a practice he talks about the results (or cheers). He is **hidden while practicing and during the whole Assessment** (`useSenseiQuiet`, called by `PracticeFrame` and the Assessment) so he never covers the work. "Itago si Sensei" makes him small; Settings: Ipakita / Maliit lang / Wala (`settings.sensei`). Scrolling pages get bottom padding so he never covers the last buttons. The TEMPORARY "🧪 Test" dev button sits at the top-right so they don't overlap.
- Planned: optional on-screen keyboard/numpad guide.

## UI & Language Rules (decided 2026-09-26)
The app must be easy for **older and non-techy users**:
- **"Taglish ang gabay, English ang trabaho"** (decided 2026-09-26):
  - Guidance is **Taglish**: instructions, explanations ("Ano ito?"), results, comments, Settings. Keep job terms in English (WPM, KPH, Accuracy, Encoder, Assessment).
  - The work itself looks like a real **English** hiring test/form: field labels and in-test buttons are English with the Taglish meaning smaller beside them, via `EnTl` (e.g. "Name (Pangalan)", "Submit (Ipasa)", "Finish (Tapusin na)"). Typing passages stay English; records use real-looking Filipino names/places.
  - Exception (owner's choice, 2026-09-26): **spreadsheet column headers are English only** + the format hint (e.g. "Date" + `mm/dd/yyyy`), no Taglish, to keep them short like a real sheet.
  - Code, comments, and commit messages stay in English.
- Big readable text (root 17px; Settings → "Mas malaking text" = 19px via `html.large-text`, `settings.largeText`; owner chose NOT to have it in the sidebar). Buttons at least 44px tall. No ALL-CAPS labels.
- Every page: icon + title + one-sentence explanation, then numbered steps (`Step` component) for what to do.
- **Practice pages use two screens** (owner's decision, 2026-09-26, because one long page felt overwhelming) — `components/Practice.tsx`:
  1. `PracticeSetup`: choices, **at most 3** short "Tandaan" points (+ optional extra like the encoding rules), one big "Simulan" button (focused, so Enter starts).
  2. Practice screen: `PracticeHeader` (title, chosen settings, "‹ Palitan ang settings" only before the first key) + the drill only: a sticky one-line `LiveStatsBar` and a one-line `KeyTips` reminder. No instruction boxes, and never repeat the same instruction in two places. "Ulitin" on results goes straight back to the practice screen. The Assessment parts and breaks use the same `PracticeFrame` with a one-line `PartHeader` (title + "Bahagi N sa 4" bar), so taking the Assessment never scrolls the page.
  - The practice screen **fits the window with no page scroll** (owner's request) from tablet width up: `PracticeFrame` is exactly window-high; long parts (passage, document, sheet rows, form) shrink and scroll inside their own box (`min-h-0` + `overflow-auto`). Checked at 1366×650, 1366×720, 1920×950. Keep new drills inside this frame and compact (`Card compact`).
- Every number shown gets a plain explanation via `HelpTip` ("Ano ito?", click-to-open `<details>`, never hover-only). Explanations live in `lib/glossary.ts`. Exception (owner's feedback: Home felt overwhelming): Home's progress tiles share ONE "Ano ang mga numerong ito?". Keep Home short: step cards with 3–5 word descriptions, one-line "Parating pa", warnings only inside confirm questions.
- Results screens start with a one-sentence plain summary + the main action buttons, then details.
- Use shared pieces in `components/ui.tsx` (Button, Card, Step, HelpTip, Notice, Checkbox, LiveStatsBar, KeyTips, SegmentedPicker, ConfirmButton) and `components/icons.tsx` (hand-made SVG icons, no icon library).
- Deletes always ask first (ConfirmButton). Sidebar shows only usable pages; "coming soon" features are listed on Home. The current page in the sidebar is a white pill with a gold "belt" mark at the sidebar edge. Sidebar top: logo + "EncoDojo" only (no tagline). The sidebar can be collapsed to icons only on desktop (button beside the logo, remembered in `settings.sidebarCollapsed`); collapsed = icon + `title` tooltip + screen-reader name, and the page content widens (`max-w-7xl`). Phones keep the top menu.

## Product Direction: Training + Assessment (decided 2026-09-26)
- **Training (the "dojo")**: every feature (Typing, Numpad, Copy Test, Document Encoding, and later QC, Excel) is a training ground. User picks settings, can "Finish now", can retry. Results are saved by default but optional ("Don't save this result" / "Save it again"). A run ended with "Finish now" starts **unsaved** ("Save anyway") because short runs inflate WPM/KPH.
- **TEMPORARY test tools — remove when done** (owner asked, 2026-09-26): `features/assessment/DevJump.tsx` adds a floating "🧪 Test" button (bottom-right) on the Assessment intro that opens a popup, so the page layout is unchanged: jump to any part or break, sample reports (Hindi pa 2/8, Halos pasado 6/8, Job-ready 8/8 with made-up mistakes), a "Tapusin agad" button during test runs (a dev-only event the timer listens to), and a sidebar belt preview. Only in `npm run dev` (`import.meta.env.DEV`), never in the built site; test runs are never saved. To remove: delete that file and every line marked "TEMPORARY (DevJump)" (AssessmentPage.tsx, BeltCard.tsx, useCountdown.ts).
- **Exam mode** (owner's request, 2026-09-27): while the Assessment is running (parts and breaks) the sidebar is hidden (`useFocusMode` in `lib/focusMode.ts`, read by the layout) and the page widens. Every part/break header has "Itigil ang Assessment" (ConfirmButton: "Itigil? Hindi mase-save ang nagawa mo." → back to the intro, nothing saved). No browser fullscreen API (its "Press Esc" message confuses non-techy users).
- **Assessment** (`features/assessment`): runs every feature in a fixed order under exam rules — fixed duration/difficulty, no live stats, no "Finish now", no retry — then shows a **report card**: per-target ✅/❌, overall "Job-ready" verdict, rule-based comments (no AI), change vs previous assessment, and mistake lists. Report layout (owner's feedback 2026-09-27: the long report felt overwhelming): verdict + stamp → a **scorecard** (one tile per part, one line per target: label, ✓/✗, number / target) → **"Ano ang aayusin"** with tips ONLY for parts not passed, each with a practice button ("Ano ang susunod?" when job-ready) → **"Mga detalye"**: one folded `<details>` per part (stats, KPH levels, and that part's mistake list inside); parts that are not passed start open. No repeated numbers across sections. **"I-download (larawan)"** saves a 1080×1350 PNG "result card" (`resultCard.ts`, drawn with Canvas, no library): logo + date, verdict + stamp + the belt earned up to THAT assessment, the scorecard, and the footer "Practice result — self-assessed, hindi opisyal na certificate" (always keep this line so it can't pass as an official certificate). File: `encodojo-assessment-YYYY-MM-DD.png`. A PDF certificate (jsPDF) is still planned for Phase 4. Always saved as ONE session of type `'assessment'`.
- Each drill has a **Runner** component (`TypingRunner`, `NumpadRunner`, `CopyRunner`) that runs one attempt and returns a Session without saving; training pages and the Assessment both use it. **When adding a new feature, build its Runner first, then add it as a new part of the Assessment** (`evaluate.ts` checks + a `has…Part()` guard for older saved assessments, `comments.ts` rules, `AssessmentReport.tsx` section, history column). Exception: **learning tracks** (below) are never Assessment parts.
- **Learning tracks, "Matuto"** (owner's decision, 2026-09-27): Microsoft Office skills taught lesson by lesson (Excel now; Word and other Office apps later, each as its own track). They are for LEARNING, not job-ready measurement, so they are NOT part of the Assessment, the belt, or the "Susunod na gagawin" coach. Sidebar: their own group "Matuto" under "Practice". Home: a short "Matuto" section (one ruled row per track: lessons passed) under the Assessment row, with the line "Para matuto lang ito. Hindi kasama sa Assessment at sa belt." Lessons can always be redone; a lesson shows "Pasado na, puwedeng ulitin" once a saved round reached its targets (`lessons.ts`). Their sessions still count as practice (streak, recent list, "Burahin lahat ng practice").
- Field-by-field entry drills (Copy Test, Document Encoding) share the **entry runners** in `components/entry/`: `EntryFormRunner` (form) and `EntrySheetRunner` (Excel-like), fed by `nextItem(index)` → `{ title, source, fields, expected }`, scored by `lib/fieldScoring.ts`, mistakes shown by `FieldMistakesCard`. Reuse them for new entry-style drills instead of copying code.
- Practice "clear all" uses `PRACTICE_TYPES` (every session type except `'assessment'`), so new session types are included automatically.
- Job-ready targets live in `lib/targets.ts` (typing 40 Net WPM / 95%; numpad 8,000 net KPH / 95%; copy 95% fields / 8,000 net KPH — KPH is the commonly quoted alphanumeric data entry test minimum; per-FIELD accuracy is EncoDojo's stricter choice; encoding 95% fields / 6,000 net KPH — EncoDojo estimates, no public standard; QC 95% correct decisions / 3 records per minute — EncoDojo estimates). KPH levels (`KPH_LEVELS`): 8,000 Pasado (entry-level), 10,000 Karaniwang hinihingi, 12,000 Magaling — commonly quoted 10-key benchmarks (checked 2026-09 on typing/hiring sites; PH job posts usually state WPM, not KPH). Shown by `KphLevels` on Numpad results and the Assessment report.

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
    qc/           # QC Check (record QC: original vs encoded, mark the wrong fields)
    excel/        # Excel Practice (own spreadsheet model sheet.ts + timed shortcut tasks)
    assessment/
    settings/
    (later) reports/
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
    sidebarCollapsed?: boolean;              // optional, missing = open; desktop sidebar collapsed to icons (no schema bump)
    sensei?: 'on' | 'small' | 'off';          // optional, missing = 'on'; the Sensei guide (no schema bump)
    // Optional, added 2026-09-27 without a schema bump (missing = old behavior):
    lastBackupAt?: string;                   // ISO; set by "I-download ang backup"; backup reminder (lib/reminders.ts)
    englishOnly?: boolean;                   // "English lang": EnTl shows only the English word
    dailyGoal?: number;                      // 0 | 3 | 5 | 10 practices per day (DAILY_GOALS); sidebar + Sensei
    bigSource?: boolean;                     // "Mas malaking babasahin": html.big-source (passage, numpad number, records/documents)
    reduceMotion?: boolean;                  // "Bawasan ang galaw": html.reduce-motion; Sensei doesn't pop up by himself
    soundCorrect?: boolean;                  // "Tunog kapag tama": correctTick() in lib/sound.ts
  };
  // History: v1 one `difficulty` 1-6 -> v2 typingLevel + numpadDifficulty -> v3 + largeText
  // -> v4 numpadMode (everyone starts on "mixed"; typingLevel/numpadDifficulty removed).
  sessions: Session[];
};

type Session = {
  id: string;
  type: 'typing' | 'numpad' | 'copy' | 'encoding' | 'qc' | 'excel' | 'assessment';  // extend in later phases (SESSION_TYPES)
  startedAt: string;                // ISO
  durationSec: number;
  metrics: Record<string, number>;  // e.g. { grossWpm, netWpm, accuracy } or { kph, entryAccuracy }
  mistakes: { expected: string; typed: string; index: number; section?: 'typing' | 'numpad' | 'copy' | 'encoding' | 'qc'; field?: string }[];
};
```
- Assessment sessions store flattened metrics with a part prefix (`typingNetWpm`, `numpadKph`, `copyFieldAccuracy`, ... plus `targetsMet`, `targetsTotal`, `jobReady` 0/1) and tag each mistake with `section`. The report is always recomputed from the saved session. Assessments from before the Copy Test have no `copy*` metrics: `hasCopyPart()` hides that part (4 targets instead of 6). Assessments from before Document Encoding have no `encoding*` metrics: `hasEncodingPart()` hides Part 4 (6 targets instead of 8). Assessments from before QC have no `qc*` metrics: `hasQcPart()` hides Part 5 (8 targets instead of 10).
- QC sessions store `metrics.records`, `correctRecords`, `decisions`, `correctDecisions`, `decisionAccuracy`, `errorsTotal`, `caught`, `missed`, `falseAlarms`, `perMinute`, `seconds`. A QC mistake has `expected` = original value and `typed` = encoded value; `expected === typed` means a false alarm (`isFalseAlarm`).
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
- Layout (owner's request 2026-09-27, "hindi nakaka-overwhelm"): ruled `SettingRow`s (name + one line left, control right: `Toggle` On/Off or `SegmentedPicker hideLabel`) in groups: Ikaw (name, daily goal) · Pagbasa at itsura (larger text, bigger reading text, less motion, Sensei) · Practice at tunog (English lang, mistake sound, correct sound; a "starting duration" option was built and removed on purpose, owner's decision) · Backup (status "Huling backup: ...", amber reminder at 5+ sessions and 7+ days) · "Burahin ang lahat ng data" folded in a `<details>`.
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

**Assessment — DONE (2026-09-26):** Typing (1 min, plain office text) + Numpad (1 min, Halo-halo) + Copy Test (2 min, Form) + Document Encoding (3 min, Form, fixed mix invoice → delivery → application, repeated) + QC Check (2 min, Part 5, added 2026-09-27) with report card (10 targets). About 10–12 minutes with breaks. Every later practice feature must also be added as a new Assessment part (see "Product Direction"); learning tracks ("Matuto") are not.

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

**Phase 3 (IN PROGRESS):**
- ✅ **QC Check** (`features/qc`, DONE 2026-09-27; owner chose "Record QC" + Assessment Part 5, 2 min): the ORIGINAL record (Copy Test generator) and an ENCODED copy with 0–2 realistic mistakes (swapped/missing letter, wrong digit or nearby key, missing period, lowercased word; ~30% of records have none; numbers only get digit mistakes). One row per field; click the row or press 1–5 to mark "May mali", Enter / Submit passes the record, nothing marked = "walang mali". Scored per field decision (flagging nothing only gets ~80%). Results list missed mistakes (different characters marked) and false alarms ("Tama pero minarkahan"). Home row 05 (Assessment is 06), sidebar link, coach, Sensei tips. Later idea: QC on the encoding documents.
- 🟡 **Excel** learning track (`features/excel`, Aralin 1 DONE 2026-09-27). Owner's decisions: Excel is a learning track, NOT an Assessment part; NO timer ("learning para matuto"):
  - NO react-data-grid (decided with the owner): our own Excel-like model `sheet.ts` (pure, tested): arrows, Ctrl+Arrow to the edge of the data, Home / Ctrl+Home / Ctrl+End, Shift / Ctrl+Shift selection, Enter/Tab, typing = Enter mode (arrows commit), F2 = Edit mode, Esc, Delete, Backspace, Ctrl+C/V, Ctrl+Z, Ctrl+A. `ExcelSheetView` draws it (Name Box, formula bar, column letters, row numbers, frozen row 1, green active cell).
  - **How a lesson teaches** (owner approved the approach, 2026-09-27): the Excel page lists the lessons (`lessons.ts`; not locked, suggested order). A lesson (`ExcelLesson`, content in `lesson1.ts`) is small topics; each topic = **Alamin** (1–2 sentences + the keys) then **Subukan** (one task per kind on the sheet). While trying: "Hint" (words first, then the keys), "Ipakita kung paano" (the app plays the task's `solution` on the sheet step by step, then puts the sheet back: "Ikaw naman ngayon"), "Laktawan". Done = "✓ Tama!" (+ "Mas mabilis kung ..." when done the long way); nothing is scored during the lesson. Then **"Tapos na ang aralin"** → **Pagsusulit** (`ExcelQuiz`): 6 random task kinds (not "go to"), no hints, no timer; passed = 5 of 6 done (`QUIZ_PASS`), the shortcut is only shown, never required. The Pagsusulit can be started directly from the list ("May alam na ako").
  - **Layout: "gabay sa gilid"** (owner's choice, 2026-09-28, after "hindi na user friendly"): `LessonLayout` = the guide on the LEFT (18rem: "‹ Mga aralin", "Aralin N" + title, then the panel) and the sheet on the RIGHT at full height; the app sidebar is hidden meanwhile (`useFocusMode`, like the Assessment). The lesson panel: "Bahagi X sa N" + one numbered circle per topic (click = jump; current filled, finished light; title on hover) → the topic title, its 1-2 sentences and keys → the "Gawin" card (task, record table, status, ONE help button that grows: "Kailangan ng tulong?" = hint in words → "Ipakita ang key" = the keys → "Ipakita kung paano" = the demo; "Laktawan" is a small link; when done: "✓ Tama!" + "Susunod"). Alamin and Subukan are ONE screen per task now (no separate "Subukan" click). The quiz uses the same layout (progress dots, the task, a "Laktawan" link, feedback). The lessons list: ONE button per lesson ("Simulan" / "Ulitin", the suggested one filled), a small green "Pasado" mark, and the topics + "Pagsusulit" folded under "Mga bahagi at pagsusulit".
  - **Jump to any topic** (owner's request, 2026-09-28): the lessons list shows each lesson's topics as links (start the lesson at that topic, `startTopic`), and inside a lesson the topics are buttons at the top (current = filled; finished = light; click = go to that topic's Alamin, back or ahead). On short screens (<760px tall) only the numbers show for the other topics (the title is the hover text). Safe because every task has its own rows/columns and works in any order (tested). No "resume where I stopped" (lessons are short; owner agreed).
  - Aralin 1 "Navigation at shortcuts": 6 topics (the sheet and the cell; Ctrl+Arrow; Ctrl+Home/End and Home; selecting; editing; copy and undo), 13 task kinds in `tasks.ts` (each with `hint` and `solution`; every task uses its own row so tasks never block each other; tested for the lesson order and 300 random quizzes). Sheet: fake sales log (Ref No., Customer, Branch, Date, Amount; 18–26 records).
  - Session type `'excel'` (saved at the end of a Pagsusulit, always): `tasksTotal`, `tasksDone`, `tasksShortcut`, `taskAccuracy`, `shortcutRate`, `avgSeconds`, `level`, `passed` (0/1). Mistakes: expected = the shortcut, typed = "N pindot" / "Gumamit ng mouse" / "Hindi natapos", field = task id (`TASK_LABEL`). The first, timed rounds (no `passed`) count as passed with the old `JOB_READY_EXCEL` targets.
  - Aralin 2 "Pag-encode ng data" (DONE 2026-09-27): 5 topics (a whole record with Tab + Enter; Enter down a column; Ctrl+D for one cell and a selection; Ctrl+Enter into every selected cell; Ctrl+; today's date), 6 task kinds in `tasks2.ts` (sales log + a Status column F with blank stretches, one stretch per task; tested in lesson order and 300 random quizzes). The quiz uses all 6 kinds. A task can show the record to type as a small table (`record` → `TaskRecord`).
  - `sheet.ts` data entry rules (Excel's): after Tabs, Enter goes back to the column where the Tabs started (`tabStartCol`; any other move or `clickCell` forgets it); Ctrl+D fills down (one cell = from the cell above); typing keeps the selection so Ctrl+Enter fills it; Ctrl+; = `todayText()` (mm/dd/yyyy). The edit box passes Ctrl+; to the sheet and blocks the browser's Ctrl+D (bookmark).
  - Aralin 3 "Formatting" (DONE 2026-09-28): 3 topics (numbers vs text: the apostrophe keeps leading zeros; Ctrl+Shift+1 comma and 2 decimals, and typing a plain number into a formatted cell; Ctrl+B bold), 6 task kinds in `tasks3.ts` on a fake payroll list (Emp No. and Account No. as text with leading zeros, Name, Branch, Daily Rate as numbers; tested in lesson order and 300 random quizzes). The quiz uses all 6 kinds.
  - `sheet.ts` formatting rules, ONLY on sheets made with `formatting: true` (Aralin 3+; Aralin 1-2 sheets keep every cell as plain text and the header always bold): digits-only entries become numbers (00457 -> 457) unless typed with an apostrophe (text, keeps its zeros; the formula bar and F2 show the apostrophe); numbers align right, text left; `formats` per cell ("row,col": `text`, `number2`, `bold`); Ctrl+Shift+1 (`!` or `1`) = number2, Ctrl+Shift+~ = General, Ctrl+B toggles bold on the selection; Ctrl+Z undoes cells AND formats; `displayValue`, `alignsRight`, `formulaBarValue`, `editCell` (double-click) are the view helpers. Header bold on these sheets comes only from Ctrl+B.
  - Aralin 4 "Sort, filter, find & replace" (DONE 2026-09-28): 5 topics (Find Ctrl+F; Replace All Ctrl+H; Sort A to Z / Z to A by the active column; Filter Ctrl+Shift+L + the ▼ list or Alt+↓, and turning it off; Remove Duplicates), 7 task kinds in `tasks4.ts` on a longer sales log (30-36 records, 4 branches misspelled "Cty", 3 rows entered twice). Checks look at the CONTENT (sorting and removing duplicates move rows), every non-filter task starts with the filter off; tested in lesson order and 300 random quizzes (6 of the 7 kinds). Lesson content has `tools: true`.
  - Data tools: `sheet.ts` `runCommand(sheet, SheetCommand)` (sort, toggleFilter, setFilter, find, replaceAll, removeDuplicates, open = a dialog opened; Ctrl+Z undoes them), `filterOn` / `filter` state, `isHidden` (arrows skip hidden rows), `columnValues`, `countMatches`, `countDuplicates`. The view (`ExcelSheetView` with `tools`) shows `DataTools.tsx`: a "Data" toolbar (Sort A to Z, Sort Z to A, Filter, Find, Replace, Remove Duplicates; English like Excel), the Find / Replace / Remove Duplicates dialogs and the filter list (buttons with EnTl), ▼ in the header cells, hidden rows not drawn, blue row numbers while filtered. Ctrl+F / Ctrl+H open Excel's dialogs, not the browser's. Each tool use counts as one key (never as "mouse"); `SolutionStep` can be `{ command }`. `taskKey` closes the dialogs when a new task starts.
  - Lessons are registered in `lessons.ts` (`LESSONS`: level, title, `content` = topics, makeSet, makeQuiz, columnWidths, labels; `content: null` = parating pa). Order: 1 Navigation, 2 Pag-encode ng data, 3 Formatting, 4 Sort/filter/find & replace, 5 Formulas (next; needs HyperFormula, ask first). To add a lesson: a `tasksN.ts` (tasks with hint + solution, tested like tasks2), a `lessonN.ts` (topics), then its entry in `LESSONS`.
  - Sidebar "Matuto > Excel", Home "Matuto" section (lessons passed of the ready ones), Sensei tips.
  - **What to teach** (owner approved): Antas 1 (everyone): the sheet and cells, navigation/selection (Aralin 1), typing and editing (Enter/Tab, F2, Ctrl+D, autofill), formatting (dates mm/dd/yyyy, numbers, leading zeros, column width, freeze panes), organizing data (sort, filter, find & replace, remove duplicates). Antas 2 (often asked): first formulas (SUM, AVERAGE, COUNT, MIN, MAX, cell references), IF/COUNTIF/SUMIF, text cleanup (TRIM, PROPER/UPPER, LEFT/RIGHT, join/split names), VLOOKUP/XLOOKUP. Antas 3 (bonus): pivot table, conditional formatting, data validation. A "Kodigo" page (all shortcuts/formulas learned so far) is planned.
  - NEXT rounds, in order: formatting (dates, numbers, leading zeros) → sort/filter/find & replace/remove duplicates → formulas: SUM/COUNT/IF/COUNTIF/SUMIF → text cleanup (TRIM, PROPER, split/combine names) → VLOOKUP/XLOOKUP → pivot tables (bonus). Ask before adding HyperFormula (`licenseKey: 'gpl-v3'`). Later: other Office tracks (Word first), owner's plan.

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
