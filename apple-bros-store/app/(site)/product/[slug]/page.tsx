import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowRight, Check, Recycle } from 'lucide-react';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { Gallery } from '@/components/shop/Gallery';
import { ProductCard } from '@/components/shop/ProductCard';
import { VariantPicker } from '@/components/shop/VariantPicker';
import { ButtonLink } from '@/components/ui/Button';
import { Reveal } from '@/components/ui/Reveal';
import { Section, SectionHeading } from '@/components/ui/Section';
import { conditionDefinitions } from '@/data/conditions';
import { store } from '@/data/store';
import { formatPrice } from '@/lib/currency';
import {
  JsonLd,
  breadcrumbSchema,
  pageMetadata,
  productSchema,
} from '@/lib/seo';
import {
  getProductBySlug,
  getProductSlugs,
  getRelatedProducts,
} from '@/lib/catalogue/queries';
import { staticParamsOrNone } from '@/lib/catalogue/static-params';

export const revalidate = 300;

export async function generateStaticParams() {
  return staticParamsOrNone(async () => {
    const products = await getProductSlugs();
    return products.map((product) => ({ slug: product.slug }));
  });
}

export async function generateMetadata({
  params,
}: PageProps<'/product/[slug]'>): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) {
    return pageMetadata({
      title: 'Product not found',
      description: 'This product is no longer listed.',
      path: `/product/${slug}`,
      noIndex: true,
    });
  }

  // The description leads with the price when there is one, because that is
  // what somebody scanning a results page is looking for.
  const price =
    product.fromPriceCents === null
      ? 'Currently out of stock.'
      : `From ${formatPrice(product.fromPriceCents)} including VAT.`;

  return pageMetadata({
    title: `${product.name} refurbished`,
    description: `${price} ${product.tagline} Graded, tested and covered for ${store.usedWarrantyMonths} months.`,
    path: `/product/${product.slug}`,
    image: product.imageUrl ?? undefined,
  });
}

