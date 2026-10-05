import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ArrowRight,
  Check,
  CreditCard,
  Info,
  Siren,
  Users,
} from 'lucide-react';
import { PageHero } from '@/components/layout/PageHero';
import { NextAvailableCta } from '@/components/services/NextAvailableCta';
import { TreatmentCard } from '@/components/services/TreatmentCard';
import { ButtonAnchor, ButtonLink } from '@/components/ui/Button';
import { FaqAccordion } from '@/components/ui/FaqAccordion';
import { Reveal } from '@/components/ui/Reveal';
import { Section, SectionHeading } from '@/components/ui/Section';
import { clinic } from '@/data/clinic';
import { BLUR_PLACEHOLDER, treatmentImages } from '@/data/images';
import { getTreatment, treatments } from '@/data/treatments';
import { formatDuration } from '@/lib/availability/tz';
import { formatPriceFrom } from '@/lib/currency';
import { recommendationsForTreatment, shouldSurfaceEmergency } from '@/lib/recommendations';
import {
  JsonLd,
  faqSchema,
  pageMetadata,
  treatmentSchema,
} from '@/lib/seo';

/**
 * Treatment pages.
 *
 * Statically generated, one per treatment, with the single volatile element
 * (the next available appointment) fetched client side. That keeps fifteen
 * content pages fast and cacheable without any of them showing a stale time.
 */
