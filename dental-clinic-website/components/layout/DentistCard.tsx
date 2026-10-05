import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/cn';
import { BLUR_PLACEHOLDER } from '@/data/images';

export interface DentistCardData {
  readonly id: string;
  readonly slug: string;
  readonly title: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly role: string;
  readonly focusAreas: readonly string[];
  readonly photoUrl: string;
  readonly bio?: string;
}

/**
 * Dentist profile card.
 *
 * Upright editorial crop, which reads better for a portrait than the landscape
 * ratio used by the treatment cards, and gives the face room at small sizes.
 */
export function DentistCard({
  dentist,
  className,
  showBio = false,
}: {
  readonly dentist: DentistCardData;
  readonly className?: string;
  readonly showBio?: boolean;
}) {
  const fullName = `${dentist.title} ${dentist.firstName} ${dentist.lastName}`;

  return (
    <article
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-card glass-light',
        'transition-[transform,border-color,box-shadow]',
        'duration-[--duration-feedback] ease-out',
        'hover:-translate-y-0.5 hover:border-blue/30',
        'hover:shadow-[0_1px_0_0_rgb(255_255_255/0.7)_inset,0_16px_36px_-12px_rgb(7_61_158/0.16)]',
        className,
      )}
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-canvas-deep">
        <Image
          src={dentist.photoUrl}
          alt={`${fullName}, ${dentist.role} at Harbour Dental Studio`}
          fill
          sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 92vw"
          placeholder="blur"
          blurDataURL={BLUR_PLACEHOLDER}
          className={cn(
            'object-cover',
            'transition-transform duration-[--duration-feedback] ease-out',
            'group-hover:scale-[1.02]',
          )}
        />
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-[1.0625rem] font-semibold text-ink">
          <Link
            href={`/team/${dentist.slug}`}
            className="rounded-panel focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue"
          >
            <span className="absolute inset-0 z-raised" aria-hidden="true" />
            {fullName}
          </Link>
        </h3>
        <p className="mt-1 text-[0.8125rem] text-grey-strong">{dentist.role}</p>

        {showBio && dentist.bio && (
          <p className="mt-3 text-sm leading-relaxed text-grey-strong">
            {dentist.bio}
          </p>
        )}

        <ul className="mt-4 flex flex-wrap gap-1.5">
          {dentist.focusAreas.slice(0, 3).map((area) => (
            <li
              key={area}
              className="rounded-panel bg-blue-soft px-2 py-1 text-[0.6875rem] font-medium text-blue-deep"
            >
              {area}
            </li>
          ))}
        </ul>

        <div className="mt-5 flex-1" />

        <Link
          href={`/book?dentist=${dentist.id}`}
          className={cn(
            'relative z-sticky inline-flex items-center gap-1.5 text-[0.8125rem] font-medium text-blue',
            'transition-colors duration-[--duration-feedback] ease-out',
            'hover:text-blue-deep',
            'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue',
          )}
        >
          Book with {dentist.title} {dentist.lastName}
          <ArrowRight
            className="size-3.5 transition-transform duration-[--duration-feedback] ease-out group-hover:translate-x-0.5"
            aria-hidden="true"
          />
        </Link>
      </div>
    </article>
  );
}
