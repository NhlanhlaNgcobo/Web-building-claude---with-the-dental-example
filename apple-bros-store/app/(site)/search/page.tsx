import type { Metadata } from 'next';
import { SearchX } from 'lucide-react';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { ProductCard } from '@/components/shop/ProductCard';
import { SearchField } from '@/components/shop/SearchField';
import { ButtonLink } from '@/components/ui/Button';
import { Reveal } from '@/components/ui/Reveal';
import { getCategories, searchProducts } from '@/lib/catalogue/queries';
import { pageMetadata } from '@/lib/seo';

export const metadata: Metadata = pageMetadata({
  title: 'Search',
  description: 'Find a device by model, category or description.',
  path: '/search',
  // Search result pages are thin and infinite in number. The catalogue pages
  // are what should rank.
  noIndex: true,
});

export const dynamic = 'force-dynamic';

export default async function SearchPage({
  searchParams,
}: PageProps<'/search'>) {
  const params = await searchParams;
  const query = typeof params.q === 'string' ? params.q : '';

  const [results, categories] = await Promise.all([
    query.trim().length >= 2 ? searchProducts(query) : Promise.resolve([]),
    getCategories(),
  ]);

  const searched = query.trim().length >= 2;

  return (
    <div className="bg-white pt-16 lg:pt-[4.5rem]">
      <div className="container-page py-8 lg:py-12">
        <Breadcrumbs
          items={[
            { name: 'Home', path: '/' },
            { name: 'Search', path: '/search' },
          ]}
        />
        <h1 className="text-display mt-5 text-[2rem] text-ink sm:text-[2.25rem]">
          Search
        </h1>

        <div className="mt-6 max-w-xl">
          <SearchField defaultValue={query} />
        </div>

        {searched && (
          <p
            aria-live="polite"
            className="mt-4 text-[0.875rem] tabular-nums text-grey-strong"
          >
            {results.length === 0
              ? `Nothing matched "${query.trim()}".`
              : `${results.length} ${results.length === 1 ? 'result' : 'results'} for "${query.trim()}".`}
          </p>
        )}
      </div>

      <div className="container-page pb-20">
        {results.length > 0 ? (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {results.map((product, index) => (
              <Reveal as="li" key={product.id} delay={Math.min(index, 3) * 60}>
                <ProductCard
                  product={product}
                  priority={index < 4}
                  headingLevel={2}
                />
              </Reveal>
            ))}
          </ul>
        ) : searched ? (
          <div className="rounded-card border border-line bg-paper p-8 text-center">
            <SearchX className="mx-auto size-8 text-grey" aria-hidden="true" />
            <h2 className="mt-4 text-[1.125rem] font-bold text-ink">
              Nothing came back
            </h2>
            <p className="mx-auto mt-2 max-w-md text-pretty text-sm leading-relaxed text-grey-strong">
              Try the model name on its own, such as iPhone 14 or MacBook Air.
              If we have never stocked it, browsing a category is usually
              quicker than guessing at a name.
            </p>
            <ButtonLink href="/shop" className="mt-6">
              Everything we stock
            </ButtonLink>
          </div>
        ) : (
          <div>
            <h2 className="text-[0.6875rem] font-semibold uppercase text-grey-strong">
              Or start with a category
            </h2>
            <ul className="mt-4 flex flex-wrap gap-2">
              {categories.map((category) => (
                <li key={category.id}>
                  <ButtonLink
                    href={`/shop/${category.slug}`}
                    variant="secondary"
                    size="sm"
                  >
                    {category.name}
                  </ButtonLink>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
