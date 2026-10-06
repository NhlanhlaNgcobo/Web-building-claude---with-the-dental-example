import type { Metadata } from 'next';
import { BatteryCharging, Check, ShieldCheck } from 'lucide-react';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { ButtonLink } from '@/components/ui/Button';
import { FaqAccordion } from '@/components/ui/FaqAccordion';
import { Reveal } from '@/components/ui/Reveal';
import { Section, SectionHeading } from '@/components/ui/Section';
import {
  conditionDefinitions,
  refurbishedFaqs,
  refurbishmentSteps,
} from '@/data/conditions';
import { store } from '@/data/store';
import { JsonLd, breadcrumbSchema, faqSchema, pageMetadata } from '@/lib/seo';

export const metadata: Metadata = pageMetadata({
  title: 'How we grade and test every device',
  description:
    'Our five condition grades, what each one looks like, the guaranteed minimum battery health for each, and the checklist every device goes through before it reaches the shelf.',
  path: '/grading',
});

const crumbs = [
  { name: 'Home', path: '/' },
  { name: 'How we grade', path: '/grading' },
];

export default function GradingPage() {
  return (
    <>
      <JsonLd schema={breadcrumbSchema(crumbs)} />
      <JsonLd schema={faqSchema(refurbishedFaqs)} />

      <div className="border-b border-line bg-white pt-16 lg:pt-[4.5rem]">
        <div className="container-page py-8 lg:py-14">
          <Breadcrumbs items={crumbs} />
          <h1 className="text-display mt-5 max-w-3xl text-[2rem] text-ink sm:text-[2.75rem]">
            Vague grading is the whole problem. So ours is not vague.
          </h1>
          <p className="mt-5 max-w-2xl text-pretty text-[1.0625rem] leading-relaxed text-grey-strong">
            Refurbished electronics has a trust problem, and almost all of it
            comes from one thing: somebody buys a device described as excellent
            and receives something scuffed. Below is exactly what each of our
            five grades means, what battery health we guarantee for each, and
            what the device goes through before it is allowed on the shelf.
          </p>
          <p className="mt-4 max-w-2xl text-pretty text-[0.9375rem] leading-relaxed text-grey-strong">
            If a device does not meet its grade when it reaches final check, it
            gets regraded and repriced. It does not get sent out and argued
            about afterwards.
          </p>
        </div>
      </div>

      {/* ---------------- The grades ---------------- */}
      <Section tone="white" ariaLabelledBy="grades-heading">
        <SectionHeading
          id="grades-heading"
          eyebrow="The five grades"
          title="What you will actually receive"
        />

        <div className="mt-10 flex flex-col gap-4">
          {conditionDefinitions.map((definition, index) => (
            <Reveal key={definition.grade} delay={Math.min(index, 3) * 60}>
              <article className="grid gap-6 rounded-card border border-line bg-white p-6 lg:grid-cols-[14rem_1fr] lg:gap-10 lg:p-8">
                <div>
                  <h3 className="text-[1.125rem] font-bold text-ink">
                    {definition.label}
                  </h3>
                  <p className="mt-1 text-[0.875rem] text-grey-strong">
                    {definition.summary}
                  </p>

                  <dl className="mt-5 flex flex-col gap-3">
                    <div className="flex items-start gap-2.5">
                      <BatteryCharging
                        className="mt-0.5 size-4 shrink-0 text-leaf"
                        aria-hidden="true"
                      />
                      <div>
                        <dt className="text-[0.6875rem] font-semibold uppercase text-grey-strong">
                          Battery
                        </dt>
                        <dd className="text-spec text-[0.8125rem] font-medium text-ink">
                          {definition.batteryMin === null
                            ? 'Sealed, as shipped'
                            : `${definition.batteryMin}% minimum`}
                        </dd>
                      </div>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <ShieldCheck
                        className="mt-0.5 size-4 shrink-0 text-leaf"
                        aria-hidden="true"
                      />
                      <div>
                        <dt className="text-[0.6875rem] font-semibold uppercase text-grey-strong">
                          Typical price
                        </dt>
                        <dd className="text-[0.8125rem] font-medium text-ink">
                          {definition.typicalSaving}
                        </dd>
                      </div>
                    </div>
                  </dl>
                </div>

                <div>
                  <h4 className="text-[0.6875rem] font-semibold uppercase text-grey-strong">
                    What it looks like
                  </h4>
                  <p className="mt-2 text-pretty text-[0.9375rem] leading-relaxed text-ink">
                    {definition.cosmetic}
                  </p>

                  <h4 className="mt-6 text-[0.6875rem] font-semibold uppercase text-grey-strong">
                    What comes with it
                  </h4>
                  <ul className="mt-2 flex flex-col gap-1.5">
                    {definition.includes.map((item) => (
                      <li key={item} className="flex items-start gap-2.5">
                        <Check
                          className="mt-1 size-3.5 shrink-0 text-leaf"
                          aria-hidden="true"
                        />
                        <span className="text-pretty text-[0.875rem] leading-relaxed text-grey-strong">
                          {item}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <p className="mt-5 rounded-panel bg-paper px-4 py-3 text-pretty text-[0.8125rem] leading-relaxed text-ink">
                    <span className="font-semibold">Suits: </span>
                    {definition.suits}
                  </p>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* ---------------- The checklist ---------------- */}
      <Section tone="ink" ariaLabelledBy="process-heading">
        <SectionHeading
          id="process-heading"
          eyebrow="Before it reaches the shelf"
          title="Every device, the same checklist"
          lede="Not a sample. Every one, whether it came from a trade in or a bulk purchase."
          tone="dark"
        />

        <ol className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {refurbishmentSteps.map((step, index) => (
            <Reveal as="li" key={step.title} delay={Math.min(index, 3) * 60}>
              <div className="flex h-full flex-col rounded-card border border-line-dark bg-white/[0.04] p-5">
                <span className="text-spec text-[0.75rem] font-medium text-white/45">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <h3 className="mt-3 text-[1rem] font-bold text-white">
                  {step.title}
                </h3>
                <p className="mt-2 text-pretty text-[0.875rem] leading-relaxed text-white/65">
                  {step.detail}
                </p>
              </div>
            </Reveal>
          ))}
        </ol>

        <p className="mt-10 max-w-2xl text-pretty text-[0.9375rem] leading-relaxed text-white/70">
          Anything that fails at any stage is repaired and retested, or it does
          not get sold. There is no grade below Fair, because a device we would
          not be happy to own is not something we should be selling you.
        </p>
      </Section>

      {/* ---------------- Warranty ---------------- */}
      <Section tone="white" space="tight" ariaLabelledBy="warranty-heading">
        <div className="grid gap-8 rounded-card border border-line bg-paper p-6 lg:grid-cols-[1fr_auto] lg:items-center lg:gap-12 lg:p-10">
          <div>
            <h2
              id="warranty-heading"
              className="text-display text-[1.5rem] text-ink sm:text-[1.875rem]"
            >
              {store.usedWarrantyMonths} months, and it is ours
            </h2>
            <p className="mt-4 max-w-2xl text-pretty text-[1rem] leading-relaxed text-grey-strong">
              Every used device carries a {store.usedWarrantyMonths} month
              warranty from us, covering anything that is not accidental damage
              or ordinary battery decline. You deal with us rather than with a
              manufacturer, which means you can phone the shop and speak to the
              person who tested it.
            </p>
            <p className="mt-3 max-w-2xl text-pretty text-[0.9375rem] leading-relaxed text-grey-strong">
              Sealed stock carries the manufacturer warranty instead, which is
              theirs rather than ours. Both are stated on the product page, so
              you always know whose promise you are holding.
            </p>
          </div>
          <ButtonLink href="/help/warranty" variant="secondary" className="shrink-0">
            What the warranty covers
          </ButtonLink>
        </div>
      </Section>

      {/* ---------------- FAQ ---------------- */}
      <Section tone="white" ariaLabelledBy="faq-heading">
        <SectionHeading
          id="faq-heading"
          eyebrow="Questions"
          title="The ones worth answering properly"
        />
        <div className="mt-8 max-w-3xl">
          <FaqAccordion faqs={refurbishedFaqs} />
        </div>

        <div className="mt-12 flex flex-col gap-3 sm:flex-row">
          <ButtonLink href="/shop">See what is in stock</ButtonLink>
          <ButtonLink href="/contact" variant="secondary">
            Ask us something else
          </ButtonLink>
        </div>
      </Section>
    </>
  );
}
