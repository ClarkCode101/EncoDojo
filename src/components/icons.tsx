/**
 * Simple line icons drawn with SVG (no icon library needed).
 * They use `currentColor`, so they take the text color of their parent.
 * Always decorative: the text next to them says what they mean.
 */
import type { ReactNode } from 'react';

function Icon({ children, className = 'h-6 w-6' }: { children: ReactNode; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      {children}
    </svg>
  );
}

type IconProps = { className?: string };

/**
 * The EncoDojo logo: a tied martial-arts belt on a gold tile.
 * Colors match `belt-400` and `brand-900` in tailwind.config.js.
 */
/**
 * The EncoDojo logo (owner's choice 2026-10-01, easier to remember than the old belt on a gold tile):
 * an "E" keycap (E for EncoDojo; a key = keyboard skills) with a gold belt tied around it (the dojo).
 * The light lavender side with a dark outline shows on the dark sidebar and on light pages alike.
 * Same drawing in public/favicon.svg and in the result card (features/assessment/resultCard.ts).
 */
export const Logo = ({ className = 'h-11 w-11' }: IconProps) => (
  <svg viewBox="0 0 48 48" aria-hidden="true" className={className}>
    {/* the key: its side, then its top face */}
    <rect x="4" y="5" width="40" height="38" rx="9" fill="#B9B5E6" stroke="#231F55" strokeWidth="1.5" />
    <rect x="8" y="7" width="32" height="29" rx="6" fill="#FBF8F1" stroke="#231F55" strokeWidth="1" />
    {/* the letter E */}
    <g fill="#2E2A6B">
      <rect x="16" y="11" width="5" height="18" rx="1" />
      <rect x="16" y="11" width="16" height="4.5" rx="1" />
      <rect x="16" y="17.75" width="12.5" height="4.5" rx="1" />
      <rect x="16" y="24.5" width="16" height="4.5" rx="1" />
    </g>
    {/* the gold belt tied around the key: the band, the two hanging ends, the knot */}
    <g fill="#F5B301" stroke="#231F55" strokeWidth="1.5" strokeLinejoin="round">
      <rect x="1.5" y="32" width="45" height="6.5" rx="1.5" />
      <path d="M21 39 L16.5 46.5 h5 L24 41.5 Z" />
      <path d="M27 39 L31.5 46.5 h-5 L24 41.5 Z" />
      <rect x="19" y="29.5" width="10" height="11.5" rx="2.5" />
    </g>
  </svg>
);

/**
 * A tied belt in any color (same shape as the logo), for the belt ranks.
 * The light outline keeps every belt (even black) visible on the dark sidebar.
 */
export const BeltIcon = ({ className = 'h-10 w-10', color }: IconProps & { color: string }) => (
  <svg viewBox="0 0 48 48" aria-hidden="true" className={className}>
    <g fill={color} stroke="#FBF8F1" strokeWidth="1.5" strokeLinejoin="round">
      <rect x="3" y="17" width="42" height="8" rx="2" />
      <path d="M21.5 27 L15 40 h5.5 L24.5 30 Z" />
      <path d="M26.5 27 L33 40 h-5.5 L23.5 30 Z" />
      <rect x="18.5" y="14" width="11" height="14" rx="3" />
    </g>
  </svg>
);

export const HomeIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M3 11l9-8 9 8" />
    <path d="M5 10v10h5v-6h4v6h5V10" />
  </Icon>
);

export const AssessmentIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M9 3h6v3H9z" />
    <path d="M8 4.5H5v16.5h14V4.5h-3" />
    <path d="M9 14l2 2 4-4" />
  </Icon>
);

export const KeyboardIcon = (p: IconProps) => (
  <Icon {...p}>
    <rect x="2" y="6" width="20" height="12" rx="2" />
    <path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M7 14h10" />
  </Icon>
);

export const NumpadIcon = (p: IconProps) => (
  <Icon {...p}>
    <rect x="5" y="2" width="14" height="20" rx="2" />
    <path d="M8 6h8v4H8z" />
    <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01" />
  </Icon>
);

/** Two sheets: copying from one record to another. */
export const CopyIcon = (p: IconProps) => (
  <Icon {...p}>
    <rect x="8" y="8" width="12" height="13" rx="2" />
    <path d="M16 8V5a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h2" />
    <path d="M11 12h6M11 15h6M11 18h3" />
  </Icon>
);

/** A document with a folded corner and lines: encoding from paper documents. */
export const DocumentIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
    <path d="M14 3v5h5" />
    <path d="M9 12h6M9 15h6M9 18h4" />
  </Icon>
);

/** A magnifying glass with a check: QC / checking someone else's work. */
export const QcIcon = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="10.5" cy="10.5" r="6.5" />
    <path d="M15.5 15.5L21 21" />
    <path d="M7.5 10.5l2 2 3.5-3.5" />
  </Icon>
);

/** A small table with a header row: Excel / spreadsheets. */
export const ExcelIcon = (p: IconProps) => (
  <Icon {...p}>
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <path d="M3 9h18M3 14.5h18M9 9v11M15 9v11" />
  </Icon>
);

/** A panel with an arrow: "hide the sidebar" (arrow left) or "show it" (arrow right). */
export const SidebarToggleIcon = ({ className = 'h-6 w-6', open }: IconProps & { open: boolean }) => (
  <Icon className={className}>
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <path d="M9 4v16" />
    <path d={open ? 'M16 10l-2 2 2 2' : 'M14 10l2 2-2 2'} />
  </Icon>
);

/** Arrow down into a tray: "download / save a file". */
export const DownloadIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12 4v11" />
    <path d="M7 10l5 5 5-5" />
    <path d="M5 19h14" />
  </Icon>
);

export const SettingsIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M4 6h9M17 6h3M4 12h3M11 12h9M4 18h11M19 18h1" />
    <circle cx="15" cy="6" r="2" />
    <circle cx="9" cy="12" r="2" />
    <circle cx="17" cy="18" r="2" />
  </Icon>
);

export const StarIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z" />
  </Icon>
);

export const XIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M6 6l12 12M18 6L6 18" />
  </Icon>
);

export const ArrowRightIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </Icon>
);

export const InfoIcon = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 11v5M12 8h.01" />
  </Icon>
);

export const ClockIcon = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </Icon>
);

export const CheckIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M5 12l5 5L20 7" />
  </Icon>
);
