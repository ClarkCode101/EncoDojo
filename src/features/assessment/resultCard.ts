/**
 * The downloadable "result card" of an Assessment (owner's choice, 2026-09-27):
 * a 1080 x 1350 PNG (fits phones and social media) drawn with the browser's
 * Canvas, so no library is needed.
 *
 * It clearly says it is a self-assessed practice result, NOT an official
 * certificate, so it can't be mistaken for one if shared with an employer.
 */
import { beltStatus } from '../../lib/belts';
import { display } from '../../lib/scoring';
import type { Session } from '../../lib/storage';
import { assessmentChecks, hasCopyPart, hasEncodingPart, hasQcPart, type Check } from './evaluate';

export const CARD_WIDTH = 1080;
export const CARD_HEIGHT = 1350;

export type ResultCardData = {
  date: string;
  ready: boolean;
  met: number;
  total: number;
  parts: {
    title: string;
    passed: boolean;
    checks: { label: string; value: string; target: string; pass: boolean }[];
  }[];
  belt: { label: string; color: string };
};

const TITLES: Record<Check['section'], string> = {
  typing: 'Typing',
  numpad: 'Numpad',
  copy: 'Copy Test',
  encoding: 'Document Encoding',
  qc: 'QC Check',
};

/**
 * Everything the card shows. The belt is the one earned up to THIS
 * assessment (so an old report shows the belt of that time).
 */
export function resultCardData(assessment: Session, sessions: Session[]): ResultCardData {
  const m = assessment.metrics;
  const checks = assessmentChecks(m);
  const sections = (['typing', 'numpad', 'copy', 'encoding', 'qc'] as Check['section'][]).filter(
    (s) => (s !== 'copy' || hasCopyPart(m)) && (s !== 'encoding' || hasEncodingPart(m)) && (s !== 'qc' || hasQcPart(m)),
  );
  const upToThen = sessions.filter((s) => s.startedAt <= assessment.startedAt && s.id !== assessment.id);
  const belt = beltStatus([...upToThen, assessment]).belt;
  return {
    date: new Date(assessment.startedAt).toLocaleDateString('en-US', { dateStyle: 'medium' }),
    ready: m.jobReady === 1,
    met: m.targetsMet,
    total: m.targetsTotal,
    parts: sections.map((s) => {
      const list = checks.filter((c) => c.section === s);
      return {
        title: TITLES[s],
        passed: list.every((c) => c.pass),
        checks: list.map((c) => ({
          label: c.label,
          value: `${display(c.value).toLocaleString('en-US')}${c.unit}`,
          target: `${c.target.toLocaleString('en-US')}${c.unit}`,
          pass: c.pass,
        })),
      };
    }),
    belt: { label: belt.label, color: belt.color },
  };
}

// ---------- drawing ----------

const C = {
  paper: '#FBF8F1',
  brand: '#2E2A6B',
  brandDark: '#231F55',
  brandSoft: '#C9C6F0',
  gold: '#F5B301',
  ink: '#1C1917',
  muted: '#57534E',
  faint: '#78716C',
  green: '#15803D',
  greenBg: '#F0FDF4',
  greenLine: '#86EFAC',
  amber: '#B45309',
  amberBg: '#FFFBEB',
  amberLine: '#F59E0B',
  red: '#DC2626',
  redLine: '#FCA5A5',
  white: '#FFFFFF',
};
const FONT = 'system-ui, "Segoe UI", Roboto, Arial, sans-serif';

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** The belt shape of the logo (48 x 48 units), scaled to `size`, in any color. */
function drawBelt(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, fill: string, stroke: string) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(size / 48, size / 48);
  ctx.fillStyle = fill;
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 1.5;
  ctx.lineJoin = 'round';
  const shape = (draw: () => void) => {
    ctx.beginPath();
    draw();
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  };
  shape(() => ctx.rect(3, 17, 42, 8));
  shape(() => {
    ctx.moveTo(21.5, 27);
    ctx.lineTo(15, 40);
    ctx.lineTo(20.5, 40);
    ctx.lineTo(24.5, 30);
  });
  shape(() => {
    ctx.moveTo(26.5, 27);
    ctx.lineTo(33, 40);
    ctx.lineTo(27.5, 40);
    ctx.lineTo(23.5, 30);
  });
  roundRect(ctx, 18.5, 14, 11, 14, 3);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

/** The EncoDojo logo: a gold tile with an indigo belt. */
function drawLogo(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
  ctx.fillStyle = C.gold;
  roundRect(ctx, x, y, size, size, size / 4);
  ctx.fill();
  drawBelt(ctx, x, y, size, C.brandDark, C.gold);
}

