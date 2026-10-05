import type { Metadata } from 'next';
import Image from 'next/image';
import { Check } from 'lucide-react';
import { DentistCard } from '@/components/layout/DentistCard';
import { MapPanel } from '@/components/layout/MapPanel';
import { PageHero } from '@/components/layout/PageHero';
import { BeforeAfterGallery } from '@/components/social-proof/BeforeAfterGallery';
import { TestimonialSection } from '@/components/social-proof/TestimonialSection';
import { ButtonLink } from '@/components/ui/Button';
import { Reveal } from '@/components/ui/Reveal';
import { Section, SectionHeading } from '@/components/ui/Section';
import { clinic } from '@/data/clinic';
import { BLUR_PLACEHOLDER, clinicImages } from '@/data/images';
import { approachPoints } from '@/data/trust';
import { getDentists } from '@/lib/queries';
import { pageMetadata } from '@/lib/seo';

export const metadata: Metadata = pageMetadata({
  title: 'About the practice',
  description:
    'A private dental practice on Florida Road, Morningside. How we work, the technology we use and the three dentists you can book with.',
  path: '/about',
});

/**
 * About.
 *
 * Describes how the practice actually operates rather than offering a mission
 * statement. Everything on this page is something a patient can verify at
 * their appointment.
 */
const howWeWork = [
  {
    title: 'We explain before we treat',
    detail:
      'Scans and photographs go on the screen beside the chair, and we talk through what we are looking at. It is much easier to decide about treatment when you can see what is being discussed, and most people have never been shown their own teeth before.',
  },
  {
    title: 'Treatment is planned, not improvised',
    detail:
      'Anything beyond a check-up or a cleaning comes to you as a written plan: what is recommended, in what order, and what each item costs. You take it away and think about it. Nothing is booked in the meantime.',
  },
  {
    title: 'Prevention gets the time it deserves',
    detail:
      'We would rather spend ten minutes working out why decay keeps appearing in the same place than fill it again in two years. Your check and hygiene interval is set by your own risk rather than a default six months.',
  },
  {
    title: 'Comfort is a clinical matter',
    detail:
      'If you are tense, treatment is harder for both of us. Tell reception when you book and we will allow more time. A fair number of our patients have avoided the dentist for years, and the first appointment is an assessment and a conversation rather than treatment.',
  },
  {
    title: 'We are conservative with healthy tooth',
    detail:
      'Where a smaller intervention will do the job we use it, and where watching something is reasonable we say so. Enamel does not grow back, so removing it is a decision rather than a default.',
  },
  {
    title: 'You can reach us',
    detail:
      'Reception answers the telephone during opening hours and replies on WhatsApp. Booking, moving and cancelling are all possible online at any hour, from the real diary rather than a request form.',
  },
];

