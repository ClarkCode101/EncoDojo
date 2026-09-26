import { Suspense, useEffect, type ReactNode } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import {
  AssessmentIcon,
  CopyIcon,
  DocumentIcon,
  HomeIcon,
  KeyboardIcon,
  Logo,
  NumpadIcon,
  SettingsIcon,
} from '../components/icons';
import { updateSettings, useAppData } from '../lib/useAppData';

type NavItem = { to: string; label: string; icon: ReactNode };
type NavGroup = { heading?: string; items: NavItem[] };

const groups: NavGroup[] = [
  {
    items: [
      { to: '/', label: 'Home', icon: <HomeIcon /> },
      { to: '/assessment', label: 'Assessment', icon: <AssessmentIcon /> },
    ],
  },
  {
    heading: 'Practice',
    items: [
      { to: '/typing', label: 'Typing Practice', icon: <KeyboardIcon /> },
      { to: '/numpad', label: 'Numpad Practice', icon: <NumpadIcon /> },
      { to: '/copy', label: 'Copy Test', icon: <CopyIcon /> },
      { to: '/encoding', label: 'Document Encoding', icon: <DocumentIcon /> },
    ],
  },
  { items: [{ to: '/settings', label: 'Settings', icon: <SettingsIcon /> }] },
];

function navClass({ isActive }: { isActive: boolean }) {
  return (
    'relative flex items-center gap-3 rounded-lg px-3 py-2 text-base font-semibold transition-colors ' +
    'focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-brand-300 ' +
    (isActive
      ? // The page you're on: white pill + a gold "belt" mark at the sidebar's edge (brand accent).
        'bg-white text-brand-900 shadow md:before:absolute md:before:-left-3 md:before:inset-y-1 md:before:w-1.5 md:before:rounded-r-full md:before:bg-belt-400'
      : 'text-brand-50 hover:bg-brand-800')
  );
}

/**
 * "Mas malaking text" on every page (same setting as in Settings), so people
 * who need bigger text don't have to look for it.
 */
function LargeTextToggle({ on }: { on: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => updateSettings({ largeText: !on })}
      className={
        'flex w-full items-center justify-between gap-3 rounded-lg border px-3 py-2.5 text-left text-base font-semibold transition-colors ' +
        'focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-brand-300 ' +
        (on ? 'border-belt-400 bg-brand-800 text-white' : 'border-brand-700 text-brand-50 hover:bg-brand-800')
      }
    >
      <span>Mas malaking text</span>
      {/* The switch: gold when on. */}
      <span
        aria-hidden="true"
        className={'relative h-6 w-11 shrink-0 rounded-full transition-colors ' + (on ? 'bg-belt-400' : 'bg-brand-600')}
      >
        <span
          className={
            'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-[left] motion-reduce:transition-none ' +
            (on ? 'left-[1.375rem]' : 'left-0.5')
          }
        />
      </span>
    </button>
  );
}

export default function Layout() {
  const { largeText } = useAppData().settings;

  // "Mas malaking text" in Settings makes the whole app bigger (see index.css).
  useEffect(() => {
    document.documentElement.classList.toggle('large-text', largeText);
  }, [largeText]);

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-10 focus:rounded focus:bg-white focus:px-3 focus:py-2"
      >
        Lumaktaw sa nilalaman
      </a>

      <aside className="bg-brand-900 text-white md:sticky md:top-0 md:flex md:h-screen md:w-64 md:shrink-0 md:flex-col md:overflow-y-auto">
        <div className="flex items-center gap-3 px-5 py-5">
          <Logo className="h-12 w-12 shrink-0" />
          <div>
            <div className="text-xl font-bold leading-tight">EncoDojo</div>
            <div className="text-sm leading-tight text-brand-200">Encoder at Data Entry practice</div>
          </div>
        </div>

        <nav aria-label="Main" className="px-3 pb-4">
          <div className="flex flex-wrap gap-1 md:block">
            {groups.map((group, i) => (
              <div key={i} className="md:mb-4">
                {group.heading && (
                  <div className="hidden px-3 pb-1 text-sm font-semibold text-brand-300 md:block">{group.heading}</div>
                )}
                <ul className="flex flex-wrap gap-1 md:block md:space-y-1">
                  {group.items.map((item) => (
                    <li key={item.to}>
                      <NavLink to={item.to} end={item.to === '/'} className={navClass}>
                        {item.icon}
                        {item.label}
                      </NavLink>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </nav>

        {/* Bottom of the sidebar on desktop; under the links on phones. */}
        <div className="px-3 pb-4 md:mt-auto">
          <LargeTextToggle on={largeText} />
        </div>
      </aside>

      <main id="main" className="min-w-0 flex-1 px-4 py-6 md:px-10">
        <div className="mx-auto max-w-5xl">
          <Suspense fallback={<p className="text-lg text-stone-700">Naglo-load…</p>}>
            <Outlet />
          </Suspense>
        </div>
      </main>
    </div>
  );
}
