import type { JsonType } from '../lib/types';

/**
 * Data-node icons follow the reference screenshots: the container blue sampled
 * from the cube / stack icons is #1A87FF. Containers use a folder, leaves use a
 * plain document outline.
 */
export const CONTAINER_BLUE = '#1A87FF';

interface TypeIconProps {
  type: JsonType;
  size?: number;
  className?: string;
}

export function TypeIcon({ type, size = 18, className = '' }: TypeIconProps) {
  if (type === 'object') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden="true">
        <path
          d="M2.75 7.1A2.35 2.35 0 0 1 5.1 4.75h3.2c.62 0 1.22.25 1.66.69l1.3 1.3h7.64A2.35 2.35 0 0 1 21.25 9.1v7.55a2.35 2.35 0 0 1-2.35 2.35H5.1a2.35 2.35 0 0 1-2.35-2.35V7.1Z"
          fill={CONTAINER_BLUE}
        />
        <path d="M2.75 9.4h18.5" stroke="#FFFFFF" strokeOpacity="0.35" strokeWidth="1.2" />
      </svg>
    );
  }

  if (type === 'array') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden="true">
        <path
          d="M2.75 7.1A2.35 2.35 0 0 1 5.1 4.75h3.2c.62 0 1.22.25 1.66.69l1.3 1.3h7.64A2.35 2.35 0 0 1 21.25 9.1v7.55a2.35 2.35 0 0 1-2.35 2.35H5.1a2.35 2.35 0 0 1-2.35-2.35V7.1Z"
          fill={CONTAINER_BLUE}
        />
        <path
          d="M7.4 10.9h9.2M7.4 13.6h9.2M7.4 16.3h5.6"
          stroke="#FFFFFF"
          strokeWidth="1.35"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        d="M6.2 3.6h7.1l4.5 4.5v12.3H6.2V3.6Z"
        fill="none"
        stroke={CONTAINER_BLUE}
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path
        d="M13.3 3.6v4.6h4.5"
        fill="none"
        stroke={CONTAINER_BLUE}
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  );
}
