import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Check, Info, Store } from 'lucide-react';
import { PageHero } from '@/components/layout/PageHero';
import { ProductCard } from '@/components/shop/ProductCard';
import { AddToBasketButton } from '@/components/shop/AddToBasketButton';
import { ButtonLink } from '@/components/ui/Button';
import { Reveal } from '@/components/ui/Reveal';
import { Section, SectionHeading } from '@/components/ui/Section';
import { FEATURED_PRODUCT_SLUG, productSeeds } from '@/data/products';
import { BLUR_PLACEHOLDER } from '@/data/images';
import { formatPrice } from '@/lib/currency';
import { getProducts } from '@/lib/queries';
import { pageMetadata } from '@/lib/seo';

export const metadata: Metadata = pageMetadata({
  title: 'Dental products',
  description:
    'A short, curated list of oral care products we actually recommend, including our take-home whitening kit. Collect at reception or with your next appointment.',
  path: '/shop',
});

/**
 * The shop.
 *
 * Deliberately small. This is a recommendation area rather than a retail
 * catalogue: everything here is something a dentist at this practice would
 * tell you to buy anyway, so the list is short and the copy explains why
 * rather than selling.
 */
export default async function ShopPage() {
  const products = await getProducts();
  const featured = products.find((p) => p.slug === FEATURED_PRODUCT_SLUG);
  const featuredSeed = productSeeds.find(
    (p) => p.slug === FEATURED_PRODUCT_SLUG,
  );
  const rest = products.filter((p) => p.slug !== FEATURED_PRODUCT_SLUG);

  return (
    <>
      <PageHero
        eyebrow="Shop"
        title="What we actually recommend"
        lede="A short list rather than a catalogue. Everything here is something we would suggest at an appointment anyway, and most of it lasts months."
        crumbs={[{ name: 'Shop', path: '/shop' }]}
      />

      {/* Collection notice. No delivery, no courier integration, stated plainly. */}
      <div className="border-b border-line bg-blue-soft">
        <div className="container-page py-5">
          <p className="flex items-start gap-2.5 text-sm leading-relaxed text-blue-dark">
            <Store className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <span>
              Orders are collected from reception during opening hours, or
              handed to you at your next appointment if you have one booked.
              Payment is taken at collection, so nothing is charged online.
            </span>
          </p>
        </div>
      </div>

      {/* Featured: the take-home whitening kit */}
      {featured && featuredSeed && (
        <Section tone="white" ariaLabelledBy="whitening-kit-heading">
          <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
            <Reveal>
              <div className="relative aspect-square overflow-hidden rounded-card bg-canvas-deep">
                <Image
                  src={featured.imageUrl}
                  alt={featured.name}
                  fill
                  priority
                  sizes="(min-width: 1024px) 48vw, 92vw"
                  placeholder="blur"
                  blurDataURL={BLUR_PLACEHOLDER}
                  className="object-cover"
                />
              </div>
            </Reveal>

            <Reveal delay={80}>
              <p className="text-eyebrow">Take-home whitening</p>
              <h2
                id="whitening-kit-heading"
                className="mt-3 text-[1.625rem] font-semibold leading-[1.15] text-ink sm:text-[2rem]"
              >
                {featured.name}
              </h2>
              <p className="mt-4 text-[1.75rem] font-semibold tabular-nums text-ink">
                {formatPrice(featured.priceCents)}
              </p>

              <p className="mt-5 text-[0.9375rem] leading-relaxed text-charcoal">
                {featuredSeed.description.split('\n\n')[0]}
              </p>

              {featuredSeed.includes && (
                <div className="mt-6">
                  <h3 className="text-[0.8125rem] font-semibold text-ink">
                    What is included
                  </h3>
                  <ul className="mt-3 flex flex-col gap-2">
                    {featuredSeed.includes.map((item) => (
                      <li
                        key={item}
                        className="flex items-start gap-2.5 text-sm text-grey-strong"
                      >
                        <Check
                          className="mt-1 size-3.5 shrink-0 text-blue"
                          aria-hidden="true"
                        />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {featuredSeed.usageNotes && (
                <p className="mt-5 rounded-panel bg-canvas p-4 text-[0.8125rem] leading-relaxed text-grey-strong">
                  <span className="font-medium text-ink">How it is used: </span>
                  {featuredSeed.usageNotes}
                </p>
              )}

              {/* The honest caveat, not buried. */}
              <p className="mt-5 flex items-start gap-2.5 rounded-card border border-line bg-white p-4 text-[0.8125rem] leading-relaxed text-grey-strong">
                <Info
                  className="mt-0.5 size-4 shrink-0 text-blue"
                  aria-hidden="true"
                />
                <span>
                  Whitening suits many people but not everyone, and results vary
                  with your natural tooth colour and the type of staining.
                  Crowns, veneers and existing white fillings do not change
                  colour. This kit is dispensed after a whitening consultation
                  so we can check it is appropriate and make trays that fit you.
                </span>
              </p>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <ButtonLink
                  href="/book?service=whitening-consultation"
                  size="lg"
                >
                  Book Whitening Consultation
                </ButtonLink>
                <AddToBasketButton
                  product={featured}
                  size="lg"
                  label="Add to basket"
                  className="border border-line-strong bg-white text-ink hover:border-ink hover:bg-canvas"
                />
              </div>
            </Reveal>
          </div>
        </Section>
      )}

      {/* Everything else */}
      <Section tone="canvas" ariaLabelledBy="all-products-heading">
        <SectionHeading
          id="all-products-heading"
          eyebrow="Oral care"
          title="Everything we stock"
          lede="Brushes, pastes, interdental care and aftercare. If you are not sure what suits you, ask at your next appointment."
        />

        <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {rest.map((product, index) => (
            <Reveal as="li" key={product.id} delay={Math.min(index, 3) * 60}>
              <ProductCard product={product} />
            </Reveal>
          ))}
        </ul>

        <Reveal className="mt-10">
          <Link
            href="/basket"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-blue underline decoration-blue/30 underline-offset-2 hover:decoration-blue"
          >
            View your basket
            <ArrowRight className="size-3.5" aria-hidden="true" />
          </Link>
        </Reveal>
      </Section>
    </>
  );
}
