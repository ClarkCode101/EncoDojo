/**
 * Mistake Review: look back at old mistakes and practice exactly those.
 * - Typing: which characters go wrong most, plus a short drill full of them.
 * - Numpad / Copy Test: type the old wrong numbers / fields again ("Ulitin").
 * Drills and retries are NOT saved to progress (focused practice only).
 */
import { useMemo, useState } from 'react';
import { CopyIcon, KeyboardIcon, NumpadIcon, ReviewIcon } from '../../components/icons';
import { Button, ButtonLink, Card, Notice, PageHeader, SegmentedPicker, StatBadge } from '../../components/ui';
import { makeRng, randomSeed } from '../../lib/random';
import { display } from '../../lib/scoring';
import type { Session } from '../../lib/storage';
import { useAppData } from '../../lib/useAppData';
import { FIELDS, FIELD_LABEL, type FieldKey } from '../copy/records';
import { charsNeeded } from '../typing/buildPassage';
import TypingRunner from '../typing/TypingRunner';
import RetryRunner, { type RetryItem } from './RetryRunner';
import {
  buildDrillPassage,
  collectMistakes,
  fieldCounts,
  kindCounts,
  topMissedChars,
  uniqueRecent,
} from './analyze';

type Range = 'all' | 'week';
const RANGES: Range[] = ['all', 'week'];
const RANGE_LABEL: Record<Range, string> = { all: 'Lahat ng naka-save', week: 'Huling 7 araw' };

/** How many old values to retry at most, and how long the typing drill is. */
const MAX_RETRY = 20;
const DRILL_SECONDS = 30;

type View =
  | { name: 'overview' }
  | { name: 'drill'; passage: string; chars: string[] }
  | { name: 'drillDone'; session: Session; chars: string[] }
  | { name: 'retry'; kind: 'numpad' | 'copy'; items: RetryItem[] };

/** Names for small symbols that are hard to see on their own. */
const SYMBOL_NAMES: Record<string, string> = {
  ',': 'comma',
  '.': 'tuldok',
  '-': 'gitling',
  '/': 'slash',
  ':': 'colon',
  ';': 'semicolon',
  "'": 'apostrophe',
  '"': 'quote',
  '(': 'panaklong',
  ')': 'panaklong',
};

/** Make invisible or tiny characters easy to see in the tables. */
function showChar(char: string): string {
  if (char === '') return '(nalaktawan)';
  if (char === ' ') return '␣ (space)';
  if (SYMBOL_NAMES[char]) return `${char}  (${SYMBOL_NAMES[char]})`;
  return char;
}

