import { ImageResponse } from 'next/og';
import { store } from '@/data/store';

/**
 * The social sharing card.
 *
 * White, like the rest of the site, with the mark doing the work. Deliberately
 * not a collage of product photographs: those date the moment stock changes,
 * and a link shared in a WhatsApp group should look like the shop rather than
 * like a particular phone.
 *
 * The independence line is on the card as well, because a shared link is often
 * somebody's first contact with us and it should not leave the impression that
 * we are Apple.
 */
export const alt = `${store.name}, refurbished Apple devices in South Africa`;
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: '#ffffff',
          padding: '72px 80px',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <svg width="76" height="76" viewBox="0 0 64 64" fill="none">
            <path
              d="M32 19c-5-8-16-9-21-2-6 8-4 24 3 34 4 6 9 8 13 6 3-1 7-1 10 0 4 2 9 0 13-6 7-10 9-26 3-34-5-7-16-6-21 2Z"
              fill="#E11D2E"
            />
            <path
              d="M31.5 13.5c2-5.5 7.5-9 14-9 .8 0 1.3.8 1 1.5-2.4 5.8-7.6 9.4-13.8 9.4-.9 0-1.5-1-1.2-1.9Z"
              fill="#2F8F23"
            />
            <path
              d="M31 20c-.6-4-1.4-7.6-3.4-10.4"
              stroke="#7B4A1E"
              strokeWidth="3.4"
              strokeLinecap="round"
            />
          </svg>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div
              style={{
                fontSize: 20,
                fontWeight: 600,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: '#64696f',
              }}
            >
              The
            </div>
            <div style={{ fontSize: 40, fontWeight: 800, color: '#0d1117' }}>
              Apple Bros
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              fontSize: 76,
              fontWeight: 800,
              lineHeight: 1.05,
              color: '#0d1117',
              letterSpacing: '-0.03em',
            }}
          >
            Apple, without the
          </div>
          <div
            style={{
              fontSize: 76,
              fontWeight: 800,
              lineHeight: 1.05,
              color: '#e11d2e',
              letterSpacing: '-0.03em',
            }}
          >
            Apple price.
          </div>
          <div
            style={{
              marginTop: 28,
              fontSize: 26,
              color: '#42474d',
              lineHeight: 1.4,
            }}
          >
            Graded, tested and guaranteed. Published condition grades, stated
            battery health, twelve months of cover.
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderTop: '1px solid #e4e4e7',
            paddingTop: 24,
            fontSize: 18,
            color: '#64696f',
          }}
        >
          <div>theapplebros.co.za</div>
          <div>An independent retailer. Not affiliated with Apple Inc.</div>
        </div>
      </div>
    ),
    size,
  );
}
