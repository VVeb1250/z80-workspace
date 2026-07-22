export type IconName =
  | "panel-left"
  | "circuit"
  | "hammer"
  | "download"
  | "import"
  | "export"
  | "play"
  | "stop"
  | "plus"
  | "file-code"
  | "pencil"
  | "trash"
  | "maximize"
  | "restore"
  | "chevron-down"
  | "chevron-up"
  | "terminal"
  | "check-circle"
  | "alert-circle"
  | "loader"
  | "lock"
  | "file"
  | "book-open"
  | "search"
  | "settings"
  | "x";

interface IconProps {
  name: IconName;
  size?: number;
  className?: string;
}

export function Icon({ name, size = 18, className = "" }: IconProps) {
  const paths: Record<IconName, React.ReactNode> = {
    "panel-left": (
      <>
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="M9 3v18M6 8h.01M6 12h.01M6 16h.01" />
      </>
    ),
    circuit: (
      <>
        <rect x="5" y="5" width="14" height="14" rx="2" />
        <path d="M9 9h6v6H9zM9 2v3m6-3v3M9 19v3m6-3v3M2 9h3m-3 6h3m14-6h3m-3 6h3" />
      </>
    ),
    hammer: (
      <>
        <path d="m15 4 5 5-3 3-5-5zM13.5 8.5 5 17l2 2 8.5-8.5" />
        <path d="m3 19 2 2" />
      </>
    ),
    download: (
      <>
        <path d="M12 3v12m0 0 4-4m-4 4-4-4" />
        <path d="M5 19h14" />
      </>
    ),
    import: (
      <>
        <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
        <path d="M12 3v12m0 0-4-4m4 4 4-4" />
      </>
    ),
    export: (
      <>
        <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
        <path d="M12 15V3m0 0-4 4m4-4 4 4" />
      </>
    ),
    play: <path d="m9 7 8 5-8 5z" fill="currentColor" stroke="none" />,
    stop: <rect x="8" y="8" width="8" height="8" rx="1" fill="currentColor" stroke="none" />,
    plus: <path d="M12 5v14M5 12h14" />,
    "file-code": (
      <>
        <path d="M6 3h8l4 4v14H6zM14 3v5h5" />
        <path d="m10 12-2 2 2 2m4-4 2 2-2 2" />
      </>
    ),
    pencil: (
      <>
        <path d="m4 20 4.2-1 10.6-10.6-3.2-3.2L5 15.8z" />
        <path d="m14.5 6.5 3 3" />
      </>
    ),
    trash: (
      <>
        <path d="M4 7h16M9 3h6l1 4H8zM7 7l1 14h8l1-14M10 11v6m4-6v6" />
      </>
    ),
    maximize: <path d="M8 3H3v5m13-5h5v5M8 21H3v-5m13 5h5v-5" />,
    restore: (
      <>
        <rect x="5" y="7" width="12" height="12" rx="1" />
        <path d="M8 7V4h12v12h-3" />
      </>
    ),
    "chevron-down": <path d="m7 10 5 5 5-5" />,
    "chevron-up": <path d="m7 14 5-5 5 5" />,
    terminal: (
      <>
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <path d="m7 9 3 3-3 3m6 0h4" />
      </>
    ),
    "check-circle": (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="m8 12 2.5 2.5L16 9" />
      </>
    ),
    "alert-circle": (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v6m0 4h.01" />
      </>
    ),
    loader: <path d="M21 12a9 9 0 1 1-6.2-8.6" />,
    lock: (
      <>
        <rect x="5" y="10" width="14" height="11" rx="2" />
        <path d="M8 10V7a4 4 0 0 1 8 0v3" />
      </>
    ),
    file: (
      <>
        <path d="M6 3h8l4 4v14H6zM14 3v5h5" />
      </>
    ),
    "book-open": (
      <>
        <path d="M4 5.5A3.5 3.5 0 0 1 7.5 4H11v16H7.5A3.5 3.5 0 0 0 4 21.5z" />
        <path d="M20 5.5A3.5 3.5 0 0 0 16.5 4H13v16h3.5a3.5 3.5 0 0 1 3.5 1.5z" />
      </>
    ),
    search: (
      <>
        <circle cx="11" cy="11" r="6" />
        <path d="m16 16 4 4" />
      </>
    ),
    settings: (
      <>
        <path d="M4 7h9m4 0h3M4 12h3m4 0h9M4 17h7m4 0h5" />
        <circle cx="15" cy="7" r="2" />
        <circle cx="9" cy="12" r="2" />
        <circle cx="13" cy="17" r="2" />
      </>
    ),
    x: <path d="M6 6l12 12M18 6 6 18" />,
  };

  return (
    <svg
      aria-hidden="true"
      className={`icon ${className}`}
      fill="none"
      focusable="false"
      height={size}
      viewBox="0 0 24 24"
      width={size}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
    >
      {paths[name]}
    </svg>
  );
}
