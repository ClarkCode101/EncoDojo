/**
 * Makes the desktop sidebar fit the window without its own scrollbar (owner's
 * request 2026-10-01: at 100% zoom it scrolled). Fixed height breakpoints were
 * not enough: browser zoom, "Mas malaking text", the language and the text in
 * the cards all change how tall it is. So the sidebar measures itself: when its
 * content is taller than the window, it goes one "fit" step tighter (less space,
 * then the small hint lines hide, ...) until it fits. The steps are in index.css
 * (`.sidebar[data-fit~='N']`). It starts again from the roomiest look whenever
 * the window size (also zoom) or the content changes. If even the last step does
 * not fit (a very small window), the sidebar still scrolls, as a last resort.
 */
import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from 'react';

/** How many fit steps exist in index.css. */
export const FIT_STEPS = 5;

/**
 * Returns the `data-fit` value for the sidebar: '' (roomy), '1', '1 2', ... (each step keeps the
 * ones before it). `contentKey` changes whenever the sidebar's content may change height.
 */
export function useSidebarFit(ref: RefObject<HTMLElement | null>, contentKey: string): string {
  const [step, setStep] = useState(0);
  // Bumps on a window resize (browser zoom fires one too) and when the fonts have loaded.
  const [sizeTick, setSizeTick] = useState(0);
  const key = `${contentKey}|${sizeTick}`;
  const lastKey = useRef(key);

  useEffect(() => {
    const bump = () => setSizeTick((n) => n + 1);
    window.addEventListener('resize', bump);
    document.fonts?.ready.then(bump).catch(() => {});
    return () => window.removeEventListener('resize', bump);
  }, []);

  // Before the browser paints: measure, and go one step tighter while it does not fit.
  useLayoutEffect(() => {
    if (lastKey.current !== key) {
      // Something changed: start again from the roomiest look.
      lastKey.current = key;
      if (step !== 0) {
        setStep(0);
        return;
      }
    }
    const el = ref.current;
    if (!el || !window.matchMedia('(min-width: 768px)').matches) return; // phones: the menu is on top
    if (el.scrollHeight > el.clientHeight + 1 && step < FIT_STEPS) setStep(step + 1);
  }, [key, step, ref]);

  return Array.from({ length: step }, (_, i) => String(i + 1)).join(' ');
}
