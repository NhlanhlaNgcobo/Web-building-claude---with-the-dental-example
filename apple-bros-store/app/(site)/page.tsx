import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowRight,
  BatteryCharging,
  CheckCircle2,
  Recycle,
  ShieldCheck,
  Truck,
} from 'lucide-react';
import { ProductCard } from '@/components/shop/ProductCard';
import { ButtonLink } from '@/components/ui/Button';
import { Reveal } from '@/components/ui/Reveal';
import { Section, SectionHeading } from '@/components/ui/Section';
import { conditionDefinitions } from '@/data/conditions';
import { BLUR_PLACEHOLDER, siteImages } from '@/data/images';
import { store } from '@/data/store';
import { formatPrice } from '@/lib/currency';
import { getCategories, getFeaturedProducts } from '@/lib/catalogue/queries';
import { pageMetadata } from '@/lib/seo';

export const metadata: Metadata = pageMetadata({
  title: 'Refurbished Apple devices in South Africa',
  description:
    'Graded, tested and guaranteed iPhone, Mac, iPad, Apple Watch and AirPods. Published condition grades, stated battery health, twelve months of cover and free delivery over R1 500.',
  path: '/',
});

/** Live stock drives the hero, so the page never advertises an empty shelf. */
export const revalidate = 300;

const promises = [
  {
    icon: ShieldCheck,
    title: '12 month warranty',
    detail: 'On every used device, covered by us.',
  },
  {
    icon: BatteryCharging,
    title: 'Battery health stated',
    detail: 'A guaranteed minimum on every grade.',
  },
  {
    icon: Truck,
    title: 'Free delivery',
    detail: `On orders over ${formatPrice(store.freeDeliveryThresholdCents)}.`,
  },
  {
    icon: Recycle,
    title: `${store.returnWindowDays} day returns`,
    detail: 'Changed your mind? Send it back.',
  },
];

