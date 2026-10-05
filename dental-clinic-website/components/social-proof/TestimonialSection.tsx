import { Quote, Star } from 'lucide-react';
import { Reveal } from '@/components/ui/Reveal';
import { Section, SectionHeading } from '@/components/ui/Section';
import { reviewSummary, testimonials } from '@/data/social-proof';

/**
 * Patient testimonials and review summary.
 *
 * Renders nothing at all while data/social-proof.ts is empty, which it is.
 * That is the whole design: the section is built and ready, so the practice
 * can drop in genuine quotes and a verified Google rating whenever they have
 * them, and until then the site makes no claim it cannot support.
 *
 * An invented five-star rating would be both dishonest and, in structured
 * data, treated by search engines as manipulation.
 */
export function TestimonialSection() {
  // Captured locally because TypeScript cannot keep an imported binding
  // narrowed inside the callbacks below.
  const summary = reviewSummary;
  if (testimonials.length === 0 && summary === null) return null;

  return (
    <Section tone="white" ariaLabelledBy="testimonials-heading">
      <SectionHeading
        id="testimonials-heading"
        eyebrow="Patients"
        title="What patients say"
      />

      {summary && (
        <Reveal className="mt-8">
          <a
            href={summary.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 rounded-card border border-line bg-canvas px-5 py-3.5 transition-colors duration-[--duration-feedback] hover:border-blue focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue"
          >
            <span className="flex items-center gap-0.5" aria-hidden="true">
              {Array.from({ length: 5 }, (_, i) => (
                <Star
                  key={i}
                  className={
                    i < Math.round(summary.averageRating)
                      ? 'size-4 fill-[--color-caution] text-[--color-caution]'
                      : 'size-4 text-grey-light'
                  }
                />
              ))}
            </span>
            <span className="text-sm text-charcoal">
              <span className="font-semibold tabular-nums">
                {summary.averageRating.toFixed(1)}
              </span>{' '}
              from{' '}
              <span className="tabular-nums">{summary.reviewCount}</span>{' '}
              reviews on {summary.source}
            </span>
          </a>
        </Reveal>
      )}

      {testimonials.length > 0 && (
        <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((testimonial, index) => (
            <Reveal as="li" key={testimonial.id} delay={Math.min(index, 3) * 60}>
              <figure className="flex h-full flex-col rounded-card glass-light p-5">
                <Quote
                  className="size-5 shrink-0 text-blue"
                  aria-hidden="true"
                />
                <blockquote className="mt-4 flex-1 text-[0.9375rem] leading-relaxed text-charcoal">
                  {testimonial.quote}
                </blockquote>
                <figcaption className="mt-5 border-t border-line pt-4 text-[0.8125rem] text-grey-strong">
                  {testimonial.attribution}
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </ul>
      )}
    </Section>
  );
}