export default async function AboutPage() {
  const dentists = await getDentists();

  return (
    <>
      <PageHero
        eyebrow="The practice"
        title="A dental practice built around explaining things"
        lede="We are a private practice on Florida Road in Morningside, seeing patients from across Durban and the north coast. Three dentists, one hygiene-focused approach, and a strong preference for telling you exactly what is going on."
        crumbs={[{ name: 'About', path: '/about' }]}
      />

      {/* Photography */}
      <div className="bg-canvas">
        <div className="container-page pb-4">
          <Reveal>
            <div className="relative aspect-[16/9] overflow-hidden rounded-card bg-canvas-deep lg:aspect-[21/9]">
              <Image
                src={clinicImages.reception.src}
                alt={clinicImages.reception.alt}
                fill
                priority
                sizes="100vw"
                placeholder="blur"
                blurDataURL={BLUR_PLACEHOLDER}
                className="object-cover"
              />
            </div>
          </Reveal>
        </div>
      </div>

      {/* How we work */}
      <Section tone="canvas" ariaLabelledBy="how-heading">
        <SectionHeading
          id="how-heading"
          eyebrow="How we work"
          title="Six things we do as standard"
          lede="Not aspirations. These are the things that shape how an appointment here actually goes."
        />

        <ul className="mt-12 grid gap-x-12 gap-y-10 lg:grid-cols-2">
          {howWeWork.map((item, index) => (
            <Reveal as="li" key={item.title} delay={Math.min(index, 3) * 60}>
              <h3 className="flex items-start gap-3 text-[1.0625rem] font-semibold text-ink">
                <Check
                  className="mt-1 size-4 shrink-0 text-blue"
                  aria-hidden="true"
                />
                {item.title}
              </h3>
              <p className="mt-2 pl-7 text-[0.9375rem] leading-relaxed text-grey-strong">
                {item.detail}
              </p>
            </Reveal>
          ))}
        </ul>
      </Section>

      {/* Team */}
      <Section tone="white" id="team" ariaLabelledBy="team-heading">
        <SectionHeading
          id="team-heading"
          eyebrow="The dentists"
          title="Who you will see"
          lede="Book with whoever is free soonest, or choose the dentist whose focus matches what you need."
        />

        <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {dentists.map((dentist, index) => (
            <Reveal as="li" key={dentist.id} delay={index * 60}>
              <DentistCard dentist={dentist} showBio />
            </Reveal>
          ))}
        </ul>
      </Section>

      {/* Technology, framed as what it changes for the patient */}
      <Section tone="ink" ariaLabelledBy="tech-heading">
        <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
          <Reveal>
            <p className="text-eyebrow text-white/55">Equipment</p>
            <h2
              id="tech-heading"
              className="mt-3 text-[1.75rem] font-semibold leading-[1.15] text-white sm:text-[2.125rem]"
            >
              Technology, and why it matters to you
            </h2>
            <p className="mt-5 text-[1.0625rem] leading-relaxed text-white/70">
              Equipment is only worth mentioning if it changes something for the
              person in the chair. Here is what ours changes.
            </p>
            <ButtonLink href="/book" variant="onDark" className="mt-8">
              Book an appointment
            </ButtonLink>
          </Reveal>

          <Reveal delay={80}>
            <ul className="flex flex-col gap-4">
              {approachPoints.map((point) => (
                <li
                  key={point.title}
                  className="rounded-card border border-line-dark bg-white/[0.04] p-5"
                >
                  <h3 className="text-[0.9375rem] font-semibold text-white">
                    {point.title}
                  </h3>
                  <p className="mt-1.5 text-[0.8125rem] leading-relaxed text-white/60">
                    {point.detail}
                  </p>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </Section>

      {/*
        Social proof. Both components render nothing while their data files are
        empty, which is how the site ships with no invented review or patient
        case anywhere on it. See data/social-proof.ts.
      */}
      <TestimonialSection />
      <BeforeAfterGallery />

      {/* Location */}
      <Section tone="canvas" ariaLabelledBy="find-heading">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
          <Reveal>
            <p className="text-eyebrow">Finding us</p>
            <h2
              id="find-heading"
              className="mt-3 text-[1.75rem] font-semibold leading-[1.15] text-ink sm:text-[2.125rem]"
            >
              On Florida Road, Morningside
            </h2>
            <p className="mt-5 text-[0.9375rem] leading-relaxed text-grey-strong">
              {clinic.parking.detail}
            </p>
            <ul className="mt-8 flex flex-col gap-4 border-t border-line pt-6">
              {clinic.directions.map((direction) => (
                <li key={direction.from}>
                  <h3 className="text-[0.8125rem] font-semibold text-ink">
                    {direction.from}
                  </h3>
                  <p className="mt-1 text-sm leading-relaxed text-grey-strong">
                    {direction.detail}
                  </p>
                </li>
              ))}
            </ul>
          </Reveal>
          <Reveal delay={80}>
            <MapPanel />
          </Reveal>
        </div>
      </Section>
    </>
  );
}
