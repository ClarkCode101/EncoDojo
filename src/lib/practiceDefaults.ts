/**
 * Settings -> "Unang pipiliing tagal": which duration a practice page starts on.
 * 'short' = the shortest choice, 'long' = the longest, missing = the page's usual choice.
 */
import type { DefaultLength } from './storage';

export function startingDuration<T>(choices: readonly T[], usual: T, preference: DefaultLength | undefined): T {
  if (preference === 'short') return choices[0];
  if (preference === 'long') return choices[choices.length - 1];
  return usual;
}
