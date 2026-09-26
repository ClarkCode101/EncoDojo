# Encoder Practice

A free, browser-only practice app for **Encoder / Data Entry** job skills in the Philippines:
typing speed & accuracy and numpad (10-key) speed, with more drills planned.

- No login, no server, no ads, no cost.
- Your progress is saved in your browser (localStorage). Use **Settings → Export progress** to back it up.
- All names, addresses, and numbers in the drills are fake.

## Features (Phase 1)

| Screen | What it does |
| --- | --- |
| Dashboard | Best Net WPM, latest accuracy, best KPH, total sessions, daily streak, recent sessions |
| Typing Test | 1 / 3 / 5 minute tests, live highlighting, Gross/Net WPM, accuracy, mistakes list |
| Numpad Drill | 2 / 5 minute drills, integers → amounts → reference numbers, KPH and entry accuracy |
| Settings | Name, difficulty 1–6, live stats, sound, export/import JSON, reset all data |

### How scores are calculated

- **Gross WPM** = (typed characters ÷ 5) ÷ minutes
- **Net WPM** = Gross WPM − (uncorrected errors ÷ minutes), never below 0
- **Accuracy** = correct characters ÷ typed characters × 100
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
