import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowRight,
  CalendarCheck,
  ClipboardList,
  Clock,
  MapPin,
  MessagesSquare,
  Phone,
  Receipt,
  ScanLine,
  Siren,
} from 'lucide-react';
import { AvailabilityCard } from '@/components/booking/AvailabilityCard';
import { DentistCard } from '@/components/layout/DentistCard';
import { MapPanel } from '@/components/layout/MapPanel';
import { ProductCard } from '@/components/shop/ProductCard';
import { QuickSelector } from '@/components/services/QuickSelector';
import { TreatmentCard } from '@/components/services/TreatmentCard';
import { ButtonAnchor, ButtonLink } from '@/components/ui/Button';
import { FaqAccordion } from '@/components/ui/FaqAccordion';
import { Badge, Divider } from '@/components/ui/Primitives';
import { Reveal } from '@/components/ui/Reveal';
import { Section, SectionHeading } from '@/components/ui/Section';
import { addressLines, clinic, whatsappIntents, whatsappLink } from '@/data/clinic';
import { generalFaqs } from '@/data/faqs';
import { BLUR_PLACEHOLDER, clinicImages } from '@/data/images';
import { popularTreatments, treatments } from '@/data/treatments';
import { patientJourney, trustSignals } from '@/data/trust';
import { formatDuration } from '@/lib/availability/tz';
import { formatPrice } from '@/lib/currency';
import { getDentists, getProducts } from '@/lib/queries';
import { pageMetadata } from '@/lib/seo';
import type { Metadata } from 'next';

export const metadata: Metadata = pageMetadata({
  title: 'Dentist in Durban',
  description:
    'A private dental practice on Florida Road, Morningside. Clear treatment plans, published fees and real appointment availability online, with same-day urgent care.',
  path: '/',
});

const trustIcons = {
  ClipboardList: <ClipboardList className="size-5" aria-hidden="true" />,
  Receipt: <Receipt className="size-5" aria-hidden="true" />,
  CalendarCheck: <CalendarCheck className="size-5" aria-hidden="true" />,
  Siren: <Siren className="size-5" aria-hidden="true" />,
  ScanLine: <ScanLine className="size-5" aria-hidden="true" />,
  MessagesSquare: <MessagesSquare className="size-5" aria-hidden="true" />,
};

const pricingPreview = [
  'dental-examination',
  'professional-cleaning',
  'emergency-dentistry',
  'teeth-whitening',
];

