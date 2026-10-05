import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowRight, Check, Clock } from 'lucide-react';
import { PageHero } from '@/components/layout/PageHero';
import { ButtonLink } from '@/components/ui/Button';
import { Reveal } from '@/components/ui/Reveal';
import { Section, SectionHeading } from '@/components/ui/Section';
import { dentistSeeds } from '@/data/dentists';
import { BLUR_PLACEHOLDER } from '@/data/images';
import { formatPriceFrom } from '@/lib/currency';
import { getDentistBySlug, getDentistServices } from '@/lib/queries';
import { JsonLd, dentistPersonSchema, pageMetadata } from '@/lib/seo';

/**
 * Dentist profile.
 *
 * Statically generated per dentist. The biography describes approach and
 * clinical interests and deliberately lists no qualifications, registration
 * numbers or years of experience, since none of that should be published
 * without being checked against the practitioner's own records.
 */
export function generateStaticParams() {
  return dentistSeeds.map((dentist) => ({ slug: dentist.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<'/team/[slug]'>): Promise<Metadata> {
  const { slug } = await params;
  const dentist = await getDentistBySlug(slug);
  if (!dentist) return {};

  const name = `${dentist.title} ${dentist.firstName} ${dentist.lastName}`;
  return pageMetadata({
    title: `${name}, dentist in Durban`,
    description: `${name} is a ${dentist.role.toLowerCase()} at Harbour Dental Studio on Florida Road, Morningside. ${dentist.focusAreas.join(', ')}.`,
    path: `/team/${dentist.slug}`,
    image: dentist.photoUrl,
    type: 'article',
  });
}

const weekdayNames = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

export default async function DentistPage({
  params,
}: PageProps<'/team/[slug]'>) {
  const { slug } = await params;
  const dentist = await getDentistBySlug(slug);
  if (!dentist) notFound();

  const [services, others] = await Promise.all([
    getDentistServices(dentist.id),
    Promise.resolve(dentistSeeds.filter((d) => d.slug !== slug)),
  ]);

  const seed = dentistSeeds.find((d) => d.slug === slug);
  const fullName = `${dentist.title} ${dentist.firstName} ${dentist.lastName}`;

  return (
    <>
      <PageHero
        eyebrow="The dentists"
        title={fullName}
        lede={dentist.role}
        crumbs={[
          { name: 'About', path: '/about' },
          { name: fullName, path: `/team/${dentist.slug}` },
        ]}
      />

      <div className="bg-white">
        <div className="container-page py-12 lg:py-16">
          <div className="grid gap-12 lg:grid-cols-[minmax(0,22rem)_1fr] lg:gap-16">
            {/* Portrait and booking */}
            <div className="lg:sticky lg:top-24 lg:self-start">
              <Reveal>
                <div className="relative aspect-[4/5] overflow-hidden rounded-card bg-canvas-deep">
                  <Image
                    src={dentist.photoUrl}
                    alt={`${fullName}, ${dentist.role} at Harbour Dental Studio`}
                    fill
                    priority
                    sizes="(min-width: 1024px) 22rem, 92vw"
                    placeholder="blur"
                    blurDataURL={BLUR_PLACEHOLDER}
                    className="object-cover"
                  />
                </div>
              </Reveal>

              <div className="mt-5 rounded-card glass-light p-5">
                <h2 className="text-[0.9375rem] font-semibold text-ink">
                  Book with {dentist.title} {dentist.lastName}
                </h2>
                <p className="mt-1.5 text-[0.8125rem] leading-relaxed text-grey-strong">
                  Choosing a specific dentist usually means waiting a little
                  longer than taking the first available appointment.
                </p>
                <ButtonLink
                  href={`/book?dentist=${dentist.id}`}
                  block
                  className="mt-4"
                >
                  See available times
                  <ArrowRight className="size-4" aria-hidden="true" />
                </ButtonLink>
              </div>

              {/* Working pattern, which is genuinely useful when choosing. */}
              {seed && (
                <div className="mt-4 rounded-card border border-line bg-canvas p-5">
                  <h2 className="flex items-center gap-2 text-[0.9375rem] font-semibold text-ink">
                    <Clock className="size-4 text-blue" aria-hidden="true" />
                    Usually in the practice
                  </h2>
                  <ul className="mt-3 flex flex-col gap-1.5">
                    {seed.schedule.map((day) => (
                      <li
                        key={day.dayOfWeek}
                        className="flex justify-between gap-4 text-[0.8125rem] text-grey-strong"
                      >
                        <span>{weekdayNames[day.dayOfWeek]}</span>
                        <span className="tabular-nums">
                          {day.start} to {day.end}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-3 text-xs text-grey-strong">
                    Leave and training are reflected in the live booking
                    calendar.
                  </p>
                </div>
              )}
            </div>

            {/* Biography */}
            <div className="min-w-0">
              <h2 className="text-[1.375rem] font-semibold text-ink">
                About {dentist.title} {dentist.lastName}
              </h2>
              <p className="mt-4 text-[1.0625rem] leading-relaxed text-charcoal">
                {dentist.bio}
              </p>

              <div className="mt-10">
                <h2 className="text-[1.0625rem] font-semibold text-ink">
                  Clinical interests
                </h2>
                <ul className="mt-4 flex flex-wrap gap-2">
                  {dentist.focusAreas.map((area) => (
                    <li
                      key={area}
                      className="rounded-panel bg-blue-soft px-3 py-1.5 text-[0.8125rem] font-medium text-blue-deep"
                    >
                      {area}
                    </li>
                  ))}
                </ul>
              </div>

              {services.length > 0 && (
                <div className="mt-10">
                  <h2 className="text-[1.0625rem] font-semibold text-ink">
                    Appointments you can book with {dentist.title}{' '}
                    {dentist.lastName}
                  </h2>
                  <ul className="mt-4 overflow-hidden rounded-card border border-line">
                    {services.map((service, index) => (
                      <li
                        key={service.id}
                        className={
                          index > 0 ? 'border-t border-line' : undefined
                        }
                      >
                        <Link
                          href={`/book?service=${service.slug}&dentist=${dentist.id}`}
                          className="flex items-center justify-between gap-4 bg-white px-4 py-3.5 transition-colors duration-[--duration-feedback] hover:bg-canvas focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-blue"
                        >
                          <span className="min-w-0">
                            <span className="flex items-center gap-2 text-[0.9375rem] font-medium text-ink">
                              <Check
                                className="size-3.5 shrink-0 text-blue"
                                aria-hidden="true"
                              />
                              {service.name}
                            </span>
                          </span>
                          <span className="shrink-0 text-[0.8125rem] tabular-nums text-grey-strong">
                            {formatPriceFrom(service.priceFromCents, '')}
                          </span>
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

      {/* Other dentists */}
      {others.length > 0 && (
        <Section tone="canvas" ariaLabelledBy="other-dentists">
          <SectionHeading
            id="other-dentists"
            title="The rest of the team"
            level={2}
          />
          <ul className="mt-8 grid gap-4 sm:grid-cols-2">
            {others.map((other) => (
              <li key={other.slug}>
                <Link
                  href={`/team/${other.slug}`}
                  className="flex items-center gap-4 rounded-card border border-line bg-white p-4 transition-[border-color] duration-[--duration-feedback] hover:border-blue focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue"
                >
                  <span className="relative size-14 shrink-0 overflow-hidden rounded-full bg-canvas-deep">
                    <Image
                      src={other.photoUrl}
                      alt=""
                      fill
                      sizes="56px"
                      placeholder="blur"
                      blurDataURL={BLUR_PLACEHOLDER}
                      className="object-cover"
                    />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[0.9375rem] font-semibold text-ink">
                      {other.title} {other.firstName} {other.lastName}
                    </span>
                    <span className="mt-0.5 block truncate text-[0.8125rem] text-grey-strong">
                      {other.role}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Section>
      )}

      <JsonLd
        schema={dentistPersonSchema({
          slug: dentist.slug,
          title: dentist.title,
          firstName: dentist.firstName,
          lastName: dentist.lastName,
          role: dentist.role,
          photoUrl: dentist.photoUrl,
        })}
      />
    </>
  );
}
