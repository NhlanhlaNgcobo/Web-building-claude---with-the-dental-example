import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/cn';
import { BLUR_PLACEHOLDER } from '@/data/images';
import { formatPrice } from '@/lib/currency';
import { AddToBasketButton } from './AddToBasketButton';

export interface ProductCardData {
  readonly id: string;
  readonly slug: string;
  readonly name: string;
  readonly shortDescription: string;
  readonly priceCents: number;
  readonly imageUrl: string;
}

export function ProductCard({
  product,
  className,
  compact = false,
}: {
  readonly product: ProductCardData;
  readonly className?: string;
  readonly compact?: boolean;
}) {
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
      <div className="relative aspect-square overflow-hidden bg-canvas-deep">
        <Image
          src={product.imageUrl}
          alt=""
          fill
          sizes={
            compact
              ? '(min-width: 640px) 220px, 45vw'
              : '(min-width: 1024px) 24vw, (min-width: 640px) 45vw, 92vw'
          }
          placeholder="blur"
          blurDataURL={BLUR_PLACEHOLDER}
          className={cn(
            'object-cover',
            'transition-transform duration-[--duration-feedback] ease-out',
            'group-hover:scale-[1.03]',
          )}
        />
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="text-sm font-semibold leading-snug text-ink">
          <Link
            href={`/shop/${product.slug}`}
            className="rounded-panel focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue"
          >
            <span className="absolute inset-0 z-raised" aria-hidden="true" />
            {product.name}
          </Link>
        </h3>

        {!compact && (
          <p className="mt-1.5 flex-1 text-[0.8125rem] leading-relaxed text-grey-strong">
            {product.shortDescription}
          </p>
        )}

        <div className="mt-3 flex items-center justify-between gap-3">
          <p className="text-[0.9375rem] font-semibold tabular-nums text-ink">
            {formatPrice(product.priceCents)}
          </p>
          <AddToBasketButton product={product} />
        </div>
      </div>
    </article>
  );
}
