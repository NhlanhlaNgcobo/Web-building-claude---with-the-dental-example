/**
 * Social proof: structure now, real content later.
 *
 * These arrays are intentionally EMPTY. The components that read them render
 * nothing at all when there is no data, so the site ships with no invented
 * review, rating, star count, patient case or award anywhere on it.
 *
 * Fabricating any of this would be dishonest, and in the case of patient
 * before-and-after images it would also be a consent problem. When the practice
 * has genuine material, with written patient consent for the images, it drops
 * into these arrays and the sections appear automatically.
 *
 * What the site shows instead is in data/trust.ts: real, verifiable facts about
 * how the practice operates.
 */

export interface Testimonial {
  readonly id: string;
  readonly quote: string;
  /** First name and initial only, and only with the patient's written consent. */
  readonly attribution: string;
  readonly treatmentSlug?: string;
  readonly date: string;
}

export interface ReviewSummary {
  /** Where the reviews are published, for example 'Google'. */
  readonly source: string;
  readonly url: string;
  readonly averageRating: number;
  readonly reviewCount: number;
  /** Set once the figures above are read from a live source rather than typed. */
  readonly verifiedAt: string;
}

export interface BeforeAfterCase {
  readonly id: string;
  readonly treatmentSlug: string;
  readonly description: string;
  readonly beforeImage: { src: string; alt: string };
  readonly afterImage: { src: string; alt: string };
  /** Required. No case is published without recorded written consent. */
  readonly consentRecorded: true;
}

/** Populate only with quotes the practice holds written consent for. */
export const testimonials: readonly Testimonial[] = [];

/**
 * Leave as null until the figures come from the Google Business Profile API or
 * are verified against the live listing. A typed-in rating is a fabricated one.
 */
export const reviewSummary: ReviewSummary | null = null;

/** Populate only with cases where the patient has given written consent. */
export const beforeAfterCases: readonly BeforeAfterCase[] = [];

export function hasTestimonials(): boolean {
  return testimonials.length > 0;
}

export function hasBeforeAfterCases(): boolean {
  return beforeAfterCases.length > 0;
}
