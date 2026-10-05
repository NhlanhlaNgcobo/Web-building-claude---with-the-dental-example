'use client';

import { useState } from 'react';
import { Check, Plus } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useBasket } from '@/hooks/useBasket';
import { track } from '@/lib/analytics';
import type { ProductCardData } from './ProductCard';

/**
 * Add to basket.
 *
 * Confirms by swapping the label to "Added" for a moment, which is enough
 * feedback for a basket this small and avoids throwing a toast for something
 * the reader initiated and can see the result of in the header count.
 */
export function AddToBasketButton({
  product,
  size = 'sm',
  block = false,
  label = 'Add',
  className,
}: {
  readonly product: ProductCardData;
  readonly size?: 'sm' | 'lg';
  readonly block?: boolean;
  readonly label?: string;
  readonly className?: string;
}) {
  const { add } = useBasket();
  const [justAdded, setJustAdded] = useState(false);

  function handleAdd() {
    add({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      priceCents: product.priceCents,
      imageUrl: product.imageUrl,
    });
    track({ name: 'product_added', slug: product.slug, quantity: 1 });
    setJustAdded(true);
    window.setTimeout(() => setJustAdded(false), 1600);
  }

  return (
    <button
      type="button"
      onClick={handleAdd}
      className={cn(
        'relative z-sticky inline-flex items-center justify-center gap-1.5 rounded-panel',
        'font-medium',
        'transition-[background-color,border-color,color] duration-[--duration-feedback] ease-out',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue',
        size === 'sm' ? 'h-9 px-3 text-[0.8125rem]' : 'h-12 px-5 text-sm',
        block && 'w-full',
        justAdded
          ? 'border border-[--color-positive] bg-[--color-positive-soft] text-[--color-positive]'
          : 'bg-blue text-white hover:bg-blue-deep active:bg-blue-dark',
        className,
      )}
    >
      {justAdded ? (
        <Check className="size-4" aria-hidden="true" />
      ) : (
        <Plus className="size-4" aria-hidden="true" />
      )}
      {justAdded ? 'Added' : label}
      <span className="sr-only"> {product.name} to basket</span>
      {/* Announced without moving focus, so a screen reader user hears the
          result without being yanked away from the list. */}
      <span aria-live="polite" className="sr-only">
        {justAdded ? `${product.name} added to your basket` : ''}
      </span>
    </button>
  );
}
