import type { Metadata } from 'next';
import { Clock, Mail, MapPin, MessageCircle, Phone } from 'lucide-react';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { EnquiryForm } from '@/components/layout/EnquiryForm';
import { ButtonAnchor } from '@/components/ui/Button';
import { Section } from '@/components/ui/Section';
import { store, whatsappIntents, whatsappLink } from '@/data/store';
import { JsonLd, breadcrumbSchema, pageMetadata, storeSchema } from '@/lib/seo';

export const metadata: Metadata = pageMetadata({
  title: 'Contact us',
  description: `Phone, WhatsApp, email or visit the shop at ${store.address.line1}, ${store.address.suburb}, ${store.address.city}.`,
  path: '/contact',
});

const crumbs = [
  { name: 'Home', path: '/' },
  { name: 'Contact', path: '/contact' },
];

export default function ContactPage() {
  const mapQuery = encodeURIComponent(
    `${store.address.line1}, ${store.address.line2}, ${store.address.suburb}, ${store.address.city}`,
  );

  return (
    <>
      <JsonLd schema={storeSchema()} />
      <JsonLd schema={breadcrumbSchema(crumbs)} />

      <div className="border-b border-line bg-white pt-16 lg:pt-[4.5rem]">
        <div className="container-page py-8 lg:py-12">
          <Breadcrumbs items={crumbs} />
          <h1 className="text-display mt-5 text-[2rem] text-ink sm:text-[2.5rem]">
            Talk to us
          </h1>
          <p className="mt-4 max-w-2xl text-pretty text-[1.0625rem] leading-relaxed text-grey-strong">
            The shop answers its own phone. If you want to know whether
            something is in stock, that is the quickest way to find out.
          </p>
        </div>
      </div>

      <Section tone="white">
        <div className="grid gap-12 lg:grid-cols-[1fr_20rem] lg:gap-16">
          <div>
            <h2 className="text-[1.25rem] font-bold text-ink">Send a message</h2>
            <p className="mt-2 max-w-xl text-pretty text-[0.9375rem] leading-relaxed text-grey-strong">
              We read these during trading hours and answer in the order they
              arrive.
            </p>
            <div className="mt-7 max-w-xl">
              <EnquiryForm />
            </div>
          </div>

          <aside className="flex flex-col gap-4">
            <div className="rounded-card border border-line bg-paper p-5">
              <h2 className="text-[0.6875rem] font-semibold uppercase text-grey-strong">
                Quicker than a form
              </h2>
              <ul className="mt-4 flex flex-col gap-3">
                <li>
                  <ButtonAnchor
                    href={`tel:${store.telephone.e164}`}
                    variant="secondary"
                    block
                  >
                    <Phone className="size-4" aria-hidden="true" />
                    {store.telephone.display}
                  </ButtonAnchor>
                </li>
                <li>
                  <ButtonAnchor
                    href={whatsappLink(whatsappIntents.general)}
                    variant="secondary"
                    block
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <MessageCircle className="size-4" aria-hidden="true" />
                    WhatsApp us
                  </ButtonAnchor>
                </li>
                <li>
                  <ButtonAnchor
                    href={`mailto:${store.email}`}
                    variant="secondary"
                    block
                  >
                    <Mail className="size-4" aria-hidden="true" />
                    Email
                  </ButtonAnchor>
                </li>
              </ul>
            </div>

            <div className="rounded-card border border-line bg-paper p-5">
              <h2 className="flex items-center gap-2 text-[0.6875rem] font-semibold uppercase text-grey-strong">
                <MapPin className="size-3.5" aria-hidden="true" />
                Where we are
              </h2>
              <address className="mt-3 not-italic text-[0.9375rem] leading-relaxed text-ink">
                {store.address.line1}
                <br />
                {store.address.line2}
                <br />
                {store.address.suburb}
                <br />
                {store.address.city}, {store.address.postalCode}
              </address>
              <p className="mt-3 text-[0.8125rem] leading-relaxed text-grey-strong">
                {store.parking}
              </p>
              <ButtonAnchor
                href={`https://www.google.com/maps/search/?api=1&query=${mapQuery}`}
                variant="secondary"
                size="sm"
                className="mt-4"
                target="_blank"
                rel="noopener noreferrer"
              >
                Open in Maps
              </ButtonAnchor>
            </div>

            <div className="rounded-card border border-line bg-paper p-5">
              <h2 className="flex items-center gap-2 text-[0.6875rem] font-semibold uppercase text-grey-strong">
                <Clock className="size-3.5" aria-hidden="true" />
                Trading hours
              </h2>
              <dl className="mt-3 flex flex-col gap-1.5 text-[0.875rem]">
                {store.openingHours.map((day) => (
                  <div key={day.day} className="flex justify-between gap-4">
                    <dt className="text-grey-strong">{day.day}</dt>
                    <dd className="tabular-nums text-ink">
                      {day.opens === null
                        ? 'Closed'
                        : `${day.opens} to ${day.closes}`}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </aside>
        </div>
      </Section>
    </>
  );
}
