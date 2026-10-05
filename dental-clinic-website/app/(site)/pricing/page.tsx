import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Clock, Info } from 'lucide-react';
import { PageHero } from '@/components/layout/PageHero';
import { ButtonLink } from '@/components/ui/Button';
import { FaqAccordion } from '@/components/ui/FaqAccordion';
import { Divider } from '@/components/ui/Primitives';
import { Reveal } from '@/components/ui/Reveal';
import { Section, SectionHeading } from '@/components/ui/Section';
import { pricingFaqs } from '@/data/faqs';
import { treatments } from '@/data/treatments';
import { formatDuration } from '@/lib/availability/tz';
import { formatPrice } from '@/lib/currency';
import { JsonLd, faqSchema, pageMetadata } from '@/lib/seo';
import type { ServiceCategory } from '@/lib/domain/enums';

export const metadata: Metadata = pageMetadata({
  title: 'Dental fees',
  description:
    'Published fees for examinations, hygiene, fillings, crowns, whitening, implants and urgent appointments in Durban, in South African Rand.',
  path: '/pricing',
});

/**
 * Fees.
 *
 * Split into fixed and variable, which is the honest division. An examination
 * has a price. A root canal depends on which tooth, so quoting one number for
 * it would be misleading, and the page says so rather than hiding behind
 * "from" on everything equally.
 */
const groups: {
  readonly category: ServiceCategory;
  readonly title: string;
  readonly note?: string;
}[] = [
  {
    category: 'general',
    title: 'Consultations and examinations',
    note: 'Fixed fees. What you see is what you pay.',
  },
  {
    category: 'hygiene',
    title: 'Hygiene and gum health',
    note: 'A single appointment is a fixed fee. A course of gum treatment is quoted after charting.',
  },
  {
    category: 'emergency',
    title: 'Urgent care',
    note: 'The consultation fee covers assessment and immediate relief.',
  },
  {
    category: 'restorative',
    title: 'Repairing teeth',
    note: 'Starting fees. The exact figure depends on the tooth and how much work it needs, and comes to you in writing first.',
  },
  {
    category: 'cosmetic',
    title: 'Appearance',
    note: 'Starting fees per tooth. Cosmetic treatment is always planned and quoted as a whole before anything begins.',
  },
  {
    category: 'surgical',
    title: 'Surgical treatment',
    note: 'Starting fees. Imaging and any grafting are quoted separately after assessment.',
  },
];

