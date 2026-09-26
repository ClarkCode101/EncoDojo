# EncoDojo

**Live app: https://encodojo.vercel.app**

A free, browser-only practice app for **Encoder / Data Entry** job skills in the Philippines:
typing speed & accuracy and numpad (10-key) speed, with more drills planned.

- No login, no server, no ads, no cost.
- Made for everyone, including older and non-techy users: simple **Taglish** UI, big text and buttons
  (plus a "Mas malaking text" option), numbered steps, and an "Ano ito?" explanation for every number.
- Your progress is saved in your browser (localStorage). Use **Settings → I-download ang backup** to back it up.
- All names, addresses, and numbers in the drills are fake.

## Features

EncoDojo has two modes:

- **Practice (training)** — practice any skill as often as you like; saving results is optional.
- **Assessment** — every skill in a row under exam rules, then a report card that says whether you're job-ready, with tips.

| Screen | What it does |
| --- | --- |
| Home | 4 steps to start (Typing → Numpad → Copy Test → Assessment), your best scores, daily streak, recent sessions (delete one or clear all), coming-soon features |
| Assessment | Typing (1 min) + Numpad (1 min) + Copy Test (2 min), no live stats or early finish; report card with a PASADO / HINDI PA stamp, job-ready targets, KPH levels, tips, change since last time, and history |
| Typing Practice | 30 sec or 1 min, fresh plain office-text passages every time, Gross/Net WPM, accuracy, keystroke accuracy, job-ready check, comparison with your last test and personal best, mistakes list |
| Numpad Practice | 30 sec or 1 min, **Halo-halo** (same numbers as the Assessment) or **Pang-baguhan** (short numbers), KPH, entry accuracy, job-ready check, KPH levels (8,000 / 10,000 / 12,000) |
| Copy Test | 1 or 2 min: copy fake records (name, birth date, address, contact no., ID) into a form exactly, in a **Form** (like an alphanumeric data entry test) or a **Spreadsheet** (like Excel: one row per record, Tab between cells, Enter for the next row); field accuracy, net KPH, targets, and wrong fields with the exact wrong characters highlighted |
| Settings | Name, larger text, sound, backup / restore (JSON), delete everything |

### How scores are calculated

- **Gross WPM** = (typed characters ÷ 5) ÷ minutes
- **Net WPM** = Gross WPM − (uncorrected errors ÷ minutes), never below 0
- **Accuracy** = correct characters ÷ (correct characters + mistakes) × 100
- **Keystroke accuracy** = keys typed without a mistake ÷ all keys typed × 100 (mistakes fixed with Backspace still count)
- **Mistakes** = wrong keys + extra keys (e.g. a double space) + skipped letters. Your typing is lined up with
  the passage like a "diff", so one slip counts as one mistake and doesn't make the rest of the line wrong.
- **KPH** = correct keystrokes ÷ hours (digits, decimal point, and Enter; commas are optional and not counted)
- **Entry accuracy** = fully correct entries ÷ total entries × 100

The code for these is in [`src/lib/scoring.ts`](src/lib/scoring.ts).

## Run it locally

You need [Node.js](https://nodejs.org/) 20 or newer.

```bash
npm install
npm run dev      # open the URL it prints, usually http://localhost:5173
```

Other commands:

```bash
npm run test     # unit tests (Vitest)
npm run lint     # ESLint
npm run build    # production build into dist/
npm run preview  # serve the built dist/ folder locally
```

## Deploy for free

The app is a static site, so it needs no environment variables or secrets.

**Vercel (Hobby plan)**
1. Push this repo to GitHub.
2. On vercel.com, choose *Add New → Project* and import the repo.
3. Framework preset: **Vite**. Build command `npm run build`, output directory `dist`.
4. Deploy. `vercel.json` already makes deep links like `/typing` work.

**Cloudflare Pages**
1. Push this repo to GitHub.
2. In the Cloudflare dashboard, go to *Workers & Pages → Create → Pages → Connect to Git*.
3. Build command `npm run build`, output directory `dist`.
4. Deploy. `public/_redirects` already makes deep links work.

## Project structure

```
src/
  app/          router and layout (sidebar)
  components/   shared UI (Button, Card, StatBadge, …)
  data/         original typing passages (fake data only)
  features/     one folder per screen: dashboard, typing, numpad, settings
  lib/          scoring, storage, random helpers, timer
```

## License

[GPL-3.0](LICENSE). This project will use HyperFormula (GPL-3.0 license key) in a later phase,
so it must stay open source.
