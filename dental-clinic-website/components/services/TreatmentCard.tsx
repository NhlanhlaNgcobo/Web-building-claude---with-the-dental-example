import Image from 'next/image';
import Link from 'next/link';
import { Clock } from 'lucide-react';
import { cn } from '@/lib/cn';
import { BLUR_PLACEHOLDER, treatmentImages } from '@/data/images';
import { formatDuration } from '@/lib/availability/tz';
import { formatPriceFrom } from '@/lib/currency';
import type { Treatment } from '@/types';

/**
 * Treatment card.
 *
 * Interaction is deliberately understated: the image scales very slightly, the
 * border picks up a blue tint and the card lifts by two pixels. Only transform,
 * border-colour and shadow move, and nothing rotates or bounces.
 *
 * The whole card is one link to the treatment page, with a separate Book action
 * inside it. Nesting an anchor inside an anchor is invalid, so the card uses an
 * overlay link covering the image and heading area while the Book button sits
 * above it in the stacking order.
 */
export function TreatmentCard({
  treatment,
  priority = false,
  className,
}: {
  readonly treatment: Treatment;
  readonly priority?: boolean;
  readonly className?: string;
}) {
  const image = treatmentImages[treatment.slug];

  return (
    <article
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-card',
        'glass-light',
        'transition-[transform,border-color,box-shadow]',
        'duration-[--duration-feedback] ease-out',
        'hover:-translate-y-0.5 hover:border-blue/30',
        'hover:shadow-[0_1px_0_0_rgb(255_255_255/0.7)_inset,0_16px_36px_-12px_rgb(7_61_158/0.18)]',
        'focus-within:border-blue/40',
        className,
      )}
    >
      {image && (
        <div className="relative aspect-[4/3] overflow-hidden bg-canvas-deep">
          <Image
            src={image}
            alt=""
            fill
            sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 92vw"
            placeholder="blur"
            blurDataURL={BLUR_PLACEHOLDER}
            priority={priority}
            className={cn(
              'object-cover',
              'transition-transform duration-[--duration-feedback] ease-out',
              'group-hover:scale-[1.03]',
            )}
          />
        </div>
      )}

      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-[1.0625rem] font-semibold leading-snug text-ink">
          {/* Covers the card so the entire surface is clickable, while keeping
              a single accessible link rather than several duplicates. */}
          <Link
            href={`/treatments/${treatment.slug}`}
            className="rounded-panel focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue"
          >
            <span className="absolute inset-0 z-raised" aria-hidden="true" />
            {treatment.name}
          </Link>
        </h3>

        <p className="mt-2 flex-1 text-sm leading-relaxed text-grey-strong">
          {treatment.summary}
        </p>

        <div className="mt-4 flex items-end justify-between gap-3 border-t border-line pt-4">
          <div>
            <p className="text-[0.9375rem] font-semibold tabular-nums text-ink">
              {formatPriceFrom(treatment.priceFromCents, 'On assessment')}
            </p>
            <p className="mt-0.5 flex items-center gap-1.5 text-xs text-grey-strong">
              <Clock className="size-3.5" aria-hidden="true" />
              <span className="tabular-nums">
                {formatDuration(treatment.durationMinutes)}
              </span>
            </p>
          </div>

          {/* Raised above the overlay link so it receives its own clicks. */}
          <Link
            href={`/book?service=${treatment.bookingServiceSlug}`}
            className={cn(
              'relative z-sticky flex h-9 items-center rounded-panel px-3.5',
              'text-[0.8125rem] font-medium',
              'border border-line-strong bg-white text-ink',
              'transition-colors duration-[--duration-feedback] ease-out',
              'hover:border-blue hover:text-blue',
              'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue',
            )}
          >
            Book
            <span className="sr-only"> {treatment.name}</span>
          </Link>
        </div>
      </div>
    </article>
  );
}
