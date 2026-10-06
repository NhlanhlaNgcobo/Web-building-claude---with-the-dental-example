import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/cn';
import { BLUR_PLACEHOLDER } from '@/data/images';
import { formatPrice } from '@/lib/currency';
import { CONDITION_SHORT } from '@/lib/domain/enums';
import type { ProductCardDto } from '@/types';

/**
 * Product card.
 *
 * Restrained on purpose. The photograph does the selling, so the card gives
 * it the room and keeps everything else to a line each. On hover the image
 * scales very slightly and the border picks up: no lift, no shadow bloom, no
 * rotation.
 *
 * The card never advertises a price nobody can buy. When nothing is in stock
 * it says so plainly rather than showing a price and disappointing somebody
 * two clicks later.
 */
export function ProductCard({
  product,
  priority = false,
  className,
  headingLevel = 3,
}: {
  readonly product: ProductCardDto;
  readonly priority?: boolean;
  readonly className?: string;
  /**
   * Which heading element the product name should be. A card sitting under a
   * section heading on the homepage is an h3; a card in a listing grid, where
   * the page h1 is the only heading above it, is an h2. Hard-coding one of
   * them would skip a level on the other.
   */
  readonly headingLevel?: 2 | 3;
}) {
  const soldOut = product.fromPriceCents === null;
  const Heading = headingLevel === 2 ? 'h2' : 'h3';

  return (
    <article
      className={cn(
        'group relative flex h-full flex-col overflow-hidden rounded-card surface-card',
        'transition-[border-color,box-shadow] duration-[--duration-feedback] ease-out',
        'hover:border-line-strong hover:shadow-[0_1px_2px_rgb(13_17_23/0.04),0_12px_28px_-12px_rgb(13_17_23/0.14)]',
        'focus-within:border-red/40',
        className,
      )}
    >
      <div className="relative aspect-square overflow-hidden bg-canvas">
        {product.imageUrl && (
          <Image
            src={product.imageUrl}
            alt=""
            fill
            sizes="(min-width: 1280px) 22vw, (min-width: 768px) 30vw, 46vw"
            placeholder="blur"
            blurDataURL={BLUR_PLACEHOLDER}
            priority={priority}
            className={cn(
              'object-cover',
              'transition-transform duration-[--duration-feedback] ease-out',
              'group-hover:scale-[1.03]',
              soldOut && 'opacity-55 saturate-50',
            )}
          />
        )}

        {/* One badge at most, and only when it is true. */}
        {soldOut ? (
          <span className="absolute left-3 top-3 rounded-panel bg-ink/85 px-2 py-1 text-[0.625rem] font-bold uppercase text-white">
            Sold out
          </span>
        ) : product.savingPercent !== null ? (
          <span className="absolute left-3 top-3 rounded-panel bg-red px-2 py-1 text-[0.625rem] font-bold uppercase text-white tabular-nums">
            Save {product.savingPercent}%
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <p className="text-[0.6875rem] font-semibold uppercase text-grey-strong">
          {product.categoryName}
        </p>

        <Heading className="mt-1 text-[0.9375rem] font-semibold leading-snug text-ink">
          <Link
            href={`/product/${product.slug}`}
            className="rounded-panel focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red"
          >
            {/* Covers the card so the whole surface is clickable, while
                keeping one accessible link rather than three duplicates. */}
            <span className="absolute inset-0 z-raised" aria-hidden="true" />
            {product.name}
          </Link>
        </Heading>

        <p className="mt-1 line-clamp-2 text-[0.8125rem] leading-relaxed text-grey-strong">
          {product.tagline}
        </p>

        {/* Colour swatches, only for colours actually in stock. */}
        {product.colourHexes.length > 0 && (
          <ul
            className="mt-3 flex items-center gap-1.5"
            aria-label={`${product.colourHexes.length} colours available`}
          >
            {product.colourHexes.slice(0, 5).map((hex) => (
              <li
                key={hex}
                className="size-3 rounded-full ring-1 ring-inset ring-ink/15"
                style={{ backgroundColor: hex }}
              />
            ))}
            {product.colourHexes.length > 5 && (
              <li className="text-[0.6875rem] tabular-nums text-grey">
                +{product.colourHexes.length - 5}
              </li>
            )}
          </ul>
        )}

        <div className="mt-auto pt-4">
          {soldOut ? (
            <p className="text-[0.8125rem] font-medium text-grey-strong">
              Out of stock just now
            </p>
          ) : (
            <>
              <div className="flex items-baseline gap-2">
                <p className="text-[1.0625rem] font-bold tabular-nums text-ink">
                  {formatPrice(product.fromPriceCents!)}
                </p>
                {product.compareAtCents !== null && (
                  <p className="text-[0.8125rem] tabular-nums text-grey line-through">
                    {formatPrice(product.compareAtCents)}
                  </p>
                )}
              </div>
              <p className="mt-0.5 text-[0.75rem] text-grey-strong">
                {product.bestCondition
                  ? `From ${CONDITION_SHORT[product.bestCondition].toLowerCase()} condition`
                  : 'From'}
              </p>
            </>
          )}
        </div>
      </div>
    </article>
  );
}
