import { Suspense, useEffect, type ReactNode } from 'react';
import BeltCard from '../components/BeltCard';
import { NavLink, Outlet } from 'react-router-dom';
import {
  AssessmentIcon,
  CopyIcon,
  DocumentIcon,
  ExcelIcon,
  QcIcon,
  HomeIcon,
  KeyboardIcon,
  Logo,
  NumpadIcon,
  SettingsIcon,
  SidebarToggleIcon,
} from '../components/icons';
import { useIsFocusMode } from '../lib/focusMode';
import { updateSettings, useAppData } from '../lib/useAppData';
import NextFocusCard from '../features/dashboard/NextFocusCard';
import { useIsSenseiQuiet } from '../features/sensei/quiet';
import Sensei from '../features/sensei/Sensei';

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
      { to: '/qc', label: 'QC Check', icon: <QcIcon /> },
      { to: '/excel', label: 'Excel Practice', icon: <ExcelIcon /> },
    ],
  },
  { items: [{ to: '/settings', label: 'Settings', icon: <SettingsIcon /> }] },
];

/** `collapsed` (desktop only): icon-only links, centered. */
const navClass =
  (collapsed: boolean) =>
  ({ isActive }: { isActive: boolean }) => {
    return (
      // Short screens (<900px tall): a little less space, so the sidebar never needs its own scrollbar.
      'relative flex items-center gap-3 rounded-lg px-3 py-2 text-base font-semibold transition-colors [@media(min-height:721px)_and_(max-height:900px)]:py-1.5 [@media(max-height:720px)]:py-1 ' +
      (collapsed ? 'md:justify-center md:px-0 ' : '') +
      'focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-brand-300 ' +
      (isActive
        ? // The page you're on: white pill + a gold "belt" mark at the sidebar's edge (brand accent).
          'bg-white text-brand-900 shadow md:before:absolute md:before:-left-3 md:before:inset-y-1 md:before:w-1.5 md:before:rounded-r-full md:before:bg-belt-400'
        : 'text-brand-50 hover:bg-brand-800')
    );
  };

export default function Layout() {
  const { largeText, sidebarCollapsed, sensei, reduceMotion, bigSource } = useAppData().settings;
  // "Exam mode" (a running Assessment): no sidebar, the exam gets the whole screen.
  const focus = useIsFocusMode();
  // Room at the bottom of scrolling pages so Sensei never covers the last buttons.
  const senseiRoom = !useIsSenseiQuiet() && sensei !== 'off' ? (sensei === 'small' ? 'pb-20' : 'pb-32') : '';
  // The sidebar can be collapsed to icons only (desktop), for more room. Remembered in the settings.
  const collapsed = sidebarCollapsed === true;

  // "Mas malaking text" in Settings makes the whole app bigger (see index.css).
  useEffect(() => {
    document.documentElement.classList.toggle('large-text', largeText);
  }, [largeText]);
  // Settings -> "Bawasan ang galaw" and "Mas malaking babasahin" (see index.css).
  useEffect(() => {
    document.documentElement.classList.toggle('reduce-motion', reduceMotion === true);
    document.documentElement.classList.toggle('big-source', bigSource === true);
  }, [reduceMotion, bigSource]);

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-10 focus:rounded focus:bg-white focus:px-3 focus:py-2"
      >
        Lumaktaw sa nilalaman
      </a>

      {!focus && (
        <aside
          className={
            // No width animation on purpose (owner's request): the labels and cards switch at once anyway,
            // so an animated width only showed squeezed, half-drawn states. An instant switch looks cleaner.
            'bg-brand-900 text-white md:sticky md:top-0 md:flex md:h-screen md:shrink-0 md:flex-col md:overflow-y-auto md:overflow-x-hidden ' +
            (collapsed ? 'md:w-20' : 'md:w-64')
          }
        >
          <div
            className={
              'flex items-center gap-3 px-5 py-5 [@media(min-height:721px)_and_(max-height:900px)]:py-3 [@media(max-height:720px)]:py-1.5 ' +
              (collapsed ? 'md:flex-col md:px-0' : '')
            }
          >
            <Logo className="h-12 w-12 shrink-0" />
            <div className={'font-display text-2xl font-bold leading-tight ' + (collapsed ? 'md:sr-only' : '')}>EncoDojo</div>
            <button
              type="button"
              onClick={() => updateSettings({ sidebarCollapsed: !collapsed })}
              aria-controls="main-nav"
              aria-expanded={!collapsed}
              aria-label={collapsed ? 'Ipakita ang buong menu' : 'Itago ang menu (icons lang)'}
              title={collapsed ? 'Ipakita ang buong menu' : 'Itago ang menu'}
              className={
                'hidden h-10 w-10 shrink-0 items-center justify-center rounded-lg text-brand-100 transition-colors hover:bg-brand-800 hover:text-white md:inline-flex ' +
                'focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-brand-300 ' +
                (collapsed ? '' : 'ml-auto')
              }
            >
              <SidebarToggleIcon open={!collapsed} />
            </button>
          </div>

          <nav id="main-nav" aria-label="Main" className="px-3 pb-4">
            <div className="flex flex-wrap gap-1 md:block">
              {groups.map((group, i) => (
                <div key={i} className="md:mb-4 md:[@media(min-height:721px)_and_(max-height:900px)]:mb-2 md:[@media(max-height:720px)]:mb-1">
                  {group.heading &&
                    (collapsed ? (
                      // Collapsed: a thin line instead of the heading.
                      <div aria-hidden="true" className="mx-2 mb-2 hidden border-t border-brand-700 md:block" />
                    ) : (
                      <div className="hidden px-3 pb-1 text-sm font-semibold text-brand-300 md:block">
                        {group.heading}
                      </div>
                    ))}
                  <ul className="flex flex-wrap gap-1 md:block md:space-y-1">
                    {group.items.map((item) => (
                      <li key={item.to}>
                        <NavLink
                          to={item.to}
                          end={item.to === '/'}
                          className={navClass(collapsed)}
                          // Collapsed: the name shows when the mouse is on the icon (and is read by screen readers).
                          title={collapsed ? item.label : undefined}
                        >
                          {item.icon}
                          <span className={collapsed ? 'md:sr-only' : ''}>{item.label}</span>
                        </NavLink>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </nav>

          {/* "Susunod na gagawin" + the belt card: bottom of the sidebar on desktop, under the links on phones. */}
          <div className="space-y-2 px-3 pb-4 md:mt-auto">
            <NextFocusCard collapsed={collapsed} />
            <BeltCard collapsed={collapsed} />
          </div>
        </aside>
      )}

      <main id="main" className={`min-w-0 flex-1 px-4 py-6 md:px-10 ${senseiRoom}`}>
        {/* Wider page when the sidebar is collapsed: that is the point of collapsing it. */}
        <div className={'mx-auto max-w-5xl ' + (collapsed || focus ? 'md:max-w-7xl' : '')}>
          <Suspense fallback={<p className="text-lg text-stone-700">Naglo-load…</p>}>
            <Outlet />
          </Suspense>
        </div>
      </main>

      <Sensei />
    </div>
  );
}
