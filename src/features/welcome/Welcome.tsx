/**
 * The welcome screen, "itali ang belt" (owner's request 2026-10-01: a big logo in the middle,
 * a short introduction, "get started", and an effect before the app). It shows EVERY time the
 * app is opened (owner's choice), once per browser tab (sessionStorage), never again while
 * moving between pages.
 *
 * - The logo builds itself: the "E" key pops in, the gold belt slides across, the knot drops.
 * - A short introduction appears line by line.
 * - First time (no language picked yet): Taglish / English (switches the screen right away) and
 *   the name (optional). Returning users: "Maligayang pagbabalik, <name>!" and a small language switch.
 * - "Simulan": the logo grows until it fills the screen and fades into the app (Home, or the
 *   page that was opened). "Laktawan" and Esc skip.
 * - "Bawasan ang galaw" (or the computer's reduce-motion setting): no animations, it just closes.
 * The CSS animations are in index.css (`wl-*`). Sensei stays quiet meanwhile.
 */
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { DocumentIcon, ExcelIcon, KeyboardIcon } from '../../components/icons';
import { langOf, translator, type Lang } from '../../lib/i18n';
import { updateAppData, updateSettings, useAppData } from '../../lib/useAppData';
import { useSenseiQuiet } from '../sensei/quiet';
import { markWelcomeSeen, shouldShowWelcome } from './welcomeSeen';

/** How long the "Simulan" effect runs before the app shows (index.css .wl-leaving). */
const LEAVE_MS = 750;

/** The logo (same drawing as <Logo />), in parts that animate one after another. */
function AnimatedLogo() {
  return (
    <svg
      viewBox="0 0 48 48"
      aria-hidden="true"
      className="wl-logo h-28 w-28 overflow-visible sm:h-36 sm:w-36 [@media(min-height:900px)]:sm:h-44 [@media(min-height:900px)]:sm:w-44"
    >
      <g className="wl-key">
        <rect x="4" y="5" width="40" height="38" rx="9" fill="#B9B5E6" stroke="#231F55" strokeWidth="1.5" />
        <rect x="8" y="7" width="32" height="29" rx="6" fill="#FBF8F1" stroke="#231F55" strokeWidth="1" />
        <g fill="#2E2A6B">
          <rect x="16" y="11" width="5" height="18" rx="1" />
          <rect x="16" y="11" width="16" height="4.5" rx="1" />
          <rect x="16" y="17.75" width="12.5" height="4.5" rx="1" />
          <rect x="16" y="24.5" width="16" height="4.5" rx="1" />
        </g>
      </g>
      <g fill="#F5B301" stroke="#231F55" strokeWidth="1.5" strokeLinejoin="round">
        <rect className="wl-band" x="1.5" y="32" width="45" height="6.5" rx="1.5" />
        <g className="wl-ends">
          <path d="M21 39 L16.5 46.5 h5 L24 41.5 Z" />
          <path d="M27 39 L31.5 46.5 h-5 L24 41.5 Z" />
        </g>
        <rect className="wl-knot" x="19" y="29.5" width="10" height="11.5" rx="2.5" />
      </g>
    </svg>
  );
}

const reducedMotion = (setting: boolean | undefined) =>
  setting === true ||
  (typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);