export function drawResultCard(ctx: CanvasRenderingContext2D, d: ResultCardData) {
  const W = CARD_WIDTH;
  const left = 80;
  const right = W - 80;
  ctx.textBaseline = 'alphabetic';

  // Background
  ctx.fillStyle = C.paper;
  ctx.fillRect(0, 0, W, CARD_HEIGHT);

  // Header band: logo, name, date
  ctx.fillStyle = C.brand;
  ctx.fillRect(0, 0, W, 170);
  drawLogo(ctx, left, 45, 80);
  ctx.fillStyle = C.white;
  ctx.font = `800 52px ${FONT}`;
  ctx.fillText('EncoDojo', left + 100, 100);
  ctx.fillStyle = C.brandSoft;
  ctx.font = `500 26px ${FONT}`;
  ctx.fillText('Resulta ng Assessment', left + 100, 140);
  ctx.textAlign = 'right';
  ctx.fillStyle = C.white;
  ctx.font = `600 28px ${FONT}`;
  ctx.fillText(d.date, right, 100);
  ctx.textAlign = 'left';

  // Verdict box + stamp
  const vy = 210;
  ctx.fillStyle = d.ready ? C.greenBg : C.amberBg;
  roundRect(ctx, left, vy, right - left, 290, 28);
  ctx.fill();
  ctx.lineWidth = 4;
  ctx.strokeStyle = d.ready ? '#22C55E' : C.amberLine;
  ctx.stroke();
  ctx.fillStyle = C.ink;
  ctx.font = `800 54px ${FONT}`;
  ctx.fillText(d.ready ? 'Job-ready ka na!' : 'Hindi pa job-ready', left + 40, vy + 95);
  ctx.font = `500 34px ${FONT}`;
  ctx.fillText(`${d.met} sa ${d.total} na target ang pasado`, left + 40, vy + 155);
  // The belt earned (up to this assessment), inside the verdict box.
  drawBelt(ctx, left + 36, vy + 185, 64, d.belt.color, C.ink);
  ctx.fillStyle = C.muted;
  ctx.font = `500 26px ${FONT}`;
  ctx.fillText('Belt', left + 116, vy + 215);
  ctx.fillStyle = C.ink;
  ctx.font = `800 32px ${FONT}`;
  ctx.fillText(d.belt.label, left + 116, vy + 252);

  // The stamp, a bit smaller, at the right so it never covers the title.
  ctx.save();
  ctx.translate(right - 160, vy + 150);
  ctx.scale(0.85, 0.85);
  ctx.rotate((-8 * Math.PI) / 180);
  const stampColor = d.ready ? C.green : C.amber;
  ctx.strokeStyle = stampColor;
  ctx.lineWidth = 6;
  roundRect(ctx, -150, -52, 300, 104, 14);
  ctx.stroke();
  ctx.lineWidth = 2;
  roundRect(ctx, -140, -42, 280, 84, 10);
  ctx.stroke();
  ctx.fillStyle = stampColor;
  ctx.font = `900 50px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(d.ready ? 'PASADO' : 'HINDI PA', 0, 4);
  ctx.restore();
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';

  // Scorecard: one box per part, one column per target
  let y = 540;
  ctx.fillStyle = C.muted;
  ctx.font = `700 28px ${FONT}`;
  ctx.fillText('Scorecard', left, y + 20);
  y += 42;
  // Five parts (with QC) need a little less height per box to stay above the footer.
  const boxH = d.parts.length > 4 ? 112 : 128;
  const gap = d.parts.length > 4 ? 12 : 14;
  for (const part of d.parts) {
    ctx.fillStyle = C.white;
    roundRect(ctx, left, y, right - left, boxH, 20);
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = part.passed ? C.greenLine : C.redLine;
    ctx.stroke();

    ctx.fillStyle = C.ink;
    ctx.font = `800 34px ${FONT}`;
    ctx.fillText(part.title, left + 32, y + (boxH > 120 ? 48 : 42));
    ctx.textAlign = 'right';
    ctx.fillStyle = part.passed ? C.green : C.red;
    ctx.font = `700 28px ${FONT}`;
    ctx.fillText(part.passed ? 'Pasado' : 'Hindi pa', right - 32, y + (boxH > 120 ? 48 : 42));
    ctx.textAlign = 'left';

    const colW = (right - left - 64) / 2;
    part.checks.forEach((c, i) => {
      const cx = left + 32 + i * colW;
      const cy = y + boxH - 28;
      ctx.fillStyle = c.pass ? C.green : C.red;
      ctx.font = `800 32px ${FONT}`;
      ctx.fillText(c.pass ? '✓' : '✗', cx, cy);
      ctx.fillStyle = C.ink;
      ctx.font = `800 32px ${FONT}`;
      const vx = cx + 34;
      ctx.fillText(c.value, vx, cy);
      const vw = ctx.measureText(c.value).width;
      ctx.fillStyle = C.faint;
      ctx.font = `500 24px ${FONT}`;
      ctx.fillText(` / ${c.target}  ${c.label}`, vx + vw, cy);
    });
    y += boxH + gap;
  }

  // Footer: this is a practice result, not an official certificate
  ctx.fillStyle = C.faint;
  ctx.font = `500 22px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.fillText('Practice result — self-assessed, hindi opisyal na certificate', W / 2, CARD_HEIGHT - 70);
  ctx.fillText('encodojo.vercel.app', W / 2, CARD_HEIGHT - 38);
  ctx.textAlign = 'left';
}

/** Draws the card and downloads it as a PNG file. */
export function downloadResultCard(d: ResultCardData, fileDate: string) {
  const canvas = document.createElement('canvas');
  canvas.width = CARD_WIDTH;
  canvas.height = CARD_HEIGHT;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  drawResultCard(ctx, d);
  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `encodojo-assessment-${fileDate}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 2000);
  }, 'image/png');
}
