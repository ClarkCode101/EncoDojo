import { memo, useEffect, useRef } from 'react';

/**
 * Shows the passage one <span> per character:
 * - already typed & correct: dark text (neutral)
 * - already typed & wrong:   red background
 * - current character:       yellow highlight + underline
 * - not typed yet:           grey
 */
function PassageView({ passage, typed }: { passage: string; typed: string }) {
  const boxRef = useRef<HTMLDivElement>(null);
  const currentRef = useRef<HTMLSpanElement>(null);
  const position = typed.length;

  // Keep the current character visible by scrolling the box (not the page).
  useEffect(() => {
    const box = boxRef.current;
    const current = currentRef.current;
    if (!box || !current) return;
    const top = current.offsetTop;
    if (top < box.scrollTop || top > box.scrollTop + box.clientHeight - 48) {
      box.scrollTop = Math.max(0, top - 24);
    }
  }, [position]);

  return (
    <div
      ref={boxRef}
      aria-hidden="true"
      className="relative h-56 overflow-y-auto rounded-lg border border-slate-300 bg-white p-4 font-mono text-lg leading-relaxed"
    >
      {Array.from(passage).map((char, i) => {
        let className = 'text-slate-500';
        if (i < position) {
          className = typed[i] === char ? 'text-slate-900' : 'bg-red-200 text-red-800';
        } else if (i === position) {
          className = 'bg-yellow-200 text-slate-900 underline decoration-2';
        }
        return (
          <span key={i} ref={i === position ? currentRef : undefined} className={className}>
            {char}
          </span>
        );
      })}
    </div>
  );
}

export default memo(PassageView);
