/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        mono: ['ui-monospace', 'SFMono-Regular', 'Consolas', 'monospace'],
      },
      /*
       * EncoDojo brand colors ("Dojo Indigo + Belt Gold"). Change them here and
       * the whole app follows.
       * - brand: deep indigo for buttons, links, and the sidebar (main color: 800).
       * - belt:  gold accent for the logo, badges, and highlights. Use it as a
       *          BACKGROUND with dark text — gold text on white is hard to read.
       * - paper: warm off-white page background (softer on the eyes than pure white).
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
        paper: '#FBF8F1',
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
      },
      animation: {
        stamp: 'stamp 0.35s ease-out both',
      },
    },
  },
  plugins: [
    // `large-text:` = only when Settings -> "Mas malaking text" is on (html.large-text).
    ({ addVariant }) => addVariant('large-text', 'html.large-text &'),
  ],
};
