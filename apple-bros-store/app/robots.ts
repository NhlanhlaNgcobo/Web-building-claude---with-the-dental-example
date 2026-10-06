import type { MetadataRoute } from 'next';
import { absoluteUrl, siteUrl } from '@/data/store';

/**
 * robots.txt.
 *
 * On anything that is not the live shop, this disallows everything. The site
 * presents, correctly, as a real retailer, but a preview deployment carries
 * placeholder contact details and prices that are not the shop's real ones.
 * Those being indexed would put wrong prices and a wrong telephone number in
 * front of people shopping for a phone, which is a real harm rather than an
 * untidiness.
 *
 * The X-Robots-Tag header in next.config.ts does the same job for crawlers that
 * ignore this file. Belt and braces, because the cost of being wrong here is
 * somebody phoning a number that does not belong to the shop.
 */
export default function robots(): MetadataRoute.Robots {
  const isPreview =
    process.env.DEMO_NOINDEX === 'true' || process.env.VERCEL_ENV === 'preview';

  if (isPreview) {
    return { rules: [{ userAgent: '*', disallow: '/' }] };
  }

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin',
          '/api/',
          '/basket',
          '/checkout',
          '/order',
          '/search',
        ],
      },
    ],
    sitemap: absoluteUrl('/sitemap.xml'),
    host: siteUrl(),
  };
}
