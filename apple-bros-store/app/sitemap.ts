import type { MetadataRoute } from 'next';
import { absoluteUrl } from '@/data/store';
import { helpTopics } from '@/data/help';
import { legalDocuments } from '@/data/legal';
import { getCategories, getProductSlugs } from '@/lib/catalogue/queries';

/**
 * The sitemap.
 *
 * Only pages worth indexing. The basket, checkout, search and order tracking
 * are all deliberately absent: they are personal, infinite in number, or thin,
 * and listing them would spend crawl budget on pages that can never rank.
 *
 * Priorities are relative to each other rather than absolute. The product pages
 * are what the shop lives on, so they sit at the top with the categories.
 */
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [categories, products] = await Promise.all([
    getCategories(),
    getProductSlugs(),
  ]);

  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    { url: absoluteUrl('/'), changeFrequency: 'daily', priority: 1 },
    { url: absoluteUrl('/shop'), changeFrequency: 'daily', priority: 0.9 },
    { url: absoluteUrl('/grading'), changeFrequency: 'monthly', priority: 0.8 },
    { url: absoluteUrl('/trade-in'), changeFrequency: 'weekly', priority: 0.8 },
    { url: absoluteUrl('/about'), changeFrequency: 'monthly', priority: 0.5 },
    { url: absoluteUrl('/contact'), changeFrequency: 'monthly', priority: 0.6 },
    { url: absoluteUrl('/help'), changeFrequency: 'monthly', priority: 0.5 },
  ];

  return [
    ...staticPages,
    ...categories.map((category) => ({
      url: absoluteUrl(`/shop/${category.slug}`),
      changeFrequency: 'daily' as const,
      priority: 0.9,
    })),
    ...products.map((product) => ({
      url: absoluteUrl(`/product/${product.slug}`),
      changeFrequency: 'daily' as const,
      priority: 0.8,
    })),
    ...helpTopics.map((topic) => ({
      url: absoluteUrl(`/help/${topic.slug}`),
      changeFrequency: 'monthly' as const,
      priority: 0.4,
    })),
    ...legalDocuments.map((doc) => ({
      url: absoluteUrl(`/legal/${doc.slug}`),
      changeFrequency: 'yearly' as const,
      priority: 0.3,
    })),
  ].map((entry) => ({ lastModified: now, ...entry }));
}