export function generateStaticParams() {
  return treatments.map((treatment) => ({ slug: treatment.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<'/treatments/[slug]'>): Promise<Metadata> {
  const { slug } = await params;
  const treatment = getTreatment(slug);
  if (!treatment) return {};

  return pageMetadata({
    // Written for the person reading the search result. The location appears
    // because it is genuinely how someone would search, not to pad the title.
    title: `${treatment.name} in Durban`,
    description: treatment.summary,
    path: `/treatments/${treatment.slug}`,
    type: 'article',
  });
}

export default async function TreatmentPage({
  params,
}: PageProps<'/treatments/[slug]'>) {
  const { slug } = await params;
  const treatment = getTreatment(slug);
  if (!treatment) notFound();

  const related = treatment.relatedTreatmentSlugs
    .map((s) => getTreatment(s))
    .filter((t): t is NonNullable<typeof t> => t !== undefined);

  const products = await recommendationsForTreatment(
    treatment.bookingServiceSlug,
  );
  const image = treatmentImages[treatment.slug];
  const surfaceEmergency = shouldSurfaceEmergency(treatment.category);

  return (
    <>
      <PageHero
        eyebrow={categoryLabel(treatment.category)}
        title={treatment.name}
        lede={treatment.intro}
        crumbs={[
          { name: 'Treatments', path: '/treatments' },
          { name: treatment.name, path: `/treatments/${treatment.slug}` },
        ]}
      />

      <div className="bg-white">
        <div className="container-page py-12 lg:py-16">
          <div className="grid gap-12 lg:grid-cols-[1fr_minmax(0,20rem)] lg:gap-16">
            {/* ---------------- Main content ---------------- */}
            <div className="min-w-0">
              {image && (
                <Reveal>
                  <div className="relative aspect-[16/9] overflow-hidden rounded-card bg-canvas-deep">
                    <Image
                      src={image}
                      alt={`${treatment.name} at Harbour Dental Studio`}
                      fill
                      priority
                      sizes="(min-width: 1024px) 64vw, 92vw"
                      placeholder="blur"
                      blurDataURL={BLUR_PLACEHOLDER}
                      className="object-cover"
                    />
                  </div>
                </Reveal>
              )}

              {/* Explanation */}
              <div className="mt-10">
                <h2 className="text-[1.375rem] font-semibold text-ink">
                  About {treatment.name.toLowerCase()}
                </h2>
                <div className="mt-4 flex flex-col gap-4">
                  {treatment.explanation.map((paragraph) => (
                    <p
                      key={paragraph.slice(0, 40)}
                      className="text-[1.0625rem] leading-relaxed text-charcoal"
                    >
                      {paragraph}
                    </p>
                  ))}
                </div>
              </div>

              {/* Suitability. Phrased as considerations, never as a diagnosis. */}
              <div className="mt-10 rounded-card border border-line bg-canvas p-5 sm:p-6">
                <h2 className="flex items-center gap-2 text-[1.0625rem] font-semibold text-ink">
                  <Users className="size-4 text-blue" aria-hidden="true" />
                  Who this may suit
                </h2>
                <ul className="mt-4 flex flex-col gap-2.5">
                  {treatment.suitableFor.map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-2.5 text-[0.9375rem] leading-relaxed text-charcoal"
                    >
                      <Check
                        className="mt-1 size-4 shrink-0 text-blue"
                        aria-hidden="true"
                      />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-5 flex items-start gap-2 border-t border-line-strong pt-4 text-[0.8125rem] leading-relaxed text-grey-strong">
                  <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                  <span>
                    This is general information rather than advice about your
                    own teeth. Whether this treatment is right for you needs an
                    examination.
                  </span>
                </p>
              </div>

              {/* What happens */}
              <div className="mt-10">
                <h2 className="text-[1.375rem] font-semibold text-ink">
                  What happens at the appointment
                </h2>
                <ol className="mt-5 flex flex-col gap-5">
                  {treatment.whatHappens.map((step, index) => (
                    <li key={step.title} className="flex gap-4">
                      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-ink text-xs font-semibold tabular-nums text-white">
                        {index + 1}
                      </span>
                      <div className="min-w-0">
                        <h3 className="text-[0.9375rem] font-semibold text-ink">
                          {step.title}
                        </h3>
                        <p className="mt-1 text-[0.9375rem] leading-relaxed text-grey-strong">
                          {step.detail}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>

              {/* Fees */}
              <div className="mt-10 rounded-card border border-line bg-white p-5 sm:p-6">
                <h2 className="text-[1.0625rem] font-semibold text-ink">
                  What it costs
                </h2>
                <div className="mt-3 flex flex-wrap items-baseline gap-x-6 gap-y-2">
                  <p className="text-[1.5rem] font-semibold tabular-nums text-ink">
                    {formatPriceFrom(
                      treatment.priceFromCents,
                      'Quoted after assessment',
                    )}
                  </p>
                  <p className="text-sm text-grey-strong">
                    <span className="tabular-nums">
                      {formatDuration(treatment.durationMinutes)}
                    </span>{' '}
                    appointment
                  </p>
                </div>
                {treatment.priceNote && (
                  <p className="mt-3 text-[0.8125rem] leading-relaxed text-grey-strong">
                    {treatment.priceNote}
                  </p>
                )}

                {/* Shown only for higher value treatment, and deliberately
                    worded so it does not advertise terms that are not set up. */}
                {treatment.supportsPaymentPlan && (
                  <p className="mt-4 flex items-start gap-2.5 border-t border-line pt-4 text-[0.8125rem] leading-relaxed text-grey-strong">
                    <CreditCard
                      className="mt-0.5 size-3.5 shrink-0 text-blue"
                      aria-hidden="true"
                    />
                    <span>
                      For treatment at this level, ask reception what payment
                      arrangements are currently possible when your plan is
                      drawn up. We would rather discuss it properly than
                      advertise terms that may not apply to your situation.
                    </span>
                  </p>
                )}
              </div>

              {/* FAQs */}
              {treatment.faqs.length > 0 && (
                <div className="mt-12">
                  <h2 className="text-[1.375rem] font-semibold text-ink">
                    Common questions
                  </h2>
                  <FaqAccordion faqs={treatment.faqs} className="mt-4" />
                </div>
              )}
            </div>

            {/* ---------------- Sidebar ---------------- */}
            <div className="lg:sticky lg:top-24 lg:self-start">
              <NextAvailableCta
                serviceSlug={treatment.bookingServiceSlug}
                ctaLabel={treatment.ctaLabel}
                durationMinutes={treatment.durationMinutes}
                priceLabel={formatPriceFrom(
                  treatment.priceFromCents,
                  'On assessment',
                )}
                treatmentName={treatment.name}
              />

              {surfaceEmergency && (
                <div className="mt-4 rounded-card border border-[--color-critical] bg-[--color-critical-soft] p-5">
                  <h2 className="flex items-center gap-2 text-[0.9375rem] font-semibold text-[--color-critical]">
                    <Siren className="size-4" aria-hidden="true" />
                    In pain right now?
                  </h2>
                  <p className="mt-2 text-[0.8125rem] leading-relaxed text-[--color-critical]">
                    Appointments are held back each morning for urgent
                    problems.
                  </p>
                  <div className="mt-4 flex flex-col gap-2">
                    <ButtonLink href="/emergency" size="sm" variant="critical">
                      Find the earliest appointment
                    </ButtonLink>
                    <ButtonAnchor
                      href={`tel:${clinic.telephone.e164}`}
                      size="sm"
                      variant="secondary"
                    >
                      Call {clinic.telephone.display}
                    </ButtonAnchor>
                  </div>
                </div>
              )}

              {products.length > 0 && (
                <div className="mt-4 rounded-card border border-line bg-canvas p-5">
                  <h2 className="text-[0.9375rem] font-semibold text-ink">
                    We often recommend
                  </h2>
                  <ul className="mt-4 flex flex-col gap-3">
                    {products.map((product) => (
                      <li key={product.id}>
                        <Link
                          href={`/shop/${product.slug}`}
                          className="flex items-center justify-between gap-3 rounded-panel bg-white p-3 transition-colors duration-[--duration-feedback] hover:bg-blue-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue"
                        >
                          <span className="min-w-0">
                            <span className="block truncate text-[0.8125rem] font-medium text-ink">
                              {product.name}
                            </span>
                          </span>
                          <ArrowRight
                            className="size-3.5 shrink-0 text-grey"
                            aria-hidden="true"
                          />
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

      {/* Related treatments */}
      {related.length > 0 && (
        <Section tone="canvas" ariaLabelledBy="related-heading">
          <SectionHeading
            id="related-heading"
            title="Related treatments"
            lede="Often considered alongside this one."
          />
          <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((item, index) => (
              <Reveal as="li" key={item.slug} delay={index * 60}>
                <TreatmentCard treatment={item} />
              </Reveal>
            ))}
          </ul>
        </Section>
      )}

      <JsonLd schema={treatmentSchema(treatment)} />
      {treatment.faqs.length > 0 && <JsonLd schema={faqSchema(treatment.faqs)} />}
    </>
  );
}

function categoryLabel(category: string): string {
  const labels: Record<string, string> = {
    general: 'Check-ups',
    hygiene: 'Hygiene',
    restorative: 'Repairing teeth',
    cosmetic: 'Appearance',
    surgical: 'Surgical',
    emergency: 'Urgent care',
  };
  return labels[category] ?? 'Treatment';
}
