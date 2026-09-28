/**
 * The Kodigo page (/excel/kodigo): every shortcut, formula and tool of the Excel lessons on one
 * page, by lesson or by kind, with a search box. It can be printed (only the list is printed),
 * like the paper list of shortcuts many new encoders keep next to the monitor.
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ExcelIcon } from '../../components/icons';
import { Button, ButtonLink, PageHeader, Section, SegmentedPicker } from '../../components/ui';
import { listNumber } from '../../lib/listNumber';
import { useAppData } from '../../lib/useAppData';
import { kodigoByLesson, kodigoOfKind, matches, type KodigoItem, type KodigoKind } from './kodigo';
import { LESSONS, passedLessons } from './lessons';
import TipKeys from './TipKeys';

type View = 'aralin' | KodigoKind;
const VIEWS: View[] = ['aralin', 'shortcut', 'formula', 'tool'];
const VIEW_LABEL: Record<View, string> = {
  aralin: 'Ayon sa aralin',
  shortcut: 'Shortcuts',
  formula: 'Formulas',
  tool: 'Tools',
};

/** One ruled line: the keys (drawn as keys) or the formula, and what it does. */
function Row({ item, showLessons = false }: { item: KodigoItem; showLessons?: boolean }) {
  return (
    <div className="grid grid-cols-[minmax(0,13rem)_minmax(0,1fr)] gap-x-4 py-1.5 sm:grid-cols-[15rem_minmax(0,1fr)] print:grid-cols-[9rem_minmax(0,1fr)] print:gap-x-2 print:py-0.5 print:text-sm">
      <dt
        className={
          'min-w-0 text-stone-900 [overflow-wrap:anywhere] ' +
          (item.kind === 'formula' ? 'font-mono text-[0.95rem]' : '')
        }
      >
        <TipKeys tip={item.keys} />
      </dt>
      <dd className="min-w-0 text-stone-700">
        {item.what}
        {showLessons && <span className="ml-2 text-sm text-stone-500">Aralin {item.lessons.join(', ')}</span>}
      </dd>
    </div>
  );
}

export default function KodigoPage() {
  const passed = passedLessons(useAppData().sessions);
  const [view, setView] = useState<View>('aralin');
  const [query, setQuery] = useState('');
  const groups = kodigoByLesson(LESSONS)
    .map((g) => ({ ...g, items: g.items.filter((i) => matches(i, query)) }))
    .filter((g) => g.items.length > 0);
  const flat = view === 'aralin' ? [] : kodigoOfKind(LESSONS, view).filter((i) => matches(i, query));
  const found = view === 'aralin' ? groups.length > 0 : flat.length > 0;

  return (
    <div>
      <PageHeader
        icon={<ExcelIcon className="h-8 w-8" />}
        title="Kodigo"
        description="Lahat ng shortcut at formula ng mga aralin sa Excel, sa isang pahina. Puwedeng i-print at idikit sa tabi ng monitor."
      />

      <div className="mb-6 flex flex-wrap items-end gap-x-6 gap-y-3 print:hidden">
        <label className="flex flex-col text-sm font-semibold text-stone-800">
          Hanapin
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="hal. Ctrl + D, SUM, freeze"
            className="mt-1 w-64 rounded-lg border-[1.5px] border-stone-500 bg-white px-3 py-2 text-base font-normal focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-200"
          />
        </label>
        <SegmentedPicker
          label="Ipakita"
          options={VIEWS}
          value={view}
          onChange={setView}
          format={(v) => VIEW_LABEL[v]}
        />
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => window.print()}>
            I-print
          </Button>
          <ButtonLink to="/excel" variant="secondary">
            ‹ Mga aralin
          </ButtonLink>
        </div>
      </div>

      {!found ? (
        <p role="status" className="text-lg text-stone-700">
          Walang tugma sa &ldquo;{query}&rdquo;. Subukan ang ibang salita, gaya ng &ldquo;copy&rdquo; o
          &ldquo;SUM&rdquo;.
        </p>
      ) : view === 'aralin' ? (
        <div className="grid gap-x-10 gap-y-7 lg:grid-cols-2 print:grid-cols-2 print:gap-y-4">
          {groups.map((g) => (
            <Section
              key={g.level}
              small
              className="break-inside-avoid"
              title={`${listNumber(g.level)} ${g.title}`}
              aside={
                <span className="flex items-center gap-2 text-sm print:hidden">
                  {passed.has(g.level) && (
                    <span className="rounded-full bg-green-100 px-2 py-0.5 font-semibold text-green-800">Pasado</span>
                  )}
                  <Link
                    to={`/excel?aralin=${g.level}`}
                    className="font-semibold text-brand-700 underline hover:text-brand-900"
                  >
                    Balikan
                  </Link>
                </span>
              }
            >
              <dl className="divide-y divide-stone-200">
                {g.items.map((item) => (
                  <Row key={item.keys} item={item} />
                ))}
              </dl>
            </Section>
          ))}
        </div>
      ) : (
        <Section title={VIEW_LABEL[view]}>
          <dl className="divide-y divide-stone-200">
            {flat.map((item) => (
              <Row key={item.keys} item={item} showLessons />
            ))}
          </dl>
        </Section>
      )}

      <p className="mt-8 border-t border-stone-300 pt-3 text-sm text-stone-600">
        Sa Google Sheets, halos pareho. Iba ang ilan: Ctrl + Shift + PgDn / PgUp para lumipat ng tab (iyon din dito sa
        app; sa Excel, Ctrl + PgDn / PgUp), at kusang lumalabas ang Smart Fill sa halip na Ctrl + E.
      </p>
    </div>
  );
}
