import { useEffect, useRef } from 'react';
import type { Alignment } from './alignTyping';

/**
 * Shows the passage one <span> per character:
 * - typed & correct:  dark text (neutral)
 * - wrong key:        red background
 * - skipped letter:   red, crossed out
 * - extra key(s):     small red bar just before the next character
 * - current char:     yellow highlight + underline
 * - not typed yet:    grey
 */
export default function PassageView({
  passage,
  alignment,
}: {
  passage: string;
  alignment: Alignment;
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  const currentRef = useRef<HTMLSpanElement>(null);
  const { statuses, extrasBefore, cursor } = alignment;

  // Keep the current character visible by scrolling the box (not the page).
  useEffect(() => {
    const box = boxRef.current;
    const current = currentRef.current;
    if (!box || !current) return;
    const top = current.offsetTop;
    if (top < box.scrollTop || top > box.scrollTop + box.clientHeight - 48) {
      box.scrollTop = Math.max(0, top - 24);
    }
  }, [cursor]);

  // Looks like a sheet of paper (the "source document" an encoder copies from).
  return (
    <div className="overflow-hidden rounded-md border border-stone-200 bg-white shadow-paper">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-dashed border-stone-200 px-5 py-2 text-sm">
        <span className="font-semibold text-brand-800">📄 Ito ang ita-type mo</span>
        <span className="text-stone-600">Kopyahin nang eksakto</span>
      </div>
      <div
        ref={boxRef}
        aria-hidden="true"
        className="relative h-56 overflow-y-auto px-6 py-4 font-mono text-lg leading-loose"
      >
        {Array.from(passage).map((char, i) => {
          let className = 'text-stone-500';
          if (i < cursor) {
            if (statuses[i] === 'correct') className = 'text-stone-900';
            else if (statuses[i] === 'wrong') className = 'bg-red-200 text-red-800';
            else className = 'bg-red-100 text-red-700 line-through';
          } else if (i === cursor) {
            className = 'bg-yellow-200 text-stone-900 underline decoration-2';
          }
          return (
            <span key={i}>
              {i <= cursor && extrasBefore[i] > 0 && (
                <span
                  title={`${extrasBefore[i]} extra key(s)`}
                  className="mx-px inline-block h-5 w-1 rounded-sm bg-red-600 align-middle"
                />
              )}
              <span ref={i === cursor ? currentRef : undefined} className={className}>
                {char}
              </span>
            </span>
          );
        })}
      </div>
    </div>
  );
}
