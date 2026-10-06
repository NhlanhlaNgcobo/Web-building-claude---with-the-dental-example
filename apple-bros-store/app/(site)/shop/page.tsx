import type { Metadata } from 'next';
import { CatalogueView } from '@/components/shop/CatalogueView';
import { JsonLd, itemListSchema, pageMetadata } from '@/lib/seo';
import { getProducts } from '@/lib/catalogue/queries';
import { filterKey, filtersFromParams } from '@/lib/catalogue/params';

export const metadata: Metadata = pageMetadata({
  title: 'Shop all refurbished Apple devices',
  description:
    'Every iPhone, Mac, iPad, Apple Watch and pair of AirPods we have on the shelf, filterable by condition and price. Graded, tested and covered for twelve months.',
  path: '/shop',
});

/**
 * Stock drives this page, so it is revalidated rather than built once. Five
 * minutes is short enough that a sold-out device leaves the grid quickly and
 * long enough that a busy afternoon does not rebuild it on every request.
 */
export const revalidate = 300;

export default async function ShopPage({ searchParams }: PageProps<'/shop'>) {
  const params = await searchParams;
  const products = await getProducts(filtersFromParams(params));

  return (
    <>
      <JsonLd schema={itemListSchema(products)} />
      <CatalogueView
        title="Everything we stock"
        lede="One shelf, every category. Each device has been through the same workshop checklist and carries the grade we published for it."
        crumbs={[
          { name: 'Home', path: '/' },
          { name: 'Shop', path: '/shop' },
        ]}
        products={products}
        gridKey={filterKey(params)}
      />
    </>
  );
}
