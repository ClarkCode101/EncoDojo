/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        // "Dojo notebook" look (owner's choice, 2026-09-27): readable body + document-like headings.
        sans: ['"Atkinson Hyperlegible"', 'system-ui', '"Segoe UI"', 'Roboto', 'Arial', 'sans-serif'],
        // "lnum" = lining numbers: Zilla Slab's default numbers are "old-style" (0 looks like a letter o).
        display: [['"Zilla Slab"', 'Georgia', '"Times New Roman"', 'serif'], { fontFeatureSettings: '"lnum"' }],
        mono: ['ui-monospace', 'SFMono-Regular', 'Consolas', 'monospace'],
      },
      /*
       * EncoDojo brand colors ("Dojo Indigo + Belt Gold"). Change them here and
       * the whole app follows.
       * - brand: deep indigo for buttons, links, and the sidebar (main color: 800).
       * - belt:  gold accent for the logo, badges, and highlights. Use it as a
       *          BACKGROUND with dark text — gold text on white is hard to read.
       * - paper: the page background, a light cool grey (option B "Maliwanag", owner's
       *          choice 2026-09-30): white cards and the white sidebar stand out on it.
       * - stone: the neutrals (text, rules, borders). Tailwind's warm stone is replaced
       *          by a cool grey with a hint of the brand indigo, so the neutrals match
       *          the brand; every stone-* class in the app follows. 500+ passes 4.5:1 on
       *          paper and on white (text); 300/200 are for rules and borders.
       * Red (mistakes), green (correct), and amber (warnings) keep their meaning,
       * so they are NOT used as brand colors.
       */
      colors: {
        brand: {
          50: '#F2F1FA',
          100: '#E4E2F5',
          200: '#C9C5EB',
          300: '#A59FDB',
          400: '#7F77C8',
          500: '#5E55B1',
          600: '#4A4299',
          700: '#3B3483',
          800: '#2E2A6B',
          900: '#231F55',
          950: '#16143A',
        },
        belt: {
          50: '#FFFAEB',
          100: '#FFF1C2',
          300: '#FFD45C',
          400: '#F5B301',
          500: '#D99A00',
          600: '#A87700',
        },
        paper: '#F6F6F8',
        stone: {
          50: '#F8F8FA',
          100: '#F0F0F4',
          200: '#E4E3EA',
          300: '#D1CFDA',
          400: '#A4A1B2',
          500: '#6E6B80',
          600: '#57546A',
          700: '#423F52',
          800: '#2D2B3A',
          900: '#1E1D27',
          950: '#121118',
        },
      },
      boxShadow: {
        /** Makes a card look like a sheet of paper on a desk. */
        paper: '0 1px 2px rgba(22, 20, 58, 0.06), 0 12px 24px -12px rgba(22, 20, 58, 0.35)',
      },
      keyframes: {
        /** The "PASADO" stamp landing on the report. */
        stamp: {
          '0%': { opacity: '0', transform: 'rotate(-8deg) scale(1.6)' },
          '100%': { opacity: '1', transform: 'rotate(-8deg) scale(1)' },
        },
        /** Sensei's speech bubble popping up. */
        'sensei-pop': {
          '0%': { opacity: '0', transform: 'translateY(8px) scale(0.95)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
      },
      animation: {
        stamp: 'stamp 0.35s ease-out both',
        'sensei-pop': 'sensei-pop 0.2s ease-out both',
      },
    },
  },
  plugins: [
    // `large-text:` = only when Settings -> "Mas malaking text" is on (html.large-text).
    ({ addVariant }) => addVariant('large-text', 'html.large-text &'),
  ],
};
