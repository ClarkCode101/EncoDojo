/**
 * Sensei, drawn as pixel art (an original drawing, one <rect> per pixel):
 * white hair and beard, a gold headband, an indigo gi (brand colors) and a
 * black belt with a gold knot. `crispEdges` keeps the pixels sharp at any size.
 */
const PALETTE: Record<string, string> = {
  K: '#1C1917', // outline, eyes, belt
  W: '#F5F5F4', // hair, beard, collar
  S: '#F2C79B', // skin
  G: '#F5B301', // headband, belt knot (belt-400)
  B: '#2E2A6B', // gi (brand-800)
};

// 16 x 18 pixels. "." = transparent.
const PIXELS = [
  '....KKKKKKKK....',
  '...KWWWWWWWWK...',
  '..KGGGGGGGGGGK..',
  '..KSSSSSSSSSSK..',
  '..KSKKSSSSKKSK..',
  '..KSSSSSSSSSSK..',
  '..KWWSSSSSSWWK..',
  '..KWWWWKKWWWWK..',
  '...KWWWWWWWWK...',
  '....KWWWWWWK....',
  '..KKBBKWWKBBKK..',
  '.KBBBBBKKBBBBBK.',
  '.KBBBBBWWBBBBBK.',
  '.KSBBBBBBBBBBSK.',
  '.KSKKKKGGKKKKSK.',
  '..KBBBBKKBBBBK..',
  '..KBBBBKKBBBBK..',
  '..KKKKK..KKKKK..',
];

export default function SenseiArt({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 18" shapeRendering="crispEdges" aria-hidden="true" className={className}>
      {PIXELS.flatMap((row, y) =>
        [...row].map((c, x) => (c === '.' ? null : <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill={PALETTE[c]} />)),
      )}
    </svg>
  );
}
