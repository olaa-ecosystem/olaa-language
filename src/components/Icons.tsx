import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function base({ size = 22, ...rest }: IconProps): SVGProps<SVGSVGElement> {
  return {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    'aria-hidden': true,
    focusable: false,
    ...rest,
  };
}

export const FlameIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path
      fill="currentColor"
      d="M12 2c.6 3-1.6 4.6-2.9 6.4C7.6 10.5 6 12.4 6 15a6 6 0 0 0 12 0c0-2.3-1-4-2.1-5.2-.2 1.5-1 2.6-2.2 3 .4-3.4-.4-7.7-1.7-10.8Z"
    />
    <path
      fill="#fff"
      opacity=".55"
      d="M12 21a3 3 0 0 1-3-3c0-1.7 1.4-2.8 2.4-4 .2 1.2.9 2 1.8 2.3.6.2 1.8 1 1.8 1.9a3 3 0 0 1-3 2.8Z"
    />
  </svg>
);

export const HeartIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path
      fill="currentColor"
      d="M12 21s-7.5-4.6-9.6-9.3C.9 8.3 3 4.5 6.6 4.5c2.1 0 3.6 1.1 5.4 3.1 1.8-2 3.3-3.1 5.4-3.1 3.6 0 5.7 3.8 4.2 7.2C19.5 16.4 12 21 12 21Z"
    />
    <ellipse cx="7.5" cy="8.5" rx="1.6" ry="1.1" fill="#fff" opacity=".5" />
  </svg>
);

export const BoltIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path fill="currentColor" d="M13.5 2 4 13.5h6.5L9.5 22 20 9.5h-6.8L13.5 2Z" />
  </svg>
);

export const LockIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path
      fill="currentColor"
      d="M7 10V8a5 5 0 0 1 10 0v2h.5A1.5 1.5 0 0 1 19 11.5v8a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 5 19.5v-8A1.5 1.5 0 0 1 6.5 10H7Zm2 0h6V8a3 3 0 0 0-6 0v2Z"
    />
  </svg>
);

export const CheckIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path
      fill="none"
      stroke="currentColor"
      strokeWidth="3.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      d="m5 12.5 4.5 4.5L19 7.5"
    />
  </svg>
);

export const StarIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path
      fill="currentColor"
      d="m12 2.8 2.7 5.6 6.1.8-4.5 4.3 1.1 6.1L12 16.7l-5.4 2.9 1.1-6.1-4.5-4.3 6.1-.8L12 2.8Z"
    />
  </svg>
);

export const SpeakerIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path fill="currentColor" d="M4 9h3.5L12 5v14l-4.5-4H4a1 1 0 0 1-1-1v-4a1 1 0 0 1 1-1Z" />
    <path
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11"
    />
  </svg>
);

export const TurtleIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path fill="currentColor" d="M3 15a8 8 0 0 1 16 0H3Z" />
    <circle cx="20.5" cy="13" r="2.2" fill="currentColor" />
    <rect x="5" y="15" width="3" height="4" rx="1.5" fill="currentColor" />
    <rect x="14" y="15" width="3" height="4" rx="1.5" fill="currentColor" />
  </svg>
);

export const CloseIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" d="M6 6l12 12M18 6 6 18" />
  </svg>
);

export const HomeIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path
      fill="currentColor"
      d="M3 11.2 12 3l9 8.2V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1v-8.8Z"
    />
  </svg>
);

export const DumbbellIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="2" y="9" width="3" height="6" rx="1" fill="currentColor" />
    <rect x="5" y="6.5" width="3.5" height="11" rx="1.2" fill="currentColor" />
    <rect x="8.5" y="11" width="7" height="2" fill="currentColor" />
    <rect x="15.5" y="6.5" width="3.5" height="11" rx="1.2" fill="currentColor" />
    <rect x="19" y="9" width="3" height="6" rx="1" fill="currentColor" />
  </svg>
);

export const CardsIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="7" y="3" width="13" height="16" rx="2.5" fill="currentColor" opacity=".45" />
    <rect x="4" y="5" width="13" height="16" rx="2.5" fill="currentColor" />
  </svg>
);

export const UserIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="12" cy="8" r="4.2" fill="currentColor" />
    <path fill="currentColor" d="M4 20.5c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5V21H4v-.5Z" />
  </svg>
);

export const LadderIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      d="M5 21h4v-5h4v-5h4V6h3"
    />
  </svg>
);

export const BookIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinejoin="round"
      d="M4 5.5C6.5 4 9.5 4 12 6c2.5-2 5.5-2 8-.5V19c-2.5-1.5-5.5-1.5-8 .5-2.5-2-5.5-2-8-.5Z M12 6v13.5"
    />
  </svg>
);
