import type { Metadata } from 'next';
import { PageHero } from '@/components/layout/PageHero';
import { QuickSelector } from '@/components/services/QuickSelector';
import { TreatmentCard } from '@/components/services/TreatmentCard';
import { Reveal } from '@/components/ui/Reveal';
import { Section, SectionHeading } from '@/components/ui/Section';
import { treatments } from '@/data/treatments';
import { pageMetadata } from '@/lib/seo';
import type { ServiceCategory } from '@/lib/domain/enums';

export const metadata: Metadata = pageMetadata({
  title: 'Dental treatments in Durban',
  description:
    'Examinations, hygiene, fillings, crowns, implants, whitening and urgent care, each with what the appointment involves, how long it takes and what it costs.',
  path: '/treatments',
});

/**
 * Treatments index.
 *
 * Grouped by what the patient is trying to achieve rather than by clinical
 * taxonomy, because "my tooth hurts" and "I want whiter teeth" are the two
 * ways people actually arrive here.
 */
const groups: { readonly category: ServiceCategory; readonly title: string; readonly lede: string }[] = [
  {
    category: 'general',
    title: 'Check-ups and assessments',
    lede: 'Where most treatment starts, and where problems get caught while they are still small.',
  },
  {
    category: 'hygiene',
    title: 'Hygiene and gum health',
    lede: 'The appointments that keep gums healthy and teeth where they are.',
  },
  {
    category: 'restorative',
    title: 'Repairing teeth',
    lede: 'Rebuilding a tooth after decay, a fracture or a failed filling.',
  },
  {
    category: 'cosmetic',
    title: 'Appearance',
    lede: 'Changing colour or shape, assessed first so expectations are realistic.',
  },
  {
    category: 'surgical',
    title: 'Surgical treatment',
    lede: 'Extractions, wisdom teeth and implants, with imaging to plan properly.',
  },
  {
    category: 'emergency',
    title: 'Urgent care',
    lede: 'Pain, swelling and breakages, with time held back each morning.',
  },
];

export default function TreatmentsPage() {
  return (
    <>
      <PageHero
        eyebrow="Treatments"
        title="Dental treatments, explained properly"
        lede="Fifteen treatments, each with what it involves, who it may suit, how long the appointment takes and what it costs. Nothing here is a diagnosis: that needs an examination."
        crumbs={[{ name: 'Treatments', path: '/treatments' }]}
      />

      {/* Search first, because most people arrive with a symptom rather than
          a treatment name in mind. */}
      <Section tone="white" space="tight" ariaLabelledBy="search-heading">
        <SectionHeading
          id="search-heading"
          title="What can we help you with?"
          lede="Search by treatment or by what you have noticed."
        />
        <Reveal className="mt-8">
          <QuickSelector />
        </Reveal>
      </Section>

      {groups.map((group, index) => {
        const items = treatments.filter((t) => t.category === group.category);
        if (items.length === 0) return null;

        return (
          <Section
            key={group.category}
            tone={index % 2 === 0 ? 'canvas' : 'white'}
            ariaLabelledBy={`group-${group.category}`}
          >
            <SectionHeading
              id={`group-${group.category}`}
              title={group.title}
              lede={group.lede}
            />
            <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((treatment, i) => (
                <Reveal as="li" key={treatment.slug} delay={Math.min(i, 3) * 60}>
                  <TreatmentCard treatment={treatment} />
                </Reveal>
              ))}
            </ul>
          </Section>
        );
      })}
    </>
  );
}
