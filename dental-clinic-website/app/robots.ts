import type { MetadataRoute } from 'next';
import { absoluteUrl } from '@/data/clinic';

/**
 * robots.txt
 *
 * The content pages are open. Everything that is a transaction rather than
 * content is excluded, for two separate reasons: the staff diary and anything
 * holding a booking reference should not be indexed at all, and the booking
 * flow and basket are stateful pages that would waste crawl budget and could
 * surface in results in a half-filled state.
 */
export default function robots(): MetadataRoute.Robots {
  // A demo or preview deployment disallows everything, matching the noindex
  // header set in next.config.ts. See the comment there for why.
  const isDemo =
    process.env.DEMO_NOINDEX === 'true' ||
    process.env.VERCEL_ENV === 'preview';

  if (isDemo) {
    return { rules: [{ userAgent: '*', disallow: '/' }] };
  }

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          // Staff only.
          '/admin',
          '/admin/',
          // Transactional, and in the confirmation case personal.
          '/book',
          '/book/',
          '/appointment',
          '/basket',
          // Nothing under the API is content.
          '/api/',
        ],
      },
    ],
    sitemap: absoluteUrl('/sitemap.xml'),
    host: absoluteUrl('/'),
  };
}