export default function PricingPage() {
  return (
    <>
      <PageHero
        eyebrow="Fees"
        title="What treatment costs"
        lede="Published here rather than available on request. All amounts are in South African Rand and include everything listed, with nothing added afterwards that was not agreed."
        crumbs={[{ name: 'Fees', path: '/pricing' }]}
      />

      {/* The honest caveat, up front rather than in small print. */}
      <div className="border-b border-line bg-blue-soft">
        <div className="container-page py-5">
          <p className="flex items-start gap-2.5 text-sm leading-relaxed text-blue-dark">
            <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <span>
              Consultation and hygiene fees are fixed. Anything that depends on
              what we find, which is most restorative and cosmetic treatment,
              is shown as a starting figure and then quoted exactly in a written
              plan after an examination. You will never be asked to agree to
              treatment without a number in front of you.
            </span>
          </p>
        </div>
      </div>

      {groups.map((group, index) => {
        const items = treatments.filter((t) => t.category === group.category);
        if (items.length === 0) return null;

        return (
          <Section
            key={group.category}
            tone={index % 2 === 0 ? 'white' : 'canvas'}
            space="tight"
            ariaLabelledBy={`fees-${group.category}`}
          >
            <SectionHeading
              id={`fees-${group.category}`}
              title={group.title}
              lede={group.note}
              level={2}
            />

            <Reveal className="mt-8">
              <div className="overflow-hidden rounded-card border border-line bg-white">
                <ul>
                  {items.map((treatment, i) => (
                    <li key={treatment.slug}>
                      {i > 0 && <Divider />}
                      <Link
                        href={`/treatments/${treatment.slug}`}
                        className="flex items-center justify-between gap-6 px-5 py-4 transition-colors duration-[--duration-feedback] hover:bg-canvas focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-blue sm:px-6"
                      >
                        <span className="min-w-0">
                          <span className="block text-[0.9375rem] font-medium text-ink">
                            {treatment.name}
                          </span>
                          <span className="mt-1 flex items-center gap-1.5 text-xs text-grey-strong">
                            <Clock className="size-3.5" aria-hidden="true" />
                            <span className="tabular-nums">
                              {formatDuration(treatment.durationMinutes)}
                            </span>
                          </span>
                        </span>
                        <span className="flex shrink-0 items-center gap-3">
                          <span className="text-right">
                            <span className="block text-[1.0625rem] font-semibold tabular-nums text-ink">
                              {treatment.priceFromCents
                                ? `From ${formatPrice(treatment.priceFromCents)}`
                                : 'On assessment'}
                            </span>
                          </span>
                          <ArrowRight
                            className="size-4 text-grey-light"
                            aria-hidden="true"
                          />
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          </Section>
        );
      })}

      {/* Deposits */}
      <Section tone="ink" ariaLabelledBy="deposits-heading">
        <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
          <Reveal>
            <p className="text-eyebrow text-white/55">Deposits</p>
            <h2
              id="deposits-heading"
              className="mt-3 text-[1.75rem] font-semibold leading-[1.15] text-white sm:text-[2.125rem]"
            >
              When a deposit applies
            </h2>
            <p className="mt-5 text-[1.0625rem] leading-relaxed text-white/70">
              Most appointments need no deposit at all. Two types do, because
              they hold back time that is genuinely in short supply, and a
              deposit is what makes same-day urgent care possible.
            </p>
            <p className="mt-4 text-[0.9375rem] leading-relaxed text-white/60">
              Any deposit you pay comes off the cost of your treatment. It is
              not an extra charge.
            </p>
          </Reveal>

          <Reveal delay={80}>
            <ul className="flex flex-col gap-3">
              {[
                {
                  name: 'Check-ups, hygiene and most consultations',
                  value: 'No deposit',
                  detail: 'Settle at reception on the day.',
                },
                {
                  name: 'Emergency consultation',
                  value: 'R250',
                  detail: 'Holds a same-day slot that is otherwise kept free.',
                },
                {
                  name: 'Whitening consultation',
                  value: 'R300',
                  detail: 'Comes off the cost of your whitening.',
                },
                {
                  name: 'Implant consultation',
                  value: 'R500, optional',
                  detail: 'Entirely up to you. Pay now or on the day.',
                },
              ].map((row) => (
                <li
                  key={row.name}
                  className="rounded-card border border-line-dark bg-white/[0.04] p-4"
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                    <p className="text-[0.9375rem] font-medium text-white">
                      {row.name}
                    </p>
                    <p className="text-[0.9375rem] font-semibold tabular-nums text-white">
                      {row.value}
                    </p>
                  </div>
                  <p className="mt-1 text-[0.8125rem] text-white/55">
                    {row.detail}
                  </p>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </Section>

      {/* FAQ */}
      <Section tone="white" ariaLabelledBy="fees-faq">
        <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
          <div>
            <SectionHeading
              id="fees-faq"
              eyebrow="Questions"
              title="About our fees"
            />
            <Reveal className="mt-8">
              <ButtonLink href="/book">
                Book an appointment
                <ArrowRight className="size-4" aria-hidden="true" />
              </ButtonLink>
            </Reveal>
          </div>
          <Reveal>
            <FaqAccordion faqs={pricingFaqs} />
          </Reveal>
        </div>
      </Section>

      <JsonLd schema={faqSchema(pricingFaqs)} />
    </>
  );
}
