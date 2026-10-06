import Link from 'next/link';
import { PackageSearch } from 'lucide-react';
import { Breadcrumbs, type Crumb } from '@/components/layout/Breadcrumbs';
import { FilterBar } from '@/components/shop/FilterBar';
import { ProductCard } from '@/components/shop/ProductCard';
import { ButtonLink } from '@/components/ui/Button';
import { Reveal } from '@/components/ui/Reveal';
import type { ProductCardDto } from '@/types';

/**
 * The listing surface, shared by /shop and every category page.
 *
 * One component rather than two nearly identical pages, because the only
 * things that differ are the heading, the trail and which products were
 * fetched. Keeping it in one place is what stops the category grid and the
 * all-products grid drifting apart.
 */
export function CatalogueView({
  title,
  lede,
  crumbs,
  products,
  /** Changes whenever the filters change, remounting the grid. */
  gridKey,
  emptyHint,
}: {
  readonly title: string;
  readonly lede?: string;
  readonly crumbs: readonly Crumb[];
  readonly products: readonly ProductCardDto[];
  readonly gridKey: string;
  readonly emptyHint?: React.ReactNode;
}) {
  return (
    <>
      <div className="border-b border-line bg-white pt-16 lg:pt-[4.5rem]">
        <div className="container-page py-8 lg:py-12">
          <Breadcrumbs items={crumbs} />
          <h1 className="text-display mt-5 text-[2rem] text-ink sm:text-[2.5rem]">
            {title}
          </h1>
          {lede && (
            <p className="mt-4 max-w-2xl text-[1.0625rem] leading-relaxed text-grey-strong">
              {lede}
            </p>
          )}
        </div>
      </div>

      <div className="bg-white">
        <div className="container-page">
          <FilterBar resultCount={products.length} />

          {products.length === 0 ? (
            <div className="py-20 text-center">
              <PackageSearch
                className="mx-auto size-8 text-grey"
                aria-hidden="true"
              />
              <h2 className="mt-4 text-[1.125rem] font-bold text-ink">
                Nothing matches that combination
              </h2>
              <p className="mx-auto mt-2 max-w-md text-pretty text-sm leading-relaxed text-grey-strong">
                {emptyHint ??
                  'Try widening the price range or adding another condition. Stock moves quickly, so a grade that is empty today often is not next week.'}
              </p>
              <ButtonLink href="/shop" variant="secondary" className="mt-6">
                Everything we stock
              </ButtonLink>
            </div>
          ) : (
            <ul
              key={gridKey}
              className="grid gap-4 py-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 lg:py-10"
            >
              {products.map((product, index) => (
                <Reveal as="li" key={product.id} delay={Math.min(index, 3) * 60}>
                  <ProductCard
                    product={product}
                    priority={index < 4}
                    headingLevel={2}
                  />
                </Reveal>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="border-t border-line bg-paper">
        <div className="container-page flex flex-col gap-3 py-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-grey-strong">
            Not sure which grade to pick?{' '}
            <Link
              href="/grading"
              className="font-semibold text-ink underline decoration-red decoration-2 underline-offset-2 transition-colors duration-[--duration-feedback] hover:text-red focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red"
            >
              Read what each one means
            </Link>
            .
          </p>
          <p className="text-sm text-grey-strong">
            Every price includes VAT and our twelve month warranty.
          </p>
        </div>
      </div>
    </>
  );
}
