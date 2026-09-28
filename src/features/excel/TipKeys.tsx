/** "Ctrl + Shift + ↓" drawn with keyboard keys; the words in between stay plain text. */
import { Fragment } from 'react';
import { Kbd } from '../../components/ui';

export default function TipKeys({ tip }: { tip: string }) {
  const parts = tip.split(
    // F2 is the key only on its own, not the cell F2 inside a formula (=MID(F2,4,2), F2:H8).
    /(Ctrl|Shift|Alt|Home|End|Delete|Enter|Esc|(?<![\w$(,:])F2(?![\w:)]|,\S)|Tab|Space|PgDn|PgUp|↓|↑|→|←|(?<=\+ )[A-Z0-9;=+-]|(?<![A-Za-z])'(?=\s))/,
  );
  return <span>{parts.map((p, i) => (i % 2 === 1 ? <Kbd key={i}>{p}</Kbd> : <Fragment key={i}>{p}</Fragment>))}</span>;
}