export default async function ProductPage({
  params,
  searchParams,
}: PageProps<'/product/[slug]'>) {
  const [{ slug }, search] = await Promise.all([params, searchParams]);

  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const related = await getRelatedProducts(product, 4);

  const initialVariantId =
    typeof search.variant === 'string' ? search.variant : undefined;

  const crumbs = [
    { name: 'Home', path: '/' },
    { name: 'Shop', path: '/shop' },
    { name: product.categoryName, path: `/shop/${product.categorySlug}` },
    { name: product.name, path: `/product/${product.slug}` },
  ];

  // Only the grades this product is actually sold in, so the explainer on the
  // page matches the chips above it.
  const gradesHere = conditionDefinitions.filter((definition) =>
    product.variants.some((v) => v.condition === definition.grade),
  );

  const specEntries = Object.entries(product.specs);

  return (
    <>
      <JsonLd schema={productSchema(product)} />
      <JsonLd schema={breadcrumbSchema(crumbs)} />

      <div className="bg-white pt-16 lg:pt-[4.5rem]">
        <div className="container-page py-6">
          <Breadcrumbs items={crumbs} />
        </div>

        <div className="container-page grid gap-10 pb-16 lg:grid-cols-2 lg:gap-14 lg:pb-20">
          <div className="lg:sticky lg:top-24 lg:self-start">
            <Gallery images={product.images} productName={product.name} />
          </div>

          <div>
            <p className="text-eyebrow">{product.categoryName}</p>
            <h1 className="text-display mt-3 text-[1.875rem] text-ink sm:text-[2.25rem]">
              {product.name}
            </h1>
            <p className="mt-3 text-pretty text-[1rem] leading-relaxed text-grey-strong">
              {product.tagline}
            </p>

            <div className="mt-8">
              <VariantPicker
                product={product}
                initialVariantId={initialVariantId}
              />
            </div>

            {product.highlights.length > 0 && (
              <ul className="mt-9 flex flex-col gap-2.5 border-t border-line pt-7">
                {product.highlights.map((highlight) => (
                  <li key={highlight} className="flex items-start gap-2.5">
                    <Check
                      className="mt-0.5 size-4 shrink-0 text-leaf"
                      aria-hidden="true"
                    />
                    <span className="text-pretty text-[0.9375rem] leading-relaxed text-ink">
                      {highlight}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* ---------------- About this device ---------------- */}
      <Section tone="paper" ariaLabelledBy="about-heading">
        <div className="grid gap-12 lg:grid-cols-[1fr_0.9fr] lg:gap-16">
          <div>
            <SectionHeading
              id="about-heading"
              eyebrow="About this device"
              title="What you are getting"
            />
            <div className="container-prose mt-6 flex flex-col gap-4 text-[1rem] leading-relaxed text-grey-strong">
              {product.description.split('\n\n').map((paragraph) => (
                <p key={paragraph.slice(0, 40)} className="text-pretty">
                  {paragraph}
                </p>
              ))}
            </div>

            <div className="mt-8 rounded-card border border-line bg-white p-5">
              <h3 className="text-[0.9375rem] font-bold text-ink">
                The grades this model comes in
              </h3>
              <dl className="mt-4 flex flex-col gap-4">
                {gradesHere.map((definition) => (
                  <div key={definition.grade}>
                    <dt className="flex flex-wrap items-baseline gap-x-3 text-[0.875rem] font-semibold text-ink">
                      {definition.label}
                      {definition.batteryMin !== null && (
                        <span className="text-spec text-[0.75rem] text-leaf">
                          {definition.batteryMin}%+ battery
                        </span>
                      )}
                    </dt>
                    <dd className="mt-1 text-pretty text-[0.8125rem] leading-relaxed text-grey-strong">
                      {definition.cosmetic}
                    </dd>
                  </div>
                ))}
              </dl>
              <Link
                href="/grading"
                className="mt-5 inline-flex items-center gap-1.5 text-[0.8125rem] font-semibold text-red transition-colors duration-[--duration-feedback] hover:text-red-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red"
              >
                How we test and grade
                <ArrowRight className="size-3.5" aria-hidden="true" />
              </Link>
            </div>
          </div>

          {specEntries.length > 0 && (
            <Reveal>
              <h3 className="text-[0.6875rem] font-semibold uppercase text-grey-strong">
                Specification
              </h3>
              <dl className="mt-4 overflow-hidden rounded-card border border-line bg-white">
                {specEntries.map(([term, detail], index) => (
                  <div
                    key={term}
                    className={`flex items-baseline justify-between gap-6 px-5 py-3.5 ${index > 0 ? 'border-t border-line' : ''}`}
                  >
                    <dt className="text-[0.8125rem] text-grey-strong">{term}</dt>
                    <dd className="text-spec text-right text-[0.8125rem] font-medium text-ink">
                      {detail}
                    </dd>
                  </div>
                ))}
              </dl>
              <p className="mt-3 text-[0.75rem] leading-relaxed text-grey">
                Specifications are the manufacturer figures for this model.
                Battery health is ours, measured on the device you receive.
              </p>
            </Reveal>
          )}
        </div>
      </Section>

      {/* ---------------- Trade in nudge ---------------- */}
      <Section tone="white" space="tight">
        <div className="flex flex-col items-start gap-5 rounded-card border border-line bg-paper p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div className="flex items-start gap-4">
            <Recycle
              className="mt-0.5 size-6 shrink-0 text-red"
              aria-hidden="true"
            />
            <div>
              <h2 className="text-[1.0625rem] font-bold text-ink">
                Trading in the one you have?
              </h2>
              <p className="mt-1 max-w-xl text-pretty text-[0.875rem] leading-relaxed text-grey-strong">
                Four questions and you get a figure with the arithmetic shown.
                It comes off the total at checkout, and we confirm it when the
                device reaches us.
              </p>
            </div>
          </div>
          <ButtonLink href="/trade-in" variant="secondary" className="shrink-0">
            Value my device
          </ButtonLink>
        </div>
      </Section>

      {/* ---------------- Related ---------------- */}
      {related.length > 0 && (
        <Section tone="white" space="tight" ariaLabelledBy="related-heading">
          <SectionHeading
            id="related-heading"
            eyebrow="Also in stock"
            title={`More ${product.categoryName.toLowerCase()}`}
            level={2}
            action={
              <ButtonLink
                href={`/shop/${product.categorySlug}`}
                variant="secondary"
              >
                See all
                <ArrowRight className="size-4" aria-hidden="true" />
              </ButtonLink>
            }
          />
          <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((item, index) => (
              <Reveal as="li" key={item.id} delay={Math.min(index, 3) * 60}>
                <ProductCard product={item} />
              </Reveal>
            ))}
          </ul>
        </Section>
      )}
    </>
  );
}