export default function ReviewPage() {
  const data = useAppData();
  const [range, setRange] = useState<Range>('all');
  const [view, setView] = useState<View>({ name: 'overview' });

  const mistakes = useMemo(() => {
    const since = range === 'week' ? new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) : undefined;
    return collectMistakes(data.sessions, since);
  }, [data.sessions, range]);

  const missedChars = topMissedChars(mistakes.typing);
  const kinds = kindCounts(mistakes.typing);
  const numpadItems = uniqueRecent(mistakes.numpad, MAX_RETRY);
  const copyItems = uniqueRecent(mistakes.copy, MAX_RETRY);
  const copyFields = fieldCounts(mistakes.copy);
  const drillChars = missedChars.map((m) => m.char).filter((c) => c !== ' ');

  function startDrill(chars: string[]) {
    const passage = buildDrillPassage(makeRng(randomSeed()), chars, charsNeeded(DRILL_SECONDS / 60));
    if (passage) setView({ name: 'drill', passage, chars });
  }

  const back = () => setView({ name: 'overview' });

  // ---------- typing drill ----------
  if (view.name === 'drill') {
    return (
      <div>
        <PageHeader
          icon={<KeyboardIcon className="h-8 w-8" />}
          title="Drill: mga letrang madalas mong mali"
          description={`Puno ng mga salitang may ${view.chars.map((c) => `"${c}"`).join(', ')}. ${DRILL_SECONDS} segundo. Hindi ito sine-save sa progress.`}
        />
        <TypingRunner
          passage={view.passage}
          seconds={DRILL_SECONDS}
          level={0}
          showLiveStats
          allowFinishEarly
          sound={data.settings.sound}
          onFinish={(session) => setView({ name: 'drillDone', session, chars: view.chars })}
        />
        <div className="mt-4">
          <Button variant="secondary" onClick={back}>
            Bumalik sa Mistake Review
          </Button>
        </div>
      </div>
    );
  }

  if (view.name === 'drillDone') {
    const m = view.session.metrics;
    return (
      <div>
        <PageHeader icon={<KeyboardIcon className="h-8 w-8" />} title="Tapos na ang drill!" />
        <Card>
          <p className="text-2xl text-stone-900">
            <strong>{display(m.accuracy)}%</strong> ang tama, sa bilis na <strong>{display(m.netWpm)} WPM</strong>.
            {m.errors === 0 ? ' Walang mali! 👏' : ` ${m.errors} mali.`}
          </p>
          <p className="mt-2 text-lg text-stone-700">
            Ulitin ang drill hanggang maging komportable ka sa mga letrang ito. (Hindi ito sine-save sa progress.)
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Button size="lg" autoFocus onClick={() => startDrill(view.chars)}>
              Ulitin ang drill
            </Button>
            <Button size="lg" variant="secondary" onClick={back}>
              Bumalik sa Mistake Review
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // ---------- retry numbers / fields ----------
  if (view.name === 'retry') {
    return (
      <div>
        <PageHeader
          icon={view.kind === 'numpad' ? <NumpadIcon className="h-8 w-8" /> : <CopyIcon className="h-8 w-8" />}
          title={view.kind === 'numpad' ? 'Ulitin: mga maling numero' : 'Ulitin: mga maling field'}
          description="Walang timer — ang layunin ay makuha nang tama. Babalik sa dulo ang mga mali pa."
        />
        <RetryRunner kind={view.kind} items={view.items} onBack={back} />
      </div>
    );
  }

  // ---------- overview ----------
  const total = mistakes.typing.length + mistakes.numpad.length + mistakes.copy.length;

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<ReviewIcon className="h-8 w-8" />}
        title="Mistake Review"
        description="Balikan at ulitin ang mga dati mong mali — dito ka pinakamabilis gumaling."
      />

      <SegmentedPicker label="Aling mga mali?" options={RANGES} value={range} format={(r) => RANGE_LABEL[r]} onChange={setRange} />

      {total === 0 ? (
        <Notice kind="info">
          <p className="font-semibold">
            {range === 'week' ? 'Wala kang naka-save na mali sa huling 7 araw.' : 'Wala ka pang naka-save na mali.'}
          </p>
          <p className="mt-1">
            Mag-practice muna. Pagkatapos, dito mo makikita at mauulit ang mga mali mo.
          </p>
          <div className="mt-3 flex flex-wrap gap-3">
            <ButtonLink to="/typing" variant="secondary">
              Typing Practice
            </ButtonLink>
            <ButtonLink to="/numpad" variant="secondary">
              Numpad Practice
            </ButtonLink>
            <ButtonLink to="/copy" variant="secondary">
              Copy Test
            </ButtonLink>
          </div>
        </Notice>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <StatBadge label="Mali sa typing" value={mistakes.typing.length} hint="letra" />
          <StatBadge label="Maling numero" value={mistakes.numpad.length} hint="numpad" />
          <StatBadge label="Maling field" value={mistakes.copy.length} hint="Copy Test" />
        </div>
      )}

      {mistakes.typing.length > 0 && (
        <Card title="Typing: mga letrang madalas mong mali" icon={<KeyboardIcon />}>
          <p className="mb-4 text-stone-700">
            Maling letra: <strong>{kinds.wrong}</strong> · Sobrang letra: <strong>{kinds.extra}</strong> · Nalaktawan:{' '}
            <strong>{kinds.skipped}</strong>
          </p>
          {missedChars.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full max-w-xl text-left text-base">
                <thead className="text-stone-600">
                  <tr>
                    <th className="py-2 pr-4 font-semibold">Dapat</th>
                    <th className="py-2 pr-4 font-semibold">Madalas mong na-type</th>
                    <th className="py-2 font-semibold">Ilang beses</th>
                  </tr>
                </thead>
                <tbody>
                  {missedChars.map((m) => (
                    <tr key={m.char} className="border-t border-stone-200">
                      <td className="py-2 pr-4 font-mono text-xl text-green-800">{showChar(m.char)}</td>
                      <td className="py-2 pr-4 font-mono text-xl text-red-700">{showChar(m.usuallyTyped)}</td>
                      <td className="py-2 tabular-nums">{m.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="mt-5">
            {drillChars.length > 0 ? (
              <Button size="lg" onClick={() => startDrill(drillChars)}>
                Mag-drill sa mga letrang ito ({DRILL_SECONDS} segundo)
              </Button>
            ) : (
              <p className="text-stone-700">Karamihan ng mali mo ay space o sobrang letra — bagalan lang nang kaunti.</p>
            )}
          </div>
        </Card>
      )}

      {mistakes.numpad.length > 0 && (
        <Card title="Numpad: mga maling numero" icon={<NumpadIcon />}>
          <RecentTable
            rows={numpadItems.slice(0, 10).map((m) => ({ label: '', expected: m.expected, typed: m.typed }))}
          />
          <div className="mt-5">
            <Button
              size="lg"
              onClick={() =>
                setView({
                  name: 'retry',
                  kind: 'numpad',
                  items: numpadItems.map((m) => ({ label: 'Number', tl: 'Numero', expected: m.expected })),
                })
              }
            >
              Ulitin ang {numpadItems.length} maling numero
            </Button>
          </div>
        </Card>
      )}

      {mistakes.copy.length > 0 && (
        <Card title="Copy Test: mga maling field" icon={<CopyIcon />}>
          <div className="mb-4 flex flex-wrap gap-2">
            {copyFields.map((f) => (
              <span key={f.field} className="rounded-full bg-red-50 px-3 py-1 text-base text-red-900">
                {FIELD_LABEL[f.field as FieldKey] ?? f.field}: <strong>{f.count}</strong>
              </span>
            ))}
          </div>
          <RecentTable
            rows={copyItems.slice(0, 10).map((m) => ({
              label: FIELD_LABEL[m.field as FieldKey] ?? m.field ?? '',
              expected: m.expected,
              typed: m.typed,
            }))}
          />
          <div className="mt-5">
            <Button
              size="lg"
              onClick={() =>
                setView({
                  name: 'retry',
                  kind: 'copy',
                  items: copyItems.map((m) => {
                    const f = FIELDS.find((x) => x.key === m.field);
                    return { label: f?.label ?? 'Field', tl: f?.tl, expected: m.expected };
                  }),
                })
              }
            >
              Ulitin ang {copyItems.length} maling field
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}

/** Recent wrong values: what it should be vs what was typed. */
function RecentTable({ rows }: { rows: { label: string; expected: string; typed: string }[] }) {
  const showLabel = rows.some((r) => r.label);
  return (
    <div className="overflow-x-auto">
      <p className="mb-2 text-sm text-stone-600">Ang pinakabagong {rows.length}:</p>
      <table className="w-full text-left text-base">
        <thead className="text-stone-600">
          <tr>
            {showLabel && <th className="py-2 pr-4 font-semibold">Field</th>}
            <th className="py-2 pr-4 font-semibold">Dapat</th>
            <th className="py-2 font-semibold">Na-type mo</th>
          </tr>
        </thead>
        <tbody className="font-mono">
          {rows.map((r, i) => (
            <tr key={i} className="border-t border-stone-200 align-top">
              {showLabel && <td className="py-2 pr-4 font-sans text-stone-800">{r.label}</td>}
              <td className="py-2 pr-4 text-green-800">{r.expected}</td>
              <td className="py-2 text-red-700">{r.typed || '(walang na-type)'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
