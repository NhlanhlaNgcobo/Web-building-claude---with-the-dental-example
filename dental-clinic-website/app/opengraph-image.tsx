import { ImageResponse } from 'next/og';
import { clinic } from '@/data/clinic';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const alt = `${clinic.name}, a dental practice in Durban`;

/**
 * Share card. Near black, one blue accent, the wordmark and the location.
 * No photography, because a cropped stock photo at this aspect ratio reads
 * worse than clean type.
 */
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
          background: '#0a0b0d',
          padding: 72,
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <svg width="56" height="56" viewBox="0 0 32 32" fill="none">
            <rect x="4" y="5" width="3.4" height="22" rx="1.7" fill="#145cff" />
            <rect x="24.6" y="5" width="3.4" height="22" rx="1.7" fill="#145cff" />
            <path
              d="M7.4 14.2c0 5.2 3.8 8.4 8.6 8.4s8.6-3.2 8.6-8.4"
              stroke="#145cff"
              strokeWidth="3.4"
              strokeLinecap="round"
            />
          </svg>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ color: '#ffffff', fontSize: 30, fontWeight: 600 }}>
              Harbour Dental
            </span>
            <span
              style={{
                color: 'rgba(255,255,255,0.55)',
                fontSize: 15,
                letterSpacing: 4,
                textTransform: 'uppercase',
              }}
            >
              Studio
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <span
            style={{
              color: '#ffffff',
              fontSize: 76,
              lineHeight: 1.05,
              fontWeight: 600,
              maxWidth: 900,
            }}
          >
            Confident dental care in Durban.
          </span>
          <span
            style={{
              color: 'rgba(255,255,255,0.6)',
              fontSize: 26,
              maxWidth: 820,
            }}
          >
            Clear treatment plans, published fees and real appointment
            availability online.
          </span>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            color: 'rgba(255,255,255,0.5)',
            fontSize: 22,
          }}
        >
          <span>{clinic.address.line2}</span>
          <span style={{ color: '#145cff' }}>&middot;</span>
          <span>
            {clinic.address.suburb}, {clinic.address.city}
          </span>
        </div>
      </div>
    ),
    size,
  );
}
