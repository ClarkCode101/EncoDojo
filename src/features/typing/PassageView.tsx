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

  return (
    <div
      ref={boxRef}
      aria-hidden="true"
      className="relative h-56 overflow-y-auto rounded-lg border border-slate-300 bg-white p-4 font-mono text-lg leading-relaxed"
    >
      {Array.from(passage).map((char, i) => {
        let className = 'text-slate-500';
        if (i < cursor) {
          if (statuses[i] === 'correct') className = 'text-slate-900';
          else if (statuses[i] === 'wrong') className = 'bg-red-200 text-red-800';
          else className = 'bg-red-100 text-red-700 line-through';
        } else if (i === cursor) {
          className = 'bg-yellow-200 text-slate-900 underline decoration-2';
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
  );
}
