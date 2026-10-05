import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // A production build must fail on a type error rather than quietly ship
  // one. Linting is a separate script, because Next 16 no longer runs it as
  // part of next build.
  typescript: { ignoreBuildErrors: false },

  images: {
    // Photography is loaded through next/image from a single external host, so
    // it is optimised, responsive and lazy by default. Swapping to the
    // practice's own photography means changing data/images.ts, and replacing
    // this entry if the files move to another host or into /public.
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
    ],
    // Narrower than the default set, matched to the breakpoints this layout
    // actually uses, so fewer variants are generated and cached.
    deviceSizes: [390, 640, 828, 1080, 1280, 1920],
    imageSizes: [96, 160, 256, 384],
    formats: ['image/webp'],
  },

  async headers() {
    /**
     * Keep demo and preview deployments out of search results.
     *
     * This site presents, correctly, as a real dental practice, but until the
     * contact details in data/clinic.ts are replaced it carries an invented
     * telephone number and address. A deployment of it being indexed would
     * put a plausible but wrong number in front of people searching for a
     * dentist in Durban, which is a real harm rather than a tidiness
     * question.
     *
     * Set DEMO_NOINDEX=true on any deployment that is not the live practice
     * site. Vercel preview deployments are covered automatically.
     */
    const isDemo =
      process.env.DEMO_NOINDEX === 'true' ||
      process.env.VERCEL_ENV === 'preview';

    const demoHeaders = isDemo
      ? [
          {
            source: '/:path*',
            headers: [
              {
                key: 'X-Robots-Tag',
                value: 'noindex, nofollow, noarchive, nosnippet',
              },
            ],
          },
        ]
      : [];

    return [
      ...demoHeaders,
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
      {
        // The staff diary and everything it talks to must never be cached by a
        // browser, a proxy or a CDN.
        source: '/admin/:path*',
        headers: [
          { key: 'Cache-Control', value: 'no-store, max-age=0' },
          { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
        ],
      },
    ];
  },
};

export default nextConfig;
