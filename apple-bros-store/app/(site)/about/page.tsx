import type { Metadata } from 'next';
import Image from 'next/image';
import { Recycle, ScanLine, ShieldCheck } from 'lucide-react';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { ButtonLink } from '@/components/ui/Button';
import { Reveal } from '@/components/ui/Reveal';
import { Section, SectionHeading } from '@/components/ui/Section';
import { BLUR_PLACEHOLDER, siteImages } from '@/data/images';
import { store } from '@/data/store';
import { JsonLd, breadcrumbSchema, pageMetadata, storeSchema } from '@/lib/seo';

export const metadata: Metadata = pageMetadata({
  title: 'About the shop',
  description:
    'An independent South African retailer of refurbished and new Apple devices, with published grading, stated battery health and a warranty we honour ourselves.',
  path: '/about',
});

const crumbs = [
  { name: 'Home', path: '/' },
  { name: 'About', path: '/about' },
];

const principles = [
  {
    icon: ScanLine,
    title: 'Say what it is',
    detail:
      'Every device is graded against a published scale, with its guaranteed minimum battery health printed next to the price. If a device does not meet its grade at final check, it is regraded and repriced rather than sent out and argued about.',
  },
  {
    icon: ShieldCheck,
    title: 'Stand behind it',
    detail:
      'Twelve months on every used device, from us rather than from a manufacturer. You phone the shop that tested it and speak to somebody who can look up what was done to it.',
  },
  {
    icon: Recycle,
    title: 'Keep it in use',
    detail:
      'A working device in a drawer helps nobody. We buy them, test them, repair what needs repairing and put them back into use. What we cannot sell, we recycle properly at no charge.',
  },
];

