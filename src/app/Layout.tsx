import { Suspense } from 'react';
import { NavLink, Outlet } from 'react-router-dom';

type NavGroup = { heading?: string; links: { to: string; label: string }[] };

const groups: NavGroup[] = [
  {
    links: [
      { to: '/', label: 'Dashboard' },
      { to: '/assessment', label: 'Assessment' },
    ],
  },
  {
    heading: 'Training',
    links: [
      { to: '/typing', label: 'Typing Test' },
      { to: '/numpad', label: 'Numpad Drill' },
    ],
  },
  { links: [{ to: '/settings', label: 'Settings' }] },
];

// Shown in the sidebar so the roadmap is visible, but not clickable yet.
const comingSoon = [
  'Copy Test',
  'Document Encoding',
  'QC / Spot the Difference',
  'Excel Drills',
  'Mistake Review',
  'Progress & Reports',
];

function navClass({ isActive }: { isActive: boolean }) {
  return (
    'block rounded-md px-3 py-2 text-sm font-medium focus-visible:outline focus-visible:outline-2 ' +
    'focus-visible:outline-offset-2 focus-visible:outline-blue-400 ' +
    (isActive ? 'bg-blue-700 text-white' : 'text-slate-200 hover:bg-slate-800')
  );
}

export default function Layout() {
  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-10 focus:rounded focus:bg-white focus:px-3 focus:py-2"
      >
        Skip to content
      </a>

      <aside className="bg-slate-900 text-white md:sticky md:top-0 md:h-screen md:w-60 md:shrink-0 md:overflow-y-auto">
        <div className="px-4 py-5">
          <div className="text-lg font-bold">EncoDojo</div>
          <div className="text-xs text-slate-300">Data entry skills trainer</div>
        </div>

        <nav aria-label="Main" className="px-2 pb-4">
          <div className="flex flex-wrap gap-1 md:block">
            {groups.map((group, i) => (
              <div key={i} className="md:mb-4">
                {group.heading && (
                  <div className="hidden px-3 pb-1 text-xs font-semibold uppercase tracking-wide text-slate-400 md:block">
                    {group.heading}
                  </div>
                )}
                <ul className="flex flex-wrap gap-1 md:block md:space-y-1">
                  {group.links.map((link) => (
                    <li key={link.to}>
                      <NavLink to={link.to} end={link.to === '/'} className={navClass}>
                        {link.label}
                      </NavLink>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-2 hidden md:block">
            <div className="px-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
              Coming soon
            </div>
            <ul className="mt-2 space-y-1">
              {comingSoon.map((label) => (
                <li
                  key={label}
                  aria-disabled="true"
                  className="cursor-default px-3 py-1.5 text-sm text-slate-400"
                >
                  {label}
                </li>
              ))}
            </ul>
          </div>
        </nav>
      </aside>

      <main id="main" className="flex-1 bg-slate-50 px-4 py-6 md:px-10 md:py-8">
        <div className="mx-auto max-w-5xl">
          <Suspense fallback={<p className="text-slate-600">Loading…</p>}>
            <Outlet />
          </Suspense>
        </div>
      </main>
    </div>
  );
}
