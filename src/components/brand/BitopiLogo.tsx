import React from 'react';

interface BitopiLogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
  variant?: 'full' | 'icon' | 'badge';
}

/**
 * Official Bitopi Group Brand Emblem & Wordmark
 * Precise geometric vector representation of the Bitopi Group company icon
 */
export const BitopiLogo: React.FC<BitopiLogoProps> = ({
  className = '',
  size = 36,
  showText = true,
  variant = 'full',
}) => {
  // Olive-taupe brand color from official logo: #756D5F
  const brandColor = '#6E6659';

  if (variant === 'icon') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`shrink-0 ${className}`}
        aria-label="Bitopi Group Emblem"
      >
        {/* Outer Circular Arc with Right Opening (approx 60 deg opening) */}
        {/* Arc from angle 28 deg to 332 deg: center (50, 50), radius 42 */}
        {/* Path starts at (87, 70), arcs around left to (87, 30), lines to center (50, 50), lines to (87, 70) */}
        <path
          d="M 87.0 30.2 A 42 42 0 1 0 87.0 69.8 L 48.0 50.0 Z"
          stroke={brandColor}
          strokeWidth="6"
          strokeLinejoin="round"
          strokeLinecap="round"
          fill="none"
        />

        {/* Inner Wedge Triangle: Apex pointing left towards (48, 50), base on right */}
        <path
          d="M 52.0 50.0 L 82.5 35.5 L 82.5 64.5 Z"
          fill={brandColor}
          stroke={brandColor}
          strokeWidth="2"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      {/* Emblem SVG */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0"
        aria-label="Bitopi Group Logo Emblem"
      >
        {/* Outer Arc */}
        <path
          d="M 87.0 30.2 A 42 42 0 1 0 87.0 69.8 L 48.0 50.0 Z"
          stroke={brandColor}
          strokeWidth="6.5"
          strokeLinejoin="round"
          strokeLinecap="round"
          fill="none"
        />

        {/* Inner Inset Triangle */}
        <path
          d="M 53.0 50.0 L 82.5 36.0 L 82.5 64.0 Z"
          fill={brandColor}
          stroke={brandColor}
          strokeWidth="2"
          strokeLinejoin="round"
        />
      </svg>

      {/* Brand Typography */}
      {showText && (
        <div className="flex flex-col justify-center select-none">
          <span
            className="font-bold tracking-tight text-[15px] leading-none"
            style={{ color: brandColor, fontFamily: 'Inter, system-ui, sans-serif' }}
          >
            Bitopi Group
          </span>
          <div
            className="h-[1.5px] w-full mt-1 rounded-full opacity-60"
            style={{ backgroundColor: brandColor }}
          />
        </div>
      )}
    </div>
  );
};
