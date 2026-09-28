/** "Ctrl + Shift + ↓" drawn with keyboard keys; the words in between stay plain text. */
import { Fragment } from 'react';
import { Kbd } from '../../components/ui';

export default function TipKeys({ tip }: { tip: string }) {
  const parts = tip.split(
    /(Ctrl|Shift|Home|End|Delete|Enter|Esc|F2|Tab|↓|↑|→|←|(?<=\+ )[A-Z0-9;]|(?<![A-Za-z])'(?=\s))/,
  );
  return <span>{parts.map((p, i) => (i % 2 === 1 ? <Kbd key={i}>{p}</Kbd> : <Fragment key={i}>{p}</Fragment>))}</span>;
}