export default function AboutPage() {
  return (
    <>
      <JsonLd schema={storeSchema()} />
      <JsonLd schema={breadcrumbSchema(crumbs)} />

      <div className="border-b border-line bg-white pt-16 lg:pt-[4.5rem]">
        <div className="container-page py-8 lg:py-14">
          <Breadcrumbs items={crumbs} />
          <h1 className="text-display mt-5 max-w-3xl text-[2rem] text-ink sm:text-[2.75rem]">
            We sell Apple devices. We are not Apple.
          </h1>
          <p className="mt-5 max-w-2xl text-pretty text-[1.0625rem] leading-relaxed text-grey-strong">
            {store.name} is an independent shop in {store.address.suburb},{' '}
            {store.address.city}. We buy, test, repair and resell Apple hardware,
            and we are not affiliated with, authorised by, or endorsed by Apple
            Inc. We say that plainly because you deserve to know whose warranty
            you are holding before you buy, not after something goes wrong.
          </p>
        </div>
      </div>

      {/* ---------------- The story ---------------- */}
      <Section tone="white" ariaLabelledBy="story-heading">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <SectionHeading
              id="story-heading"
              eyebrow="Why we exist"
              title="The gap between new and risky"
            />
            <div className="container-prose mt-6 flex flex-col gap-4 px-0 text-[1rem] leading-relaxed text-grey-strong">
              <p className="text-pretty">
                Buying a used phone in South Africa usually means one of two
                things. Pay full price at an authorised dealer, or meet a stranger
                in a car park and hope the device is not locked, not stolen and
                not about to fail.
              </p>
              <p className="text-pretty">
                We exist in the gap between those. Every device we sell has been
                opened, tested against a fixed checklist, had its battery
                measured, been checked against the stolen property register, and
                been graded against a scale we publish. You get the saving of
                used with the certainty of a shop that has a street address and
                a telephone number.
              </p>
              <p className="text-pretty">
                None of that is complicated. It is just work that somebody has
                to do, and the reason the trade has a bad name is that so often
                nobody does it.
              </p>
            </div>
          </div>

          <Reveal>
            <div className="relative aspect-[4/3] overflow-hidden rounded-card bg-canvas">
              <Image
                src={siteImages.workbench.src}
                alt={siteImages.workbench.alt}
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

      {/* ---------------- Principles ---------------- */}
      <Section tone="paper" ariaLabelledBy="principles-heading">
        <SectionHeading
          id="principles-heading"
          eyebrow="How we trade"
          title="Three things we will not bend on"
        />
        <ul className="mt-10 grid gap-4 lg:grid-cols-3">
          {principles.map((principle, index) => {
            const Icon = principle.icon;
            return (
              <Reveal as="li" key={principle.title} delay={Math.min(index, 3) * 60}>
                <div className="flex h-full flex-col rounded-card border border-line bg-white p-6">
                  <Icon className="size-6 text-red" aria-hidden="true" />
                  <h3 className="mt-4 text-[1.0625rem] font-bold text-ink">
                    {principle.title}
                  </h3>
                  <p className="mt-2 text-pretty text-[0.9375rem] leading-relaxed text-grey-strong">
                    {principle.detail}
                  </p>
                </div>
              </Reveal>
            );
          })}
        </ul>
      </Section>

      {/* ---------------- Independence ---------------- */}
      <Section tone="white" space="tight" ariaLabelledBy="independence-heading">
        <div className="rounded-card border border-line bg-paper p-6 sm:p-8">
          <h2
            id="independence-heading"
            className="text-[1.125rem] font-bold text-ink"
          >
            About the Apple name
          </h2>
          <p className="mt-3 max-w-3xl text-pretty text-[0.9375rem] leading-relaxed text-grey-strong">
            {store.independenceNotice}
          </p>
          <p className="mt-3 max-w-3xl text-pretty text-[0.9375rem] leading-relaxed text-grey-strong">
            We use those names because they are what the devices are called and
            there is no other accurate way to describe what we sell. We do not
            use Apple logos, we do not present ourselves as an authorised
            reseller, and the warranty on a used device is ours rather than
            theirs.
          </p>
        </div>
      </Section>

      {/* ---------------- Visit ---------------- */}
      <Section tone="ink" ariaLabelledBy="visit-heading">
        <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
          <div>
            <p className="text-eyebrow text-white/55">Come and see</p>
            <h2
              id="visit-heading"
              className="text-display mt-3 text-[1.875rem] text-white sm:text-[2.25rem]"
            >
              There is a real shop behind this
            </h2>
            <p className="mt-5 max-w-xl text-pretty text-[1rem] leading-relaxed text-white/70">
              You are welcome to walk in, look at a device in daylight and ask
              whoever tested it what they found. That is harder to fake than a
              product photograph, which is rather the point.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <ButtonLink href="/contact" variant="onDark">
                Where to find us
              </ButtonLink>
              <ButtonLink href="/shop" variant="onDarkGhost">
                See what is in stock
              </ButtonLink>
            </div>
          </div>

          <dl className="grid gap-px overflow-hidden rounded-card border border-line-dark sm:grid-cols-2">
            <div className="bg-white/[0.04] p-5">
              <dt className="text-[0.6875rem] font-semibold uppercase text-white/50">
                Where
              </dt>
              <dd className="mt-1.5 text-[0.9375rem] leading-relaxed text-white">
                {store.address.line1}
                <br />
                {store.address.line2}
                <br />
                {store.address.suburb}, {store.address.city}
              </dd>
            </div>
            <div className="bg-white/[0.04] p-5">
              <dt className="text-[0.6875rem] font-semibold uppercase text-white/50">
                When
              </dt>
              <dd className="mt-1.5 text-[0.9375rem] leading-relaxed text-white">
                Monday to Friday, 09:00 to 18:00
                <br />
                Saturday, 09:00 to 15:00
                <br />
                <span className="text-white/55">Closed Sunday</span>
              </dd>
            </div>
            <div className="bg-white/[0.04] p-5 sm:col-span-2">
              <dt className="text-[0.6875rem] font-semibold uppercase text-white/50">
                Parking
              </dt>
              <dd className="mt-1.5 text-[0.9375rem] leading-relaxed text-white">
                {store.parking}
              </dd>
            </div>
          </dl>
        </div>
      </Section>
    </>
  );
}