export default async function HomePage() {
  const [dentists, products] = await Promise.all([
    getDentists(),
    getProducts(),
  ]);

  const featured = popularTreatments();
  const previewRows = pricingPreview
    .map((slug) => treatments.find((t) => t.slug === slug))
    .filter((t): t is NonNullable<typeof t> => t !== undefined);
  const shopRail = products.slice(0, 4);

  return (
    <>
      {/* ================= Hero ================= */}
      <section className="relative isolate overflow-hidden bg-ink">
        <Image
          src={clinicImages.hero.src}
          alt={clinicImages.hero.alt}
          fill
          priority
          sizes="100vw"
          placeholder="blur"
          blurDataURL={BLUR_PLACEHOLDER}
          className="object-cover object-center opacity-45"
        />
        {/* A flat scrim rather than a gradient, so the type stays legible
            without the image turning into a colour wash. */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-ink/55"
        />

        <div className="container-page relative pb-16 pt-32 sm:pb-20 sm:pt-36 lg:pb-28 lg:pt-44">
          <div className="grid items-end gap-12 lg:grid-cols-[1.15fr_0.85fr] lg:gap-16">
            <div className="max-w-2xl">
              <Badge tone="onDark" icon={<MapPin className="size-3" aria-hidden="true" />}>
                Florida Road, Morningside
              </Badge>

              <h1 className="mt-6 text-[2.25rem] font-semibold leading-[1.08] text-white sm:text-[3rem] lg:text-[3.5rem]">
                Confident dental care in Durban.
              </h1>

              <p className="mt-6 max-w-xl text-[1.0625rem] leading-relaxed text-white/75 sm:text-[1.125rem]">
                Modern dentistry explained properly, with written treatment
                plans, fees published before you commit, and appointments you
                can book online from the practice diary. Urgent problems are
                seen the same day wherever we can.
              </p>

              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <ButtonLink href="/book" size="lg" variant="onDark">
                  Book an Appointment
                </ButtonLink>
                <ButtonLink href="/treatments" size="lg" variant="onDarkGhost">
                  View Treatments
                </ButtonLink>
              </div>

              <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 text-[0.8125rem] text-white/60">
                <a
                  href={`tel:${clinic.telephone.e164}`}
                  className="flex items-center gap-2 transition-colors hover:text-white"
                >
                  <Phone className="size-4 shrink-0" aria-hidden="true" />
                  <span className="tabular-nums">{clinic.telephone.display}</span>
                </a>
                <span className="flex items-center gap-2">
                  <Clock className="size-4 shrink-0" aria-hidden="true" />
                  <span>
                    Mon to Thu 08:00 to 17:00, Fri until 16:00, Sat until 13:00
                  </span>
                </span>
              </div>
            </div>

            {/* The signature availability widget, reading live from the diary. */}
            <div className="lg:pb-2">
              <AvailabilityCard />
            </div>
          </div>
        </div>
      </section>

      {/* ================= Quick selector ================= */}
      <Section tone="white" space="normal" ariaLabelledBy="help-heading">
        <SectionHeading
          id="help-heading"
          eyebrow="Start here"
          title="What can we help you with?"
          lede="Pick what fits, or describe what you have noticed. Either way you land on the right appointment rather than a contact form."
        />
        <Reveal className="mt-10">
          <QuickSelector />
        </Reveal>
      </Section>

      {/* ================= Popular treatments ================= */}
      <Section tone="canvas" ariaLabelledBy="treatments-heading">
        <SectionHeading
          id="treatments-heading"
          eyebrow="Treatments"
          title="What patients come in for most"
          lede="Every treatment page explains what the appointment involves, who it may suit, how long it takes and what it costs."
          action={
            <ButtonLink href="/treatments" variant="secondary">
              All 15 treatments
              <ArrowRight className="size-4" aria-hidden="true" />
            </ButtonLink>
          }
        />

        <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((treatment, index) => (
            <Reveal
              as="li"
              key={treatment.slug}
              delay={Math.min(index, 3) * 60}
            >
              <TreatmentCard treatment={treatment} />
            </Reveal>
          ))}
        </ul>
      </Section>

      {/* ================= Trust ================= */}
      <Section tone="white" ariaLabelledBy="approach-heading">
        <SectionHeading
          id="approach-heading"
          eyebrow="How we work"
          title="No surprises, at any point"
          lede="Six things we do as standard. Each one is something you can check against this site or against what happens at your appointment."
        />

        <ul className="mt-12 grid gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
          {trustSignals.map((signal, index) => (
            <Reveal as="li" key={signal.title} delay={Math.min(index, 3) * 60}>
              <div className="flex gap-4">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-panel bg-blue-soft text-blue-deep">
                  {trustIcons[signal.icon]}
                </span>
                <div>
                  <h3 className="text-[0.9375rem] font-semibold text-ink">
                    {signal.href ? (
                      <Link
                        href={signal.href}
                        className="rounded-panel transition-colors duration-[--duration-feedback] hover:text-blue focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue"
                      >
                        {signal.title}
                      </Link>
                    ) : (
                      signal.title
                    )}
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-grey-strong">
                    {signal.detail}
                  </p>
                </div>
              </div>
            </Reveal>
          ))}
        </ul>
      </Section>

      {/* ================= Dentists ================= */}
      <Section tone="canvas" id="team" ariaLabelledBy="team-heading">
        <SectionHeading
          id="team-heading"
          eyebrow="The team"
          title="Three dentists, different strengths"
          lede="You can book with whoever is free soonest, or choose the dentist whose focus matches what you need."
          action={
            <ButtonLink href="/about#team" variant="secondary">
              About the practice
              <ArrowRight className="size-4" aria-hidden="true" />
            </ButtonLink>
          }
        />

        <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {dentists.map((dentist, index) => (
            <Reveal as="li" key={dentist.id} delay={index * 60}>
              <DentistCard dentist={dentist} />
            </Reveal>
          ))}
        </ul>
      </Section>

      {/* ================= Whitening feature ================= */}
      <Section tone="ink" space="loose" ariaLabelledBy="whitening-heading">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
          <Reveal>
            <p className="text-eyebrow text-white/55">Cosmetic</p>
            <h2
              id="whitening-heading"
              className="mt-3 text-[1.75rem] font-semibold leading-[1.15] text-white sm:text-[2.125rem] lg:text-[2.5rem]"
            >
              Whitening that is assessed first, not sold first
            </h2>
            <p className="mt-5 text-[1.0625rem] leading-relaxed text-white/70">
              Whitening changes the colour of the tooth itself, and done with
              trays made to fit you it is predictable and comfortable. It does
              not suit everyone, and it does not change the colour of crowns,
              veneers or existing white fillings.
            </p>
            <p className="mt-4 text-[0.9375rem] leading-relaxed text-white/60">
              That is why we start with a consultation: to check that your teeth
              and gums are healthy enough, record your starting shade, and plan
              around anything in your smile line that will not change. If
              whitening is not the right answer for you, we will say so.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <ButtonLink
                href="/book?service=whitening-consultation"
                size="lg"
                variant="onDark"
              >
                Book Whitening Consultation
              </ButtonLink>
              <ButtonLink
                href="/treatments/teeth-whitening"
                size="lg"
                variant="onDarkGhost"
              >
                How whitening works
              </ButtonLink>
            </div>
          </Reveal>

          <Reveal delay={80}>
            <div className="relative aspect-[4/3] overflow-hidden rounded-card">
              <Image
                src={clinicImages.treatmentRoomAlt.src}
                alt={clinicImages.treatmentRoomAlt.alt}
                fill
                sizes="(min-width: 1024px) 48vw, 92vw"
                placeholder="blur"
                blurDataURL={BLUR_PLACEHOLDER}
                className="object-cover"
              />
            </div>
          </Reveal>
        </div>
      </Section>

      {/* ================= Patient journey ================= */}
      <Section tone="white" ariaLabelledBy="journey-heading">
        <SectionHeading
          id="journey-heading"
          eyebrow="What to expect"
          title="From booking to maintenance"
        />

        <ol className="mt-12 grid gap-px overflow-hidden rounded-card border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
          {patientJourney.map((stage, index) => (
            <li key={stage.step} className="bg-white p-6">
              <span className="flex size-7 items-center justify-center rounded-full bg-ink text-xs font-semibold tabular-nums text-white">
                {index + 1}
              </span>
              <h3 className="mt-4 text-[0.9375rem] font-semibold text-ink">
                {stage.step}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-grey-strong">
                {stage.detail}
              </p>
            </li>
          ))}
        </ol>
      </Section>

      {/* ================= Pricing preview ================= */}
      <Section tone="canvas" ariaLabelledBy="fees-heading">
        <SectionHeading
          id="fees-heading"
          eyebrow="Fees"
          title="Published, not available on request"
          lede="Consultation and hygiene fees are fixed. Treatment that genuinely varies is quoted in writing after an examination."
          action={
            <ButtonLink href="/pricing" variant="secondary">
              Full fee list
              <ArrowRight className="size-4" aria-hidden="true" />
            </ButtonLink>
          }
        />

        <Reveal className="mt-12">
          <div className="overflow-hidden rounded-card border border-line bg-white">
            <ul>
              {previewRows.map((treatment, index) => (
                <li key={treatment.slug}>
                  {index > 0 && <Divider />}
                  <Link
                    href={`/treatments/${treatment.slug}`}
                    className="flex items-center justify-between gap-6 px-5 py-5 transition-colors duration-[--duration-feedback] hover:bg-canvas focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-blue sm:px-6"
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
                    <span className="shrink-0 text-right">
                      <span className="block text-[1.0625rem] font-semibold tabular-nums text-ink">
                        {treatment.priceFromCents
                          ? `From ${formatPrice(treatment.priceFromCents)}`
                          : 'On assessment'}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <p className="mt-4 text-xs leading-relaxed text-grey-strong">
            Starting fees. The exact figure for your treatment follows an
            examination and, where relevant, a written plan.
          </p>
        </Reveal>
      </Section>

      {/* ================= Products ================= */}
      <Section tone="white" ariaLabelledBy="shop-heading">
        <SectionHeading
          id="shop-heading"
          eyebrow="From the practice"
          title="What we actually recommend"
          lede="A short list rather than a catalogue. Collect at reception, or with your next appointment."
          action={
            <ButtonLink href="/shop" variant="secondary">
              Browse all
              <ArrowRight className="size-4" aria-hidden="true" />
            </ButtonLink>
          }
        />

        <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {shopRail.map((product, index) => (
            <Reveal as="li" key={product.id} delay={Math.min(index, 3) * 60}>
              <ProductCard product={product} />
            </Reveal>
          ))}
        </ul>
      </Section>

      {/* ================= Location ================= */}
      <Section tone="canvas" ariaLabelledBy="location-heading">
        <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
          <Reveal>
            <p className="text-eyebrow">Finding us</p>
            <h2
              id="location-heading"
              className="mt-3 text-[1.75rem] font-semibold leading-[1.15] text-ink sm:text-[2.125rem]"
            >
              On Florida Road, with parking behind the building
            </h2>

            <address className="mt-7 not-italic">
              <p className="text-[0.9375rem] leading-relaxed text-charcoal">
                {addressLines().map((line) => (
                  <span key={line} className="block">
                    {line}
                  </span>
                ))}
              </p>
            </address>

            <p className="mt-5 text-sm leading-relaxed text-grey-strong">
              {clinic.parking.detail}
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <ButtonAnchor
                href={`tel:${clinic.telephone.e164}`}
                variant="secondary"
              >
                <Phone className="size-4" aria-hidden="true" />
                {clinic.telephone.display}
              </ButtonAnchor>
              <ButtonAnchor
                href={whatsappLink(whatsappIntents.question)}
                target="_blank"
                rel="noopener noreferrer"
                variant="secondary"
              >
                <MessagesSquare className="size-4" aria-hidden="true" />
                Ask a question
              </ButtonAnchor>
            </div>

            <ul className="mt-9 flex flex-col gap-4 border-t border-line pt-7">
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

      {/* ================= FAQ ================= */}
      <Section tone="white" ariaLabelledBy="faq-heading">
        <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
          <div>
            <SectionHeading
              id="faq-heading"
              eyebrow="Questions"
              title="Before you book"
            />
            <Reveal className="mt-6">
              <p className="text-sm leading-relaxed text-grey-strong">
                If your question is not here, phone reception on{' '}
                <a
                  href={`tel:${clinic.telephone.e164}`}
                  className="font-medium text-blue underline decoration-blue/30 underline-offset-2 hover:decoration-blue"
                >
                  {clinic.telephone.display}
                </a>{' '}
                or send a message on WhatsApp.
              </p>
            </Reveal>
          </div>
          <Reveal>
            <FaqAccordion faqs={generalFaqs} />
          </Reveal>
        </div>
      </Section>

      {/* ================= Final CTA ================= */}
      <section className="bg-ink">
        <div className="container-page py-20 lg:py-28">
          <Reveal className="mx-auto max-w-2xl text-center">
            <h2 className="text-[1.75rem] font-semibold leading-[1.15] text-white sm:text-[2.25rem]">
              Ready when you are
            </h2>
            <p className="mt-5 text-[1.0625rem] leading-relaxed text-white/70">
              Pick a time from the practice diary and you will have a booking
              reference within the minute. Nothing is charged for a check-up
              until you arrive.
            </p>
            <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
              <ButtonLink href="/book" size="lg" variant="onDark">
                Book an Appointment
              </ButtonLink>
              <ButtonLink href="/emergency" size="lg" variant="onDarkGhost">
                <Siren className="size-4" aria-hidden="true" />
                Urgent dental care
              </ButtonLink>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
