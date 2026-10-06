import { ImageResponse } from 'next/og';

/**
 * The favicon.
 *
 * Generated rather than shipped as a file, so it is always in step with the
 * brand colours. At 32 pixels the apple has to be simplified: the highlight
 * band and the stem shading disappear entirely, because at this size they turn
 * into noise. The silhouette plus the leaf is what makes it recognisable in a
 * tab strip.
 */
export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

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
          background: '#ffffff',
        }}
      >
        <svg width="30" height="30" viewBox="0 0 64 64" fill="none">
          <path
            d="M32 19c-5-8-16-9-21-2-6 8-4 24 3 34 4 6 9 8 13 6 3-1 7-1 10 0 4 2 9 0 13-6 7-10 9-26 3-34-5-7-16-6-21 2Z"
            fill="#E11D2E"
          />
          <path
            d="M31.5 13.5c2-5.5 7.5-9 14-9 .8 0 1.3.8 1 1.5-2.4 5.8-7.6 9.4-13.8 9.4-.9 0-1.5-1-1.2-1.9Z"
            fill="#2F8F23"
          />
        </svg>
      </div>
    ),
    size,
  );
}
