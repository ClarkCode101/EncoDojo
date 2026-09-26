# EncoDojo — Encoder / Data Entry Practice Simulator

## Project Overview
**EncoDojo** (repo: `github.com/ClarkCode101/EncoDojo`, package name `encodojo`) is a browser-based practice app for skills tested and used in **Encoder / Data Entry jobs in the Philippines**: typing speed & accuracy, numpad (10-key) speed, alphanumeric copy tests, source-document encoding, QC/error-spotting, and basic-to-intermediate Excel.

The owner is learning while building. When you finish a task, **explain what you did in simple terms (Taglish is fine)**, and point out anything they should test manually.

## Product Direction: Training + Assessment (decided 2026-09-26)
- **Training (the "dojo")**: every feature (Typing, Numpad, and later Copy Test, Encoding, QC, Excel) is a training ground. User picks settings, can "Finish now", can retry. Results are saved by default but optional ("Don't save this result" / "Save it again"). A run ended with "Finish now" starts **unsaved** ("Save anyway") because short runs inflate WPM/KPH.
- **Assessment** (`features/assessment`): runs every feature in a fixed order under exam rules — fixed duration/difficulty, no live stats, no "Finish now", no retry — then shows a **report card**: per-target ✅/❌, overall "Job-ready" verdict, rule-based comments (no AI), change vs previous assessment, and mistake lists. Always saved as ONE session of type `'assessment'`.
- Each drill has a **Runner** component (`TypingRunner`, `NumpadRunner`) that runs one attempt and returns a Session without saving; training pages and the Assessment both use it. **When adding a new feature, build its Runner first, then add it as a new part of the Assessment** (`evaluate.ts` checks, `comments.ts` rules, `AssessmentReport.tsx` section).
- Job-ready targets live in `lib/targets.ts` (typing 40 Net WPM / 95%; numpad 8,000 KPH / 95% — numpad target is an estimate, verify with real job posts).

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
    settings/
    (later) copy-test/, encoding/, qc/, excel/, review/, reports/
  lib/
    storage.ts    # localStorage read/write, schema versioning, export/import
    scoring.ts    # WPM, accuracy, KPH calculations
    random.ts     # seeded random helpers for reproducible drills
  data/
    passages/     # typing passages (original text only)
    ph/           # fake Filipino names, streets, barangays, amounts
  components/     # shared UI (Button, Card, Timer, StatBadge)
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
Single key: `encodojo:v1` (the key name never changes; the schema version is `data.version`, currently **2**)
```ts
type AppData = {
  version: 2;
  profile: { displayName: string; createdAt: string };
  settings: {
    typingLevel: 1 | 2 | 3;                  // chosen on the Typing Test page
    numpadDifficulty: 1 | 2 | 3 | 4 | 5 | 6; // chosen on the Numpad Drill page
    sound: boolean;
    showLiveStats: boolean;
  };
  // v1 had a single `difficulty` (1-6) in Settings; migrate() upgrades it:
  // typingLevel = ceil(difficulty / 2), numpadDifficulty = difficulty.
  sessions: Session[];
};

type Session = {
  id: string;
  type: 'typing' | 'numpad' | 'assessment';  // extend in later phases (SESSION_TYPES)
  startedAt: string;                // ISO
  durationSec: number;
  metrics: Record<string, number>;  // e.g. { grossWpm, netWpm, accuracy } or { kph, entryAccuracy }
  mistakes: { expected: string; typed: string; index: number; section?: 'typing' | 'numpad' }[];
};
```
- Assessment sessions store flattened metrics with a part prefix (`typingNetWpm`, `numpadKph`, ... plus `targetsMet`, `targetsTotal`, `jobReady` 0/1) and tag each mistake with `section`. The report is always recomputed from the saved session.
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
- Passages: ~75% generated from fake PH data (`features/typing/generatePassage.ts`, `data/ph/`), ~25% hand-written (`data/passages/`). Generated invoices/payroll must add up.
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
- Live stats: KPH, entry accuracy, entries done.
- Results: KPH, entry accuracy, job-ready check, list of wrong entries.

### 4. Dashboard (`features/dashboard`)
- Cards: best Net WPM, latest accuracy, best KPH, total sessions, current streak (days with at least one session).
- Quick-launch buttons for Typing Test and Numpad Drill.
- Recent sessions list (last 10).

### 5. Settings (`features/settings`)
- Display name, live stats toggle, sound. (Difficulty was moved to each training page at the owner's request: Typing = Level picker, Numpad = Difficulty 1–6 picker.)
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

**Assessment v1 — DONE (2026-09-26):** Typing (1 min, mixed passage) + Numpad (1 min, difficulty 6) with report card. Every later feature must also be added as a new Assessment part (see "Product Direction").

**Phase 2:** Alphanumeric Copy Test (timed list of fake names/addresses/IDs), Source Document Encoding (rendered fake invoices, receipts, application forms, delivery receipts, timesheets → form fields, per-field QC), Mistake Review screen with "Retry mistakes only".

**Phase 3:** Excel Drills with react-data-grid + HyperFormula and auto-checker, in this order: shortcuts/navigation → formatting (dates, numbers, leading zeros) → sort/filter/find & replace/remove duplicates → SUM/COUNT/IF/COUNTIF/SUMIF → text cleanup (TRIM, PROPER, split/combine names) → VLOOKUP/XLOOKUP → pivot tables (bonus). Also Spot-the-Difference / QC drill.

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
