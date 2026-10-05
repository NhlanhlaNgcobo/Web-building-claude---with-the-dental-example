import Image from 'next/image';
import { Reveal } from '@/components/ui/Reveal';
import { Section, SectionHeading } from '@/components/ui/Section';
import { BLUR_PLACEHOLDER } from '@/data/images';
import { beforeAfterCases } from '@/data/social-proof';
import { getTreatment } from '@/data/treatments';

/**
 * Before and after gallery for cosmetic treatment.
 *
 * Renders nothing while data/social-proof.ts holds no cases, which it does
 * not. This is more than editorial caution: publishing a patient's clinical
 * photographs without recorded written consent is a consent and privacy
 * problem, not just a marketing one. The BeforeAfterCase type therefore
 * requires consentRecorded to be literally true, so a case cannot be added
 * without that being explicit in the data.
 *
 * Images are shown side by side at a fixed ratio rather than behind a drag
 * slider, because a slider invites comparing two photographs that were not
 * necessarily taken under the same lighting or angle.
 */
export function BeforeAfterGallery() {
  if (beforeAfterCases.length === 0) return null;

  return (
    <Section tone="canvas" ariaLabelledBy="cases-heading">
      <SectionHeading
        id="cases-heading"
        eyebrow="Cosmetic treatment"
        title="Before and after"
        lede="Published with each patient's written consent. Results vary between people, and what is achievable for you needs an assessment."
      />

      <ul className="mt-12 grid gap-8 lg:grid-cols-2">
        {beforeAfterCases.map((item, index) => {
          const treatment = getTreatment(item.treatmentSlug);
          return (
            <Reveal as="li" key={item.id} delay={Math.min(index, 3) * 60}>
              <figure className="overflow-hidden rounded-card border border-line bg-white">
                <div className="grid grid-cols-2 gap-px bg-line">
                  {[
                    { label: 'Before', image: item.beforeImage },
                    { label: 'After', image: item.afterImage },
                  ].map((side) => (
                    <div key={side.label} className="relative bg-canvas-deep">
                      <div className="relative aspect-[4/3]">
                        <Image
                          src={side.image.src}
                          alt={side.image.alt}
                          fill
                          sizes="(min-width: 1024px) 24vw, 46vw"
                          placeholder="blur"
                          blurDataURL={BLUR_PLACEHOLDER}
                          className="object-cover"
                        />
                      </div>
                      <span className="absolute left-2 top-2 rounded-panel bg-ink/80 px-2 py-1 text-[0.625rem] font-semibold uppercase text-white">
                        {side.label}
                      </span>
                    </div>
                  ))}
                </div>
                <figcaption className="p-5">
                  {treatment && (
                    <p className="text-[0.8125rem] font-semibold text-blue">
                      {treatment.name}
                    </p>
                  )}
                  <p className="mt-1.5 text-sm leading-relaxed text-grey-strong">
                    {item.description}
                  </p>
                </figcaption>
              </figure>
            </Reveal>
          );
        })}
      </ul>
    </Section>
  );
}
