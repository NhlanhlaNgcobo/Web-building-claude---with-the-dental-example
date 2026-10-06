import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, MessageCircle, Phone } from 'lucide-react';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { ButtonAnchor, ButtonLink } from '@/components/ui/Button';
import { Reveal } from '@/components/ui/Reveal';
import { Section } from '@/components/ui/Section';
import { helpTopics } from '@/data/help';
import { store, whatsappIntents, whatsappLink } from '@/data/store';
import { JsonLd, breadcrumbSchema, pageMetadata } from '@/lib/seo';

export const metadata: Metadata = pageMetadata({
  title: 'Help',
  description:
    'Delivery and collection, warranty and repairs, returns and refunds. The three things worth knowing before and after you buy.',
  path: '/help',
});

const crumbs = [
  { name: 'Home', path: '/' },
  { name: 'Help', path: '/help' },
];

export default function HelpPage() {
  return (
    <>
      <JsonLd schema={breadcrumbSchema(crumbs)} />

      <div className="border-b border-line bg-white pt-16 lg:pt-[4.5rem]">
        <div className="container-page py-8 lg:py-12">
          <Breadcrumbs items={crumbs} />
          <h1 className="text-display mt-5 text-[2rem] text-ink sm:text-[2.5rem]">
            Help
          </h1>
          <p className="mt-4 max-w-2xl text-pretty text-[1.0625rem] leading-relaxed text-grey-strong">
            Three pages rather than thirty. These are the things people actually
            need to know, written out properly instead of split into fragments.
          </p>
        </div>
      </div>

      <Section tone="white">
        <ul className="grid gap-4 lg:grid-cols-3">
          {helpTopics.map((topic, index) => (
            <Reveal as="li" key={topic.slug} delay={Math.min(index, 3) * 60}>
              <Link
                href={`/help/${topic.slug}`}
                className="group flex h-full flex-col rounded-card border border-line bg-white p-6 transition-[border-color,box-shadow] duration-[--duration-feedback] hover:border-line-strong hover:shadow-[0_12px_28px_-12px_rgb(13_17_23/0.14)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red"
              >
                <h2 className="text-[1.125rem] font-bold text-ink">
                  {topic.title}
                </h2>
                <p className="mt-2 flex-1 text-pretty text-[0.9375rem] leading-relaxed text-grey-strong">
                  {topic.summary}
                </p>
                <span className="mt-5 inline-flex items-center gap-1.5 text-[0.8125rem] font-semibold text-red">
                  Read it
                  <ArrowRight
                    className="size-3.5 transition-transform duration-[--duration-feedback] ease-out group-hover:translate-x-0.5"
                    aria-hidden="true"
                  />
                </span>
              </Link>
            </Reveal>
          ))}
        </ul>

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          <div className="rounded-card border border-line bg-paper p-6">
            <h2 className="text-[1rem] font-bold text-ink">
              Something about an order
            </h2>
            <p className="mt-2 text-pretty text-[0.875rem] leading-relaxed text-grey-strong">
              Track it with your reference and the email you ordered with. No
              account needed.
            </p>
            <ButtonLink href="/order" variant="secondary" className="mt-5">
              Track your order
            </ButtonLink>
          </div>

          <div className="rounded-card border border-line bg-paper p-6">
            <h2 className="text-[1rem] font-bold text-ink">Ask a person</h2>
            <p className="mt-2 text-pretty text-[0.875rem] leading-relaxed text-grey-strong">
              The shop answers its own phone during trading hours.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <ButtonAnchor
                href={`tel:${store.telephone.e164}`}
                variant="secondary"
              >
                <Phone className="size-4" aria-hidden="true" />
                {store.telephone.display}
              </ButtonAnchor>
              <ButtonAnchor
                href={whatsappLink(whatsappIntents.support)}
                variant="secondary"
                rel="noopener noreferrer"
                target="_blank"
              >
                <MessageCircle className="size-4" aria-hidden="true" />
                WhatsApp
              </ButtonAnchor>
            </div>
          </div>
        </div>
      </Section>
    </>
  );
}
