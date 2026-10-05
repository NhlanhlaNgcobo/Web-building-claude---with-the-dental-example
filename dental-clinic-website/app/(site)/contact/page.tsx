import type { Metadata } from 'next';
import {
  CalendarPlus,
  Clock,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Siren,
} from 'lucide-react';
import { EnquiryForm } from '@/components/layout/EnquiryForm';
import { MapPanel } from '@/components/layout/MapPanel';
import { PageHero } from '@/components/layout/PageHero';
import { WhatsAppOptions } from '@/components/layout/WhatsAppOptions';
import { ButtonAnchor, ButtonLink } from '@/components/ui/Button';
import { Reveal } from '@/components/ui/Reveal';
import { Section, SectionHeading } from '@/components/ui/Section';
import { addressLines, clinic } from '@/data/clinic';
import { pageMetadata } from '@/lib/seo';

export const metadata: Metadata = pageMetadata({
  title: 'Contact the practice',
  description:
    'Telephone, WhatsApp, email and directions for Harbour Dental Studio on Florida Road, Morningside, Durban. Opening hours and parking information.',
  path: '/contact',
});

export default function ContactPage() {
  return (
    <>
      <PageHero
        eyebrow="Contact"
        title="Get in touch"
        lede="Reception answers the telephone during opening hours and replies on WhatsApp. For an appointment, booking online is usually quicker than either."
        crumbs={[{ name: 'Contact', path: '/contact' }]}
      />

      {/* Primary routes in, ordered by how useful each one actually is. */}
      <Section tone="white" space="tight" ariaLabelledBy="routes-heading">
        <h2 id="routes-heading" className="sr-only">
          Ways to reach us
        </h2>

        <div className="grid gap-4 lg:grid-cols-3">
          <Reveal>
            <div className="flex h-full flex-col rounded-card glass-light p-5">
              <span className="flex size-10 items-center justify-center rounded-panel bg-blue-soft text-blue-deep">
                <CalendarPlus className="size-5" aria-hidden="true" />
              </span>
              <h3 className="mt-4 text-[0.9375rem] font-semibold text-ink">
                Book an appointment
              </h3>
              <p className="mt-1.5 flex-1 text-sm leading-relaxed text-grey-strong">
                Pick a time from the live practice diary and you will have a
                reference within the minute.
              </p>
              <ButtonLink href="/book" block className="mt-5">
                Book online
              </ButtonLink>
            </div>
          </Reveal>

          <Reveal delay={60}>
            <div className="flex h-full flex-col rounded-card glass-light p-5">
              <span className="flex size-10 items-center justify-center rounded-panel bg-blue-soft text-blue-deep">
                <Phone className="size-5" aria-hidden="true" />
              </span>
              <h3 className="mt-4 text-[0.9375rem] font-semibold text-ink">
                Telephone
              </h3>
              <p className="mt-1.5 flex-1 text-sm leading-relaxed text-grey-strong">
                The fastest route for anything urgent, or if you need to
                discuss something before booking.
              </p>
              <ButtonAnchor
                href={`tel:${clinic.telephone.e164}`}
                variant="secondary"
                block
                className="mt-5"
              >
                <span className="tabular-nums">
                  {clinic.telephone.display}
                </span>
              </ButtonAnchor>
            </div>
          </Reveal>

          <Reveal delay={120}>
            <div className="flex h-full flex-col rounded-card glass-light p-5">
              <span className="flex size-10 items-center justify-center rounded-panel bg-[--color-critical-soft] text-[--color-critical]">
                <Siren className="size-5" aria-hidden="true" />
              </span>
              <h3 className="mt-4 text-[0.9375rem] font-semibold text-ink">
                Urgent dental problem
              </h3>
              <p className="mt-1.5 flex-1 text-sm leading-relaxed text-grey-strong">
                Time is held back each morning for pain, swelling and broken
                teeth.
              </p>
              <ButtonLink
                href="/emergency"
                variant="critical"
                block
                className="mt-5"
              >
                Find the earliest appointment
              </ButtonLink>
            </div>
          </Reveal>
        </div>
      </Section>

      {/* WhatsApp */}
      <Section tone="canvas" space="tight" ariaLabelledBy="whatsapp-heading">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
          <div>
            <p className="text-eyebrow">WhatsApp</p>
            <h2
              id="whatsapp-heading"
              className="mt-3 text-[1.5rem] font-semibold leading-[1.2] text-ink sm:text-[1.875rem]"
            >
              Message reception
            </h2>
            <p className="mt-4 text-[0.9375rem] leading-relaxed text-grey-strong">
              Often the easiest way to ask a quick question. Replies come during
              opening hours. Please do not send clinical photographs or anything
              sensitive over WhatsApp.
            </p>
          </div>
          <Reveal>
            <WhatsAppOptions />
          </Reveal>
        </div>
      </Section>

      {/* Details and hours */}
      <Section tone="white" ariaLabelledBy="details-heading">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <SectionHeading
              id="details-heading"
              eyebrow="The practice"
              title="Where to find us"
            />

            <Reveal className="mt-8">
              <address className="flex flex-col gap-5 not-italic">
                <div className="flex items-start gap-3">
                  <MapPin
                    className="mt-0.5 size-4 shrink-0 text-blue"
                    aria-hidden="true"
                  />
                  <div>
                    <p className="text-[0.8125rem] font-semibold text-ink">
                      Address
                    </p>
                    <p className="mt-1 text-[0.9375rem] leading-relaxed text-grey-strong">
                      {addressLines().map((line) => (
                        <span key={line} className="block">
                          {line}
                        </span>
                      ))}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Phone
                    className="mt-0.5 size-4 shrink-0 text-blue"
                    aria-hidden="true"
                  />
                  <div>
                    <p className="text-[0.8125rem] font-semibold text-ink">
                      Telephone
                    </p>
                    <a
                      href={`tel:${clinic.telephone.e164}`}
                      className="mt-1 block text-[0.9375rem] tabular-nums text-grey-strong transition-colors hover:text-blue"
                    >
                      {clinic.telephone.display}
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MessageCircle
                    className="mt-0.5 size-4 shrink-0 text-blue"
                    aria-hidden="true"
                  />
                  <div>
                    <p className="text-[0.8125rem] font-semibold text-ink">
                      WhatsApp
                    </p>
                    <p className="mt-1 text-[0.9375rem] tabular-nums text-grey-strong">
                      {clinic.whatsapp.display}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Mail
                    className="mt-0.5 size-4 shrink-0 text-blue"
                    aria-hidden="true"
                  />
                  <div>
                    <p className="text-[0.8125rem] font-semibold text-ink">
                      Email
                    </p>
                    <a
                      href={`mailto:${clinic.email}`}
                      className="mt-1 block text-[0.9375rem] text-grey-strong transition-colors hover:text-blue"
                    >
                      {clinic.email}
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock
                    className="mt-0.5 size-4 shrink-0 text-blue"
                    aria-hidden="true"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-[0.8125rem] font-semibold text-ink">
                      Opening hours
                    </p>
                    <ul className="mt-2 flex flex-col gap-1.5">
                      {clinic.openingHours.map((day) => (
                        <li
                          key={day.day}
                          className="flex max-w-xs justify-between gap-6 text-[0.9375rem] text-grey-strong"
                        >
                          <span>{day.day}</span>
                          <span className="tabular-nums">
                            {day.opens
                              ? `${day.opens} to ${day.closes}`
                              : 'Closed'}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </address>
            </Reveal>
          </div>

          <Reveal delay={80}>
            <MapPanel />
            <div className="mt-5 rounded-card border border-line bg-canvas p-5">
              <h3 className="text-[0.8125rem] font-semibold text-ink">
                Getting here
              </h3>
              <ul className="mt-3 flex flex-col gap-3">
                {clinic.directions.map((direction) => (
                  <li key={direction.from}>
                    <p className="text-[0.8125rem] font-medium text-charcoal">
                      {direction.from}
                    </p>
                    <p className="mt-0.5 text-[0.8125rem] leading-relaxed text-grey-strong">
                      {direction.detail}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>
      </Section>

      {/* Enquiry form */}
      <Section tone="canvas" ariaLabelledBy="enquiry-heading">
        <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
          <div>
            <SectionHeading
              id="enquiry-heading"
              eyebrow="Enquiries"
              title="Send us a message"
              lede="For questions about records, fees, referrals, or whether we can help with something specific."
            />
          </div>
          <Reveal>
            <div className="rounded-card border border-line bg-white p-6 sm:p-8">
              <EnquiryForm />
            </div>
          </Reveal>
        </div>
      </Section>
    </>
  );
}
