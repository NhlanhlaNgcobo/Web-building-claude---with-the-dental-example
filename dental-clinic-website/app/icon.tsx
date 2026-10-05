import { ImageResponse } from 'next/og';

export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

/**
 * Favicon: the monogram reduced to its essentials.
 *
 * At 32 pixels the smile arc and both stems still read, but the stroke weights
 * are heavier than the full logo because thin strokes disappear at this size.
 */
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0a0b0d',
          borderRadius: 6,
        }}
      >
        <svg width="24" height="24" viewBox="0 0 32 32" fill="none">
          <rect x="4" y="5" width="4" height="22" rx="2" fill="#145cff" />
          <rect x="24" y="5" width="4" height="22" rx="2" fill="#145cff" />
          <path
            d="M8 14c0 5.2 3.6 8.6 8 8.6s8-3.4 8-8.6"
            stroke="#145cff"
            strokeWidth="4"
            strokeLinecap="round"
          />
        </svg>
      </div>
    ),
    size,
  );
}
