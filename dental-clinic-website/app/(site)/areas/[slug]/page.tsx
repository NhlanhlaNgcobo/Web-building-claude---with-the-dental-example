import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowRight, Car, Clock, MapPin, Navigation } from 'lucide-react';
import { AvailabilityCard } from '@/components/booking/AvailabilityCard';
import { MapPanel } from '@/components/layout/MapPanel';
import { PageHero } from '@/components/layout/PageHero';
import { TreatmentCard } from '@/components/services/TreatmentCard';
import { ButtonAnchor, ButtonLink } from '@/components/ui/Button';
import { Reveal } from '@/components/ui/Reveal';
import { Section, SectionHeading } from '@/components/ui/Section';
import { areas, getArea } from '@/data/areas';
import { clinic } from '@/data/clinic';
import { popularTreatments } from '@/data/treatments';
import { JsonLd, breadcrumbSchema, pageMetadata } from '@/lib/seo';

/**
 * Location pages.
 *
 * There are two, and they carry real travel, parking and landmark detail for
 * their area. The route is data-driven so the practice can add a third when
 * there is genuinely something area-specific to say, but the architecture
 * existing is not an invitation to generate a dozen pages that differ only by
 * place name. Those help nobody and search engines treat them as what they
 * are.
 */
export function generateStaticParams() {
  return areas.map((area) => ({ slug: area.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<'/areas/[slug]'>): Promise<Metadata> {
  const { slug } = await params;
  const area = getArea(slug);
  if (!area) return {};

  return pageMetadata({
    title: `Dentist for ${area.name} patients`,
    description: area.intro.slice(0, 155),
    path: `/areas/${area.slug}`,
  });
}

export default async function AreaPage({ params }: PageProps<'/areas/[slug]'>) {
  const { slug } = await params;
  const area = getArea(slug);
  if (!area) notFound();

  const treatments = popularTreatments().slice(0, 3);

  return (
    <>
      <PageHero
        eyebrow={`Patients from ${area.name}`}
        title={area.headline}
        lede={area.intro}
        crumbs={[
          { name: 'Contact', path: '/contact' },
          { name: area.name, path: `/areas/${area.slug}` },
        ]}
      />

      <div className="bg-white">
        <div className="container-page py-12 lg:py-16">
          <div className="grid gap-12 lg:grid-cols-[1fr_minmax(0,22rem)] lg:gap-16">
            <div className="min-w-0">
              <div>
                <h2 className="flex items-center gap-2.5 text-[1.0625rem] font-semibold text-ink">
                  <Navigation className="size-4 text-blue" aria-hidden="true" />
                  Getting here from {area.name}
                </h2>
                <p className="mt-3 text-[0.9375rem] leading-relaxed text-charcoal">
                  {area.travel}
                </p>
              </div>

              <div className="mt-8">
                <h2 className="flex items-center gap-2.5 text-[1.0625rem] font-semibold text-ink">
                  <Car className="size-4 text-blue" aria-hidden="true" />
                  Parking
                </h2>
                <p className="mt-3 text-[0.9375rem] leading-relaxed text-charcoal">
                  {area.parking}
                </p>
              </div>

              <div className="mt-8">
                <h2 className="flex items-center gap-2.5 text-[1.0625rem] font-semibold text-ink">
                  <MapPin className="size-4 text-blue" aria-hidden="true" />
                  Worth knowing
                </h2>
                <ul className="mt-3 flex flex-col gap-2">
                  {area.landmarks.map((landmark) => (
                    <li
                      key={landmark}
                      className="flex items-start gap-2.5 text-[0.9375rem] leading-relaxed text-grey-strong"
                    >
                      <span
                        className="mt-2 size-1.5 shrink-0 rounded-full bg-blue"
                        aria-hidden="true"
                      />
                      {landmark}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-8 rounded-card border border-line bg-canvas p-5">
                <h2 className="flex items-center gap-2.5 text-[0.9375rem] font-semibold text-ink">
                  <Clock className="size-4 text-blue" aria-hidden="true" />
                  Opening hours
                </h2>
                <ul className="mt-3 grid gap-1.5 sm:grid-cols-2">
                  {clinic.openingHours.map((day) => (
                    <li
                      key={day.day}
                      className="flex justify-between gap-4 text-[0.8125rem] text-grey-strong sm:max-w-[16rem]"
                    >
                      <span>{day.day}</span>
                      <span className="tabular-nums">
                        {day.opens ? `${day.opens} to ${day.closes}` : 'Closed'}
                      </span>
                    </li>
                  ))}
                </ul>
                <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                  <ButtonLink href="/book">Book an appointment</ButtonLink>
                  <ButtonAnchor
                    href={`tel:${clinic.telephone.e164}`}
                    variant="secondary"
                  >
                    {clinic.telephone.display}
                  </ButtonAnchor>
                </div>
              </div>

              <div className="mt-8">
                <MapPanel />
              </div>
            </div>

            <div className="lg:sticky lg:top-24 lg:self-start">
              <AvailabilityCard tone="light" />
            </div>
          </div>
        </div>
      </div>

      <Section tone="canvas" ariaLabelledBy="area-treatments">
        <SectionHeading
          id="area-treatments"
          title="What patients book most"
          level={2}
        />
        <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {treatments.map((treatment, index) => (
            <Reveal as="li" key={treatment.slug} delay={index * 60}>
              <TreatmentCard treatment={treatment} />
            </Reveal>
          ))}
        </ul>
        <Reveal className="mt-8">
          <Link
            href="/treatments"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-blue underline decoration-blue/30 underline-offset-2 hover:decoration-blue"
          >
            All treatments
            <ArrowRight className="size-3.5" aria-hidden="true" />
          </Link>
        </Reveal>
      </Section>

      <JsonLd
        schema={breadcrumbSchema([
          { name: 'Home', path: '/' },
          { name: 'Contact', path: '/contact' },
          { name: area.name, path: `/areas/${area.slug}` },
        ])}
      />
    </>
  );
}