function WelcomeScreen({ onDone }: { onDone: () => void }) {
  const { settings, profile } = useAppData();
  const lang = langOf(settings);
  const t = translator(lang);
  // Decided once: picking a language on this screen must not hide the name field.
  const [firstTime] = useState(() => settings.language === undefined && !settings.englishOnly);
  const [name, setName] = useState(profile.displayName);
  const [leaving, setLeaving] = useState(false);
  const startFocused = useRef(false);
  useSenseiQuiet(true);

  // The app behind does not scroll while the welcome is up.
  useEffect(() => {
    const before = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = before;
    };
  }, []);

  function leave(save: boolean) {
    if (leaving) return;
    if (save) {
      // The language shown is the one chosen (Taglish when nothing was clicked), so Home won't ask again.
      if (settings.language === undefined && !settings.englishOnly) updateSettings({ language: lang });
      const clean = name.trim().slice(0, 40);
      if (clean !== profile.displayName)
        updateAppData((d) => ({ ...d, profile: { ...d.profile, displayName: clean } }));
    }
    if (reducedMotion(settings.reduceMotion)) {
      onDone();
      return;
    }
    setLeaving(true);
    window.setTimeout(onDone, LEAVE_MS);
  }

  // Esc = skip, like "Laktawan".
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') leave(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const pick = (l: Lang) => updateSettings({ language: l });
  const langButton = (l: Lang, label: string, big: boolean) => (
    <button
      key={l}
      type="button"
      aria-pressed={lang === l}
      onClick={() => pick(l)}
      className={
        (big ? 'min-h-[3rem] px-6 text-lg ' : 'px-2 py-0.5 text-sm ') +
        'rounded-lg border-2 font-semibold transition-colors focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-belt-300 ' +
        (lang === l
          ? 'border-belt-400 bg-belt-400 text-brand-950'
          : 'border-brand-400 text-brand-100 hover:border-belt-300 hover:text-white')
      }
    >
      {label}
    </button>
  );

  const points = [
    {
      icon: <KeyboardIcon className="h-6 w-6" />,
      text: t('Bilis sa typing at numpad', 'Speed on the keyboard and numpad'),
    },
    {
      icon: <DocumentIcon className="h-6 w-6" />,
      text: t('Pag-encode ng record at dokumento', 'Encoding records and documents'),
    },
    {
      icon: <ExcelIcon className="h-6 w-6" />,
      text: t('Excel, isang aralin sa isang pagkakataon', 'Excel, one lesson at a time'),
    },
  ];

  function submit(e: FormEvent) {
    e.preventDefault();
    leave(true);
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t('Maligayang pagdating sa EncoDojo', 'Welcome to EncoDojo')}
      className={`wl-root theme-fixed fixed inset-0 z-[60] overflow-y-auto bg-brand-950 text-white ${leaving ? 'wl-leaving' : ''}`}
    >
      {/* The dojo cloth: faint gold stripes and a warm glow behind the logo. */}
      <div aria-hidden="true" className="wl-cloth pointer-events-none fixed inset-0" />

      <button
        type="button"
        onClick={() => leave(false)}
        className="wl-fade absolute right-4 top-4 z-10 rounded px-2 py-1 text-sm text-brand-200 underline decoration-dotted underline-offset-4 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-belt-300"
      >
        {t('Laktawan', 'Skip')}
      </button>

      {/*
        First time on a wide screen: two columns (the logo and the introduction on the left, the
        language, name and "Simulan" on the right), so it fits a laptop screen without scrolling.
      */}
      <form
        onSubmit={submit}
        className={
          'relative mx-auto flex min-h-full flex-col items-center justify-center px-6 py-8 text-center [@media(min-height:900px)]:py-12 ' +
          (firstTime ? 'max-w-xl lg:max-w-5xl lg:flex-row lg:gap-20' : 'max-w-xl')
        }
      >
        <div className="flex flex-col items-center">
          <div className="wl-logo-wrap relative">
            <div aria-hidden="true" className="wl-glow absolute inset-0 -z-10 rounded-full" />
            <AnimatedLogo />
          </div>

          <h1
            className="wl-rise wl-out mt-4 font-display text-5xl font-bold sm:text-6xl [@media(min-height:900px)]:mt-6"
            style={{ animationDelay: '1.25s' }}
          >
            EncoDojo
          </h1>
          <p className="wl-rise wl-out mt-2 text-xl text-brand-100" style={{ animationDelay: '1.45s' }}>
            {firstTime
              ? t('Ang dojo ng mga encoder.', 'The dojo for encoders.')
              : profile.displayName
                ? t(`Maligayang pagbabalik, ${profile.displayName}!`, `Welcome back, ${profile.displayName}!`)
                : t('Maligayang pagbabalik sa dojo!', 'Welcome back to the dojo!')}
          </p>

          <ul className="wl-out mt-5 space-y-2 text-left [@media(min-height:900px)]:mt-7 [@media(min-height:900px)]:space-y-2.5">
            {points.map((p, i) => (
              <li
                key={i}
                className="wl-rise flex items-center gap-3 text-lg text-brand-50"
                style={{ animationDelay: `${1.7 + i * 0.18}s` }}
              >
                <span className="text-belt-300">{p.icon}</span>
                {p.text}
              </li>
            ))}
          </ul>
        </div>

        <div className={'wl-out flex w-full flex-col items-center ' + (firstTime ? 'lg:w-80' : '')}>
          {firstTime ? (
            <div
              className="wl-rise mt-6 w-full space-y-4 [@media(min-height:900px)]:mt-8 [@media(min-height:900px)]:space-y-5"
              style={{ animationDelay: '2.3s' }}
            >
              <fieldset>
                <legend className="mx-auto mb-2 text-brand-100">Wika / Language</legend>
                <div className="flex justify-center gap-3">
                  {langButton('tl', 'Taglish', true)}
                  {langButton('en', 'English', true)}
                </div>
              </fieldset>
              <label className="block">
                <span className="mb-2 block text-brand-100">
                  {t('Anong pangalan mo? (puwedeng laktawan)', "What's your name? (optional)")}
                </span>
                <input
                  value={name}
                  maxLength={40}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t('Hal. Juan', 'e.g. Juan')}
                  className="mx-auto block w-full max-w-xs rounded-lg border-2 border-brand-400 bg-brand-900 px-4 py-2.5 text-center text-lg text-white placeholder:text-brand-300 focus:border-belt-400 focus:outline-none focus:ring-4 focus:ring-belt-400/30"
                />
              </label>
            </div>
          ) : (
            <div
              className="wl-rise mt-6 flex items-center gap-2 text-sm text-brand-200"
              style={{ animationDelay: '2.3s' }}
            >
              <span>Wika / Language:</span>
              {langButton('tl', 'Taglish', false)}
              {langButton('en', 'English', false)}
            </div>
          )}

          <button
            ref={(el) => {
              if (el && !startFocused.current) {
                startFocused.current = true;
                el.focus({ preventScroll: true });
              }
            }}
            type="submit"
            className="wl-rise wl-start mt-6 inline-flex min-h-[3.5rem] items-center gap-3 rounded-xl bg-belt-400 px-10 text-xl font-bold text-brand-950 shadow-lg transition-transform hover:scale-105 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-4 focus-visible:outline-belt-300"
            style={{ animationDelay: '2.5s' }}
          >
            {t('Simulan', 'Get started')} <span aria-hidden="true">→</span>
          </button>

          <p className="wl-rise mt-4 max-w-sm text-sm text-brand-300" style={{ animationDelay: '2.7s' }}>
            {t(
              'Libre at walang account. Sa browser na ito naka-save ang progress mo.',
              'Free, no account. Your progress is saved in this browser.',
            )}
          </p>
        </div>
      </form>
    </div>
  );
}

/** Shows the welcome screen once per opening of the app (see welcomeSeen.ts). */
export default function Welcome() {
  const [show, setShow] = useState(shouldShowWelcome);
  if (!show) return null;
  return (
    <WelcomeScreen
      onDone={() => {
        markWelcomeSeen();
        setShow(false);
      }}
    />
  );
}
