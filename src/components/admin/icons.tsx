/** Inline SVG rather than emoji, so every control shares one weight and colour. */

function Svg({ children }: { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-4"
      aria-hidden
    >
      {children}
    </svg>
  );
}

export const BulletListIcon = () => (
  <Svg>
    <path d="M6 4h7M6 8h7M6 12h7" />
    <circle cx="3" cy="4" r="0.9" fill="currentColor" stroke="none" />
    <circle cx="3" cy="8" r="0.9" fill="currentColor" stroke="none" />
    <circle cx="3" cy="12" r="0.9" fill="currentColor" stroke="none" />
  </Svg>
);

export const NumberListIcon = () => (
  <Svg>
    <path d="M7 4h6M7 8h6M7 12h6" />
    <path d="M2.2 3.2 3.2 2.8V5.4" strokeWidth="1.2" />
    <path d="M2 7.4c.9-.7 1.9-.2 1.7.6-.1.6-1.6 1-1.7 1.7h1.9" strokeWidth="1.2" />
    <path d="M2.1 11.2h1.6l-1 1.1c.7 0 1.1.3 1.1.8s-.5.9-1.7.6" strokeWidth="1.2" />
  </Svg>
);

export const TaskIcon = () => (
  <Svg>
    <rect x="2" y="2.6" width="5.2" height="5.2" rx="1.2" />
    <path d="M3.4 5.2 4.4 6.2 6 4.3" strokeWidth="1.2" />
    <path d="M9.5 5.2H14M2 11.5h12" />
  </Svg>
);

export const QuoteIcon = () => (
  <Svg>
    <path d="M2.5 3v10" strokeWidth="2" />
    <path d="M6 5h7.5M6 8h7.5M6 11h4.5" />
  </Svg>
);

export const LinkIcon = () => (
  <Svg>
    <path d="M6.6 9.4a2.6 2.6 0 0 0 3.9.3l2-2a2.6 2.6 0 0 0-3.7-3.7l-1.1 1.1" />
    <path d="M9.4 6.6a2.6 2.6 0 0 0-3.9-.3l-2 2a2.6 2.6 0 0 0 3.7 3.7l1.1-1.1" />
  </Svg>
);

export const CodeIcon = () => (
  <Svg>
    <path d="M5.5 4.5 2 8l3.5 3.5M10.5 4.5 14 8l-3.5 3.5" />
  </Svg>
);

export const CodeBlockIcon = () => (
  <Svg>
    <rect x="1.75" y="2.75" width="12.5" height="10.5" rx="1.75" />
    <path d="M6.2 6.4 4.6 8l1.6 1.6M9.8 6.4 11.4 8l-1.6 1.6" strokeWidth="1.2" />
  </Svg>
);

export const DividerIcon = () => (
  <Svg>
    <path d="M2 8h12" />
    <path d="M3.5 4.5h9M3.5 11.5h9" opacity="0.35" />
  </Svg>
);

export const ImageIcon = () => (
  <Svg>
    <rect x="1.75" y="2.75" width="12.5" height="10.5" rx="1.75" />
    <circle cx="5.6" cy="6.3" r="1.1" />
    <path d="m2.5 11.5 3-3 2.6 2.6 2-2 3.4 3.4" />
  </Svg>
);
