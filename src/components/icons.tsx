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
export const Logo = ({ className = 'h-11 w-11' }: IconProps) => (
  <svg viewBox="0 0 48 48" aria-hidden="true" className={className}>
    <rect width="48" height="48" rx="12" fill="#F5B301" />
    {/* belt going across */}
    <rect x="5" y="17" width="38" height="8" rx="2" fill="#231F55" />
    {/* the two hanging ends */}
    <path d="M21.5 27 L15 40 h5.5 L24.5 30 Z" fill="#231F55" />
    <path d="M26.5 27 L33 40 h-5.5 L23.5 30 Z" fill="#231F55" />
    {/* the knot, outlined in gold so it stands out from the belt */}
    <rect x="18.5" y="14" width="11" height="14" rx="3" fill="#231F55" stroke="#F5B301" strokeWidth="2" />
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
