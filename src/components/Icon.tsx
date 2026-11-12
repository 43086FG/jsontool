import React from 'react';

export type IconName =
  | 'braces'
  | 'cube'
  | 'layers'
  | 'tag'
  | 'chevron'
  | 'plus'
  | 'globe'
  | 'gear'
  | 'close'
  | 'open'
  | 'pencil'
  | 'trash'
  | 'export'
  | 'check'
  | 'copy'
  | 'insert'
  | 'file'
  | 'code'
  | 'tree'
  | 'folder'
  | 'warning'
  | 'info';

interface IconProps {
  name: IconName;
  size?: number;
  className?: string;
  strokeWidth?: number;
}

const paths: Record<IconName, React.ReactNode> = {
  braces: (
    <>
      <path d="M9 3.5H7.2A2.7 2.7 0 0 0 4.5 6.2v2.6A2.7 2.7 0 0 1 1.8 11.5a2.7 2.7 0 0 1 2.7 2.7v2.6a2.7 2.7 0 0 0 2.7 2.7H9" />
      <path d="M15 3.5h1.8a2.7 2.7 0 0 1 2.7 2.7v2.6a2.7 2.7 0 0 0 2.7 2.7 2.7 2.7 0 0 0-2.7 2.7v2.6a2.7 2.7 0 0 1-2.7 2.7H15" />
    </>
  ),
  cube: (
    <>
      <path d="M12 2.6 20 7v10l-8 4.4L4 17V7l8-4.4Z" />
      <path d="M4 7l8 4.5L20 7" />
      <path d="M12 11.5V21" />
    </>
  ),
  layers: (
    <>
      <path d="M12 3 21 7.5 12 12 3 7.5 12 3Z" />
      <path d="M3 12l9 4.5 9-4.5" />
      <path d="M3 16.5 12 21l9-4.5" />
    </>
  ),
  tag: (
    <>
      <path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8Z" />
      <circle cx="7.4" cy="7.4" r="1.1" />
    </>
  ),
  chevron: <path d="M9 5.5 15.5 12 9 18.5" />,
  plus: <path d="M12 5v14M5 12h14" />,
  globe: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18" />
      <path d="M12 3c2.6 2.6 3.9 5.6 3.9 9s-1.3 6.4-3.9 9c-2.6-2.6-3.9-5.6-3.9-9S9.4 5.6 12 3Z" />
    </>
  ),
  gear: (
    <>
      <circle cx="12" cy="12" r="3.1" />
      <path d="M19.4 14.6a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5v.2a2 2 0 1 1-4 0v-.1a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3.2a2 2 0 1 1 0-4h.1a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3h.1a1.6 1.6 0 0 0 1-1.5V3.2a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8v.1a1.6 1.6 0 0 0 1.5 1h.2a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1Z" />
    </>
  ),
  close: <path d="M6 6l12 12M18 6 6 18" />,
  open: (
    <>
      <path d="M14 4h6v6" />
      <path d="M20 4l-9 9" />
      <path d="M18 14v4.5a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 4 18.5v-11A1.5 1.5 0 0 1 5.5 6H10" />
    </>
  ),
  pencil: (
    <>
      <path d="M4 20h4L20 8l-4-4L4 16v4Z" />
      <path d="M14 6l4 4" />
    </>
  ),
  trash: (
    <>
      <path d="M4 7h16" />
      <path d="M9.5 7V4h5v3" />
      <path d="M6.5 7l.9 12.1A1 1 0 0 0 8.4 20h7.2a1 1 0 0 0 1-1l.9-12" />
      <path d="M10 11v5M14 11v5" />
    </>
  ),
  export: (
    <>
      <path d="M12 3.5v12" />
      <path d="M7.5 10.5 12 15l4.5-4.5" />
      <path d="M4.5 19.5h15" />
    </>
  ),
  check: <path d="M4.5 12.5 9.5 17.5 20 6.5" />,
  copy: (
    <>
      <rect x="8.5" y="8.5" width="11.5" height="11.5" rx="2.5" />
      <path d="M15.5 8.5V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v7.5a2 2 0 0 0 2 2h2.5" />
    </>
  ),
  insert: (
    <>
      <rect x="3.5" y="3.5" width="17" height="17" rx="4" />
      <path d="M12 8v8M8 12h8" />
    </>
  ),
  file: (
    <>
      <path d="M6 3.5h7.5L19 9v11.5H6z" />
      <path d="M13.5 3.5V9H19" />
    </>
  ),
  code: <path d="M8.5 7.5 3.5 12l5 4.5M15.5 7.5l5 4.5-5 4.5" />,
  tree: (
    <>
      <path d="M4 6h4M4 12h4M4 18h4" />
      <path d="M10 6h10M10 12h10M10 18h10" />
    </>
  ),
  folder: (
    <path d="M3 7.5A2.5 2.5 0 0 1 5.5 5h3.2l2 2h7.8A2.5 2.5 0 0 1 21 9.5v7A2.5 2.5 0 0 1 18.5 19h-13A2.5 2.5 0 0 1 3 16.5v-9Z" />
  ),
  warning: (
    <>
      <path d="M12 3.5 21.5 20h-19L12 3.5Z" />
      <path d="M12 9.5v4.5" />
      <circle cx="12" cy="17.2" r="0.9" fill="currentColor" stroke="none" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v6" />
      <circle cx="12" cy="7.8" r="0.9" fill="currentColor" stroke="none" />
    </>
  ),
};

export function Icon({ name, size = 20, className = '', strokeWidth = 1.7 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      {paths[name]}
    </svg>
  );
}
