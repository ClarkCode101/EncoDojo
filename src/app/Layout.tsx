import { Suspense, useEffect, type ReactNode } from 'react';
import BeltCard from '../components/BeltCard';
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
  SidebarToggleIcon,
} from '../components/icons';
import type { SessionType } from '../lib/storage';
import { updateSettings, useAppData } from '../lib/useAppData';
import { practicedToday } from '../features/dashboard/coach';
import NextFocusCard from '../features/dashboard/NextFocusCard';

/** `practice`: the session type of a practice page, for the "done today" check. */
type NavItem = { to: string; label: string; icon: ReactNode; practice?: SessionType };
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
      { to: '/typing', label: 'Typing Practice', icon: <KeyboardIcon />, practice: 'typing' },
      { to: '/numpad', label: 'Numpad Practice', icon: <NumpadIcon />, practice: 'numpad' },
      { to: '/copy', label: 'Copy Test', icon: <CopyIcon />, practice: 'copy' },
      { to: '/encoding', label: 'Document Encoding', icon: <DocumentIcon />, practice: 'encoding' },
    ],
  },
  { items: [{ to: '/settings', label: 'Settings', icon: <SettingsIcon /> }] },
];

/** `collapsed` (desktop only): icon-only links, centered. */
const navClass = (collapsed: boolean) => ({ isActive }: { isActive: boolean }) => {
  return (
    // Short screens (<760px tall): a little less space, so the sidebar never needs its own scrollbar.
    'relative flex items-center gap-3 rounded-lg px-3 py-2 text-base font-semibold transition-colors [@media(max-height:760px)]:py-1.5 ' +
    (collapsed ? 'md:justify-center md:px-0 ' : '') +
    'focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-brand-300 ' +
    (isActive
      ? // The page you're on: white pill + a gold "belt" mark at the sidebar's edge (brand accent).
        'bg-white text-brand-900 shadow md:before:absolute md:before:-left-3 md:before:inset-y-1 md:before:w-1.5 md:before:rounded-r-full md:before:bg-belt-400'
      : 'text-brand-50 hover:bg-brand-800')
  );
};

export default function Layout() {
  const { settings, sessions } = useAppData();
  const { largeText, sidebarCollapsed } = settings;
  // "Ensayo ngayong araw": which practice pages were done today (✓ marks).
  const doneToday = practicedToday(sessions);
  const practiceCount = groups.flatMap((g) => g.items).filter((i) => i.practice).length;
  const practiceDone = groups.flatMap((g) => g.items).filter((i) => i.practice && doneToday.has(i.practice)).length;
  // The sidebar can be collapsed to icons only (desktop), for more room. Remembered in the settings.
  const collapsed = sidebarCollapsed === true;

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

      <aside
        className={
          'bg-brand-900 text-white md:sticky md:top-0 md:flex md:h-screen md:shrink-0 md:flex-col md:overflow-y-auto md:overflow-x-hidden ' +
          'md:transition-[width] md:duration-200 motion-reduce:transition-none ' +
          (collapsed ? 'md:w-20' : 'md:w-64')
        }
      >
        <div className={'flex items-center gap-3 px-5 py-5 [@media(max-height:760px)]:py-3 ' + (collapsed ? 'md:flex-col md:px-0' : '')}>
          <Logo className="h-12 w-12 shrink-0" />
          <div className={'text-2xl font-bold leading-tight ' + (collapsed ? 'md:sr-only' : '')}>EncoDojo</div>
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
              <div key={i} className="md:mb-4 md:[@media(max-height:760px)]:mb-2">
                {group.heading &&
                  (collapsed ? (
                    // Collapsed: a thin line instead of the heading.
                    <div aria-hidden="true" className="mx-2 mb-2 hidden border-t border-brand-700 md:block" />
                  ) : (
                    <div className="hidden items-baseline justify-between px-3 pb-1 text-sm font-semibold text-brand-300 md:flex">
                      {group.heading}
                      {/* Today's routine: how many of the practice pages were done today. */}
                      {group.items.some((i) => i.practice) && (
                        <span className={'font-normal ' + (practiceDone === practiceCount ? 'text-green-300' : 'text-brand-200')}>
                          {practiceDone === practiceCount ? 'Tapos lahat ngayon! 🎉' : `${practiceDone} sa ${practiceCount} ngayon`}
                        </span>
                      )}
                    </div>
                  ))}
                <ul className="flex flex-wrap gap-1 md:block md:space-y-1">
                  {group.items.map((item) => {
                    const done = item.practice !== undefined && doneToday.has(item.practice);
                    return (
                      <li key={item.to}>
                        <NavLink
                          to={item.to}
                          end={item.to === '/'}
                          className={navClass(collapsed)}
                          // Collapsed: the name shows when the mouse is on the icon (and is read by screen readers).
                          title={collapsed ? item.label + (done ? ' — nagawa na ngayon ✓' : '') : undefined}
                        >
                          {item.icon}
                          <span className={collapsed ? 'md:sr-only' : ''}>{item.label}</span>
                          {done && (
                            <>
                              {/* Green ✓ = practiced today. Collapsed: a small dot on the icon's corner. */}
                              <span
                                aria-hidden="true"
                                className={
                                  'ml-auto flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-600 text-xs font-bold text-white ' +
                                  (collapsed ? 'md:absolute md:right-3 md:top-1 md:ml-0 md:h-3.5 md:w-3.5 md:text-[0px] md:ring-2 md:ring-brand-900' : '')
                                }
                              >
                                ✓
                              </span>
                              <span className="sr-only">(nagawa na ngayon)</span>
                            </>
                          )}
                        </NavLink>
                      </li>
                    );
                  })}
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

      <main id="main" className="min-w-0 flex-1 px-4 py-6 md:px-10">
        {/* Wider page when the sidebar is collapsed: that is the point of collapsing it. */}
        <div className={'mx-auto max-w-5xl ' + (collapsed ? 'md:max-w-7xl' : '')}>
          <Suspense fallback={<p className="text-lg text-stone-700">Naglo-load…</p>}>
            <Outlet />
          </Suspense>
        </div>
      </main>
    </div>
  );
}
