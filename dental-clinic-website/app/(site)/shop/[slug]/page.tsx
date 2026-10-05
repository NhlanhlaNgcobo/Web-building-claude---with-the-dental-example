import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowRight, Check, Info, Store } from 'lucide-react';
import { PageHero } from '@/components/layout/PageHero';
import { AddToBasketButton } from '@/components/shop/AddToBasketButton';
import { ProductCard } from '@/components/shop/ProductCard';
import { ButtonLink } from '@/components/ui/Button';
import { Reveal } from '@/components/ui/Reveal';
import { Section, SectionHeading } from '@/components/ui/Section';
import { productSeeds } from '@/data/products';
import { BLUR_PLACEHOLDER } from '@/data/images';
import { formatPrice } from '@/lib/currency';
import { prisma } from '@/lib/db';
import { getProductBySlug, getProducts } from '@/lib/queries';
import { JsonLd, pageMetadata, productSchema } from '@/lib/seo';

export function generateStaticParams() {
  return productSeeds.map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<'/shop/[slug]'>): Promise<Metadata> {
  const { slug } = await params;
  const product = productSeeds.find((p) => p.slug === slug);
  if (!product) return {};

  return pageMetadata({
    title: product.name,
    description: product.shortDescription,
    path: `/shop/${product.slug}`,
    image: product.imageUrl,
  });
}

export default async function ProductPage({
  params,
}: PageProps<'/shop/[slug]'>) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const seed = productSeeds.find((p) => p.slug === slug);
  const includes = product.includes?.split('\n').filter(Boolean) ?? [];
  const paragraphs = product.description.split('\n\n').filter(Boolean);

  // Appointments this product relates to, read from the explicit relationship
  // in the data model rather than guessed from the product name.
  const relatedServices = await prisma.serviceProduct.findMany({
    where: { productId: product.id, service: { isActive: true } },
    include: { service: true },
    orderBy: { sortOrder: 'asc' },
    take: 2,
  });

  const others = (await getProducts())
    .filter((p) => p.slug !== slug)
    .slice(0, 4);

  const isWhitening = product.category === 'whitening';

  const card = {
    id: product.id,
    slug: product.slug,
    name: product.name,
    shortDescription: product.shortDescription,
    priceCents: product.priceCents,
    imageUrl: product.imageUrl,
  };

  return (
    <>
      <PageHero
        eyebrow="Shop"
        title={product.name}
        lede={product.shortDescription}
        crumbs={[
          { name: 'Shop', path: '/shop' },
          { name: product.name, path: `/shop/${product.slug}` },
        ]}
      />

      <div className="bg-white">
        <div className="container-page py-12 lg:py-16">
          <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
            <Reveal>
              <div className="relative aspect-square overflow-hidden rounded-card bg-canvas-deep">
                <Image
                  src={product.imageUrl}
                  alt={product.name}
                  fill
                  priority
                  sizes="(min-width: 1024px) 48vw, 92vw"
                  placeholder="blur"
                  blurDataURL={BLUR_PLACEHOLDER}
                  className="object-cover"
                />
              </div>
            </Reveal>

            <div>
              <p className="text-[1.75rem] font-semibold tabular-nums text-ink">
                {formatPrice(product.priceCents)}
              </p>

              <div className="mt-5 flex flex-col gap-4">
                {paragraphs.map((paragraph) => (
                  <p
                    key={paragraph.slice(0, 40)}
                    className="text-[0.9375rem] leading-relaxed text-charcoal"
                  >
                    {paragraph}
                  </p>
                ))}
              </div>

              {includes.length > 0 && (
                <div className="mt-7">
                  <h2 className="text-[0.9375rem] font-semibold text-ink">
                    What is included
                  </h2>
                  <ul className="mt-3 flex flex-col gap-2">
                    {includes.map((item) => (
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

              {product.usageNotes && (
                <div className="mt-7 rounded-card border border-line bg-canvas p-4">
                  <h2 className="text-[0.8125rem] font-semibold text-ink">
                    How it is used
                  </h2>
                  <p className="mt-1.5 text-[0.8125rem] leading-relaxed text-grey-strong">
                    {product.usageNotes}
                  </p>
                </div>
              )}

              {isWhitening && (
                <p className="mt-5 flex items-start gap-2.5 rounded-card border border-line bg-white p-4 text-[0.8125rem] leading-relaxed text-grey-strong">
                  <Info
                    className="mt-0.5 size-4 shrink-0 text-blue"
                    aria-hidden="true"
                  />
                  <span>
                    Suitability for whitening varies between people, and a
                    professional assessment is appropriate before starting.
                    Whitening does not change the colour of crowns, veneers or
                    existing white fillings.
                  </span>
                </p>
              )}

              {/* Collection, stated before anyone adds anything. */}
              <p className="mt-5 flex items-start gap-2.5 text-[0.8125rem] leading-relaxed text-grey-strong">
                <Store className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                <span>
                  Collect from reception during opening hours, or at your next
                  appointment. Payment is taken at collection.
                </span>
              </p>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <AddToBasketButton
                  product={card}
                  size="lg"
                  label="Add to basket"
                />
                {isWhitening && (
                  <ButtonLink
                    href="/book?service=whitening-consultation"
                    size="lg"
                    variant="secondary"
                  >
                    Book Whitening Consultation
                  </ButtonLink>
                )}
              </div>

              {relatedServices.length > 0 && (
                <div className="mt-8 border-t border-line pt-6">
                  <h2 className="text-[0.8125rem] font-semibold text-ink">
                    Often recommended at
                  </h2>
                  <ul className="mt-3 flex flex-col gap-2">
                    {relatedServices.map((row) => (
                      <li key={row.serviceId}>
                        <Link
                          href={`/book?service=${row.service.slug}`}
                          className="inline-flex items-center gap-1.5 text-sm font-medium text-blue underline decoration-blue/30 underline-offset-2 hover:decoration-blue"
                        >
                          {row.service.name}
                          <ArrowRight className="size-3.5" aria-hidden="true" />
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {others.length > 0 && (
        <Section tone="canvas" ariaLabelledBy="other-products">
          <SectionHeading
            id="other-products"
            title="Also in the practice"
            level={2}
          />
          <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {others.map((other, index) => (
              <Reveal as="li" key={other.id} delay={Math.min(index, 3) * 60}>
                <ProductCard product={other} compact />
              </Reveal>
            ))}
          </ul>
        </Section>
      )}

      {seed && (
        <JsonLd
          schema={productSchema({
            slug: product.slug,
            name: product.name,
            shortDescription: product.shortDescription,
            priceCents: product.priceCents,
            imageUrl: product.imageUrl,
          })}
        />
      )}
    </>
  );
}
