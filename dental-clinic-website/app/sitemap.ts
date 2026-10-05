import type { MetadataRoute } from 'next';
import { absoluteUrl } from '@/data/clinic';
import { areas } from '@/data/areas';
import { dentistSeeds } from '@/data/dentists';
import { productSeeds } from '@/data/products';
import { treatments } from '@/data/treatments';

/**
 * Sitemap.
 *
 * Generated from the same data files that generate the pages, so it cannot
 * drift out of step with what actually exists. Only indexable pages are
 * listed: the booking flow, the basket, appointment management and the staff
 * diary are all deliberately absent, because none of them is content.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    { url: absoluteUrl('/'), lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: absoluteUrl('/treatments'), lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
    { url: absoluteUrl('/emergency'), lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
    { url: absoluteUrl('/pricing'), lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: absoluteUrl('/about'), lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: absoluteUrl('/shop'), lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: absoluteUrl('/contact'), lastModified: now, changeFrequency: 'yearly', priority: 0.7 },
  ];

  const treatmentPages: MetadataRoute.Sitemap = treatments.map((treatment) => ({
    url: absoluteUrl(`/treatments/${treatment.slug}`),
    lastModified: now,
    changeFrequency: 'monthly',
    priority: 0.8,
  }));

  const teamPages: MetadataRoute.Sitemap = dentistSeeds.map((dentist) => ({
    url: absoluteUrl(`/team/${dentist.slug}`),
    lastModified: now,
    changeFrequency: 'yearly',
    priority: 0.6,
  }));

  const productPages: MetadataRoute.Sitemap = productSeeds.map((product) => ({
    url: absoluteUrl(`/shop/${product.slug}`),
    lastModified: now,
    changeFrequency: 'monthly',
    priority: 0.5,
  }));

  const areaPages: MetadataRoute.Sitemap = areas.map((area) => ({
    url: absoluteUrl(`/areas/${area.slug}`),
    lastModified: now,
    changeFrequency: 'monthly',
    priority: 0.6,
  }));

  const legalPages: MetadataRoute.Sitemap = [
    'privacy',
    'terms',
    'cookies',
    'patient-information',
    'cancellation',
  ].map((slug) => ({
    url: absoluteUrl(`/legal/${slug}`),
    lastModified: now,
    changeFrequency: 'yearly',
    priority: 0.3,
  }));

  return [
    ...staticPages,
    ...treatmentPages,
    ...teamPages,
    ...productPages,
    ...areaPages,
    ...legalPages,
  ];
}
