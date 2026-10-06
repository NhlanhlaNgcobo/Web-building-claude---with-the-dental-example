import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CatalogueView } from '@/components/shop/CatalogueView';
import {
  JsonLd,
  breadcrumbSchema,
  itemListSchema,
  pageMetadata,
} from '@/lib/seo';
import {
  getCategories,
  getCategoryBySlug,
  getProducts,
} from '@/lib/catalogue/queries';
import { filterKey, filtersFromParams } from '@/lib/catalogue/params';
import { staticParamsOrNone } from '@/lib/catalogue/static-params';

export const revalidate = 300;

/**
 * The six categories are known at build time, so their shells are prerendered
 * and only the stock-dependent parts revalidate.
 */
export async function generateStaticParams() {
  return staticParamsOrNone(async () => {
    const categories = await getCategories();
    return categories.map((category) => ({ category: category.slug }));
  });
}

export async function generateMetadata({
  params,
}: PageProps<'/shop/[category]'>): Promise<Metadata> {
  const { category: slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) return pageMetadata({
    title: 'Category not found',
    description: 'This category does not exist.',
    path: `/shop/${slug}`,
    noIndex: true,
  });

  return pageMetadata({
    title: `Refurbished ${category.name}`,
    description: category.description,
    path: `/shop/${category.slug}`,
  });
}

export default async function CategoryPage({
  params,
  searchParams,
}: PageProps<'/shop/[category]'>) {
  const [{ category: slug }, search] = await Promise.all([
    params,
    searchParams,
  ]);

  const category = await getCategoryBySlug(slug);
  if (!category) notFound();

  const products = await getProducts(filtersFromParams(search, category.slug));

  const crumbs = [
    { name: 'Home', path: '/' },
    { name: 'Shop', path: '/shop' },
    { name: category.name, path: `/shop/${category.slug}` },
  ];

  return (
    <>
      <JsonLd schema={breadcrumbSchema(crumbs)} />
      <JsonLd schema={itemListSchema(products)} />
      <CatalogueView
        title={category.name}
        lede={category.description}
        crumbs={crumbs}
        products={products}
        gridKey={filterKey(search)}
        emptyHint={`We have nothing in ${category.name.toLowerCase()} matching that combination right now. Clearing the filters will show everything in this category, including anything currently out of stock.`}
      />
    </>
  );
}
