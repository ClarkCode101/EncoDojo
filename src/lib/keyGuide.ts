/**
 * The on-screen keyboard guide (Settings -> "Gabay sa keyboard", owner's request 2026-10-01):
 * which key types a character, whether Shift is needed, and which finger presses it
 * (standard touch typing on a US keyboard; the numpad has its own fingers).
 * Pure functions, tested; components/KeyGuide.tsx draws them.
 */
import { translator, type Lang } from './i18n';

export type Finger = 'lPinky' | 'lRing' | 'lMiddle' | 'lIndex' | 'thumb' | 'rIndex' | 'rMiddle' | 'rRing' | 'rPinky';

/** The keyboard rows, as the labels drawn on the keys. */
export const KEY_ROWS: string[][] = [
  ['`', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '=', 'Backspace'],
  ['Tab', 'Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P', '[', ']', '\\'],
  ['Caps', 'A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', ';', "'", 'Enter'],
  ['Shift', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', ',', '.', '/', 'Shift '],
  ['Space'],
];

const FINGER_OF: Record<string, Finger> = {};
const assign = (finger: Finger, keys: string) => keys.split(' ').forEach((k) => (FINGER_OF[k] = finger));
assign('lPinky', '` 1 Q A Z Tab Caps Shift');
assign('lRing', '2 W S X');
assign('lMiddle', '3 E D C');
assign('lIndex', '4 5 R T F G V B');
assign('rIndex', '6 7 Y U H J N M');
assign('rMiddle', '8 I K ,');
assign('rRing', '9 O L .');
assign('rPinky', "0 - = P [ ] \\ ; ' / Enter Backspace");
FINGER_OF['Shift '] = 'rPinky';
FINGER_OF['Space'] = 'thumb';

/** The base key of a character typed with Shift (US keyboard). */
const SHIFTED: Record<string, string> = {
  '~': '`',
  '!': '1',
  '@': '2',
  '#': '3',
  $: '4',
  '%': '5',
  '^': '6',
  '&': '7',
  '*': '8',
  '(': '9',
  ')': '0',
  _: '-',
  '+': '=',
  '{': '[',
  '}': ']',
  '|': '\\',
  ':': ';',
  '"': "'",
  '<': ',',
  '>': '.',
  '?': '/',
};

export type KeyPress = {
  /** The key's label in KEY_ROWS ('J', '1', 'Space', 'Enter', ...). */
  key: string;
  /** The Shift key to hold too ('Shift' left or 'Shift ' right), or null. */
  shift: string | null;
  finger: Finger;
};

const isLeft = (f: Finger) => f.startsWith('l');

/**
 * How to type one character: its key, the Shift to hold (the one on the OTHER hand, as taught
 * in touch typing), and the finger. '\n' or 'Enter' = Enter; null for a character not on the keyboard.
 */
export function keyFor(char: string): KeyPress | null {
  if (char === ' ') return { key: 'Space', shift: null, finger: 'thumb' };
  if (char === '\n' || char === 'Enter') return { key: 'Enter', shift: null, finger: 'rPinky' };
  if (char === 'Backspace') return { key: 'Backspace', shift: null, finger: 'rPinky' };
  let key = char;
  let shifted = false;
  if (/^[a-z]$/.test(char)) key = char.toUpperCase();
  else if (/^[A-Z]$/.test(char)) shifted = true;
  else if (SHIFTED[char]) {
    key = SHIFTED[char];
    shifted = true;
  }
  const finger = FINGER_OF[key];
  if (!finger) return null;
  return { key, shift: shifted ? (isLeft(finger) ? 'Shift ' : 'Shift') : null, finger };
}

/** The numpad keys (Num Lock on), as drawn; and their fingers (right hand on 4-5-6). */
export const NUMPAD_FINGER: Record<string, Finger> = {
  '7': 'rIndex',
  '4': 'rIndex',
  '1': 'rIndex',
  '8': 'rMiddle',
  '5': 'rMiddle',
  '2': 'rMiddle',
  '/': 'rMiddle',
  '9': 'rRing',
  '6': 'rRing',
  '3': 'rRing',
  '.': 'rRing',
  '*': 'rRing',
  '0': 'thumb',
  Enter: 'rPinky',
  '+': 'rPinky',
  '-': 'rPinky',
  Backspace: 'rPinky',
};

/** The finger's name, e.g. "kanang hintuturo" / "right index finger". */
export function fingerName(f: Finger, lang: Lang = 'tl'): string {
  const t = translator(lang);
  const names: Record<Finger, [string, string]> = {
    lPinky: ['kaliwang hinliliit', 'left pinky'],
    lRing: ['kaliwang palasingsingan', 'left ring finger'],
    lMiddle: ['kaliwang hinlalato', 'left middle finger'],
    lIndex: ['kaliwang hintuturo', 'left index finger'],
    thumb: ['hinlalaki', 'thumb'],
    rIndex: ['kanang hintuturo', 'right index finger'],
    rMiddle: ['kanang hinlalato', 'right middle finger'],
    rRing: ['kanang palasingsingan', 'right ring finger'],
    rPinky: ['kanang hinliliit', 'right pinky'],
  };
  return t(...names[f]);
}

/**
 * The next key of a numpad entry: what is shown (e.g. "12,450.75") is typed without commas.
 * 'Enter' when everything is typed, 'Backspace' when what was typed has a mistake.
 */
export function nextNumpadKey(shown: string, typed: string): string {
  const expected = shown.replace(/,/g, '');
  if (!expected.startsWith(typed)) return 'Backspace';
  return typed.length >= expected.length ? 'Enter' : expected[typed.length];
}