export default async function HomePage() {
  const [featured, categories] = await Promise.all([
    getFeaturedProducts(8),
    getCategories(),
  ]);

  const cheapest = featured.reduce<number | null>(
    (lowest, p) =>
      p.fromPriceCents !== null &&
      (lowest === null || p.fromPriceCents < lowest)
        ? p.fromPriceCents
        : lowest,
    null,
  );

  return (
    <>
      {/* ================= Hero ================= */}
      <section className="relative isolate overflow-hidden bg-white pt-16 lg:pt-[4.5rem]">
        <div className="container-page">
          <div className="grid items-center gap-10 py-14 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:py-20">
            <div>
              <p className="text-eyebrow">Graded. Tested. Guaranteed.</p>

              <h1 className="text-display mt-5 text-[2.5rem] text-ink sm:text-[3.25rem] lg:text-[3.75rem]">
                Apple, without the
                <br />
                Apple price.
              </h1>

              <p className="mt-6 max-w-lg text-[1.0625rem] leading-relaxed text-grey-strong">
                Every device is tested against the same checklist, graded
                against a scale we publish, and covered for twelve months. You
                see the condition, the battery health and the price before you
                buy, which is the whole idea.
              </p>

              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <ButtonLink href="/shop/iphone" size="lg">
                  Shop iPhone
                  <ArrowRight className="size-4" aria-hidden="true" />
                </ButtonLink>
                <ButtonLink href="/trade-in" size="lg" variant="secondary">
                  Value my old device
                </ButtonLink>
              </div>

              {cheapest !== null && (
                <p className="mt-6 text-[0.8125rem] text-grey-strong">
                  In stock from{' '}
                  <span className="font-semibold tabular-nums text-ink">
                    {formatPrice(cheapest)}
                  </span>
                  , including VAT.
                </p>
              )}
            </div>

            <Reveal>
              <div className="relative aspect-[4/3] overflow-hidden rounded-card bg-canvas lg:aspect-square">
                <Image
                  src={siteImages.hero.src}
                  alt={siteImages.hero.alt}
                  fill
                  priority
                  sizes="(min-width: 1024px) 46vw, 92vw"
                  placeholder="blur"
                  blurDataURL={BLUR_PLACEHOLDER}
                  className="object-cover"
                />
              </div>
            </Reveal>
          </div>
        </div>

        {/* Promises, as a quiet band rather than four shouty cards. */}
        <div className="border-y border-line bg-paper">
          <div className="container-page">
            <ul className="grid gap-px sm:grid-cols-2 lg:grid-cols-4">
              {promises.map((promise) => {
                const Icon = promise.icon;
                return (
                  <li
                    key={promise.title}
                    className="flex items-start gap-3 py-5 lg:py-6"
                  >
                    <Icon
                      className="mt-0.5 size-5 shrink-0 text-red"
                      aria-hidden="true"
                    />
                    <div>
                      <p className="text-[0.875rem] font-semibold text-ink">
                        {promise.title}
                      </p>
                      <p className="mt-0.5 text-[0.8125rem] text-grey-strong">
                        {promise.detail}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </section>

      {/* ================= Categories ================= */}
      <Section tone="white" ariaLabelledBy="categories-heading">
        <SectionHeading
          id="categories-heading"
          eyebrow="Shop"
          title="What are you after?"
        />

        <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category, index) => (
            <Reveal as="li" key={category.id} delay={Math.min(index, 3) * 60}>
              <Link
                href={`/shop/${category.slug}`}
                className="group relative flex h-full flex-col overflow-hidden rounded-card surface-card transition-[border-color,box-shadow] duration-[--duration-feedback] hover:border-line-strong hover:shadow-[0_12px_28px_-12px_rgb(13_17_23/0.14)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red"
              >
                {category.imageUrl && (
                  <div className="relative aspect-[4/3] overflow-hidden bg-canvas">
                    <Image
                      src={category.imageUrl}
                      alt=""
                      fill
                      sizes="(min-width: 1024px) 30vw, (min-width: 640px) 46vw, 92vw"
                      placeholder="blur"
                      blurDataURL={BLUR_PLACEHOLDER}
                      className="object-cover transition-transform duration-[--duration-feedback] ease-out group-hover:scale-[1.03]"
                    />
                  </div>
                )}
                <div className="flex flex-1 flex-col p-5">
                  <h3 className="text-[1.0625rem] font-bold text-ink">
                    {category.name}
                  </h3>
                  <p className="mt-1 flex-1 text-sm leading-relaxed text-grey-strong">
                    {category.tagline}
                  </p>
                  <p className="mt-4 inline-flex items-center gap-1.5 text-[0.8125rem] font-semibold text-red">
                    Browse
                    <ArrowRight
                      className="size-3.5 transition-transform duration-[--duration-feedback] ease-out group-hover:translate-x-0.5"
                      aria-hidden="true"
                    />
                  </p>
                </div>
              </Link>
            </Reveal>
          ))}
        </ul>
      </Section>

      {/* ================= Featured ================= */}
      {featured.length > 0 && (
        <Section tone="paper" ariaLabelledBy="featured-heading">
          <SectionHeading
            id="featured-heading"
            eyebrow="In stock now"
            title="Picked out this week"
            lede="Everything here is on the shelf today. When it goes, it comes off the page."
            action={
              <ButtonLink href="/shop" variant="secondary">
                Everything we stock
                <ArrowRight className="size-4" aria-hidden="true" />
              </ButtonLink>
            }
          />

          <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {featured.map((product, index) => (
              <Reveal as="li" key={product.id} delay={Math.min(index, 3) * 60}>
                <ProductCard product={product} priority={index < 4} />
              </Reveal>
            ))}
          </ul>
        </Section>
      )}

      {/* ================= Grading ================= */}
      <Section tone="white" ariaLabelledBy="grading-heading">
        <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
          <div>
            <SectionHeading
              id="grading-heading"
              eyebrow="How we grade"
              title="You know exactly what arrives"
              lede="Refurbished has a trust problem, and the whole of that problem is vague grading. So ours is specific, published, and the same every time."
            />
            <Reveal className="mt-8">
              <ButtonLink href="/grading" variant="secondary">
                The full grading scale
                <ArrowRight className="size-4" aria-hidden="true" />
              </ButtonLink>
            </Reveal>
          </div>

          <Reveal delay={80}>
            <ul className="overflow-hidden rounded-card border border-line">
              {conditionDefinitions.map((definition, index) => (
                <li
                  key={definition.grade}
                  className={index > 0 ? 'border-t border-line' : undefined}
                >
                  <div className="flex items-start gap-4 bg-white p-5">
                    <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-red-soft">
                      <CheckCircle2
                        className="size-4 text-red"
                        aria-hidden="true"
                      />
                    </span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                        <h3 className="text-[0.9375rem] font-bold text-ink">
                          {definition.label}
                        </h3>
                        {definition.batteryMin !== null && (
                          <span className="text-spec text-[0.75rem] text-leaf">
                            {definition.batteryMin}%+ battery
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-[0.8125rem] leading-relaxed text-grey-strong">
                        {definition.cosmetic}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </Section>

      {/* ================= Trade in ================= */}
      <Section tone="ink" ariaLabelledBy="tradein-heading">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <Reveal>
            <p className="text-eyebrow text-white/55">Trade in</p>
            <h2
              id="tradein-heading"
              className="text-display mt-3 text-[1.875rem] text-white sm:text-[2.5rem]"
            >
              Your old one is worth something
            </h2>
            <p className="mt-5 text-[1.0625rem] leading-relaxed text-white/70">
              Answer four questions and you get a figure, with the arithmetic
              shown. The quote stands for a fortnight, and we confirm it when
              the device arrives rather than finding reasons to move it.
            </p>
            <p className="mt-4 text-[0.9375rem] leading-relaxed text-white/55">
              If it turns out to be worth less than it costs us to process, we
              say so and recycle it free rather than offering you fifty Rand.
            </p>
            <ButtonLink
              href="/trade-in"
              size="lg"
              variant="onDark"
              className="mt-9"
            >
              Get a figure
              <ArrowRight className="size-4" aria-hidden="true" />
            </ButtonLink>
          </Reveal>

          <Reveal delay={80}>
            <div className="relative aspect-[4/3] overflow-hidden rounded-card">
              <Image
                src={siteImages.tradeIn.src}
                alt={siteImages.tradeIn.alt}
                fill
                sizes="(min-width: 1024px) 46vw, 92vw"
                placeholder="blur"
                blurDataURL={BLUR_PLACEHOLDER}
                className="object-cover"
              />
            </div>
          </Reveal>
        </div>
      </Section>
    </>
  );
}
