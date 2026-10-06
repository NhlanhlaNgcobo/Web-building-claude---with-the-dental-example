'use client';

import Image from 'next/image';
import { useState } from 'react';
import { cn } from '@/lib/cn';
import { BLUR_PLACEHOLDER } from '@/data/images';
import type { ProductImageDto } from '@/types';

/**
 * Product gallery.
 *
 * A main image with thumbnails underneath, no carousel and no autoplay. The
 * thumbnails are a tab list, which is what they behave like: arrow keys move
 * between them and the main image is the panel. That comes from using the real
 * roles rather than a row of buttons.
 *
 * Only the first image is eager. The rest load as the customer reaches for
 * them, which keeps the largest paint on a product page to one photograph.
 */
export function Gallery({
  images,
  productName,
}: {
  readonly images: readonly ProductImageDto[];
  readonly productName: string;
}) {
  const [index, setIndex] = useState(0);
  const current = images[index] ?? images[0];

  if (!current) {
    return (
      <div className="aspect-square rounded-card border border-line bg-canvas" />
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div
        id="gallery-panel"
        role="tabpanel"
        aria-live="polite"
        className="relative aspect-square overflow-hidden rounded-card border border-line bg-canvas"
      >
        <Image
          key={current.url}
          src={current.url}
          alt={current.alt || productName}
          fill
          priority={index === 0}
          sizes="(min-width: 1024px) 48vw, 92vw"
          placeholder="blur"
          blurDataURL={BLUR_PLACEHOLDER}
          className="object-cover"
        />
      </div>

      {images.length > 1 && (
        <div
          role="tablist"
          aria-label={`${productName} photographs`}
          className="scroll-x flex gap-2"
        >
          {images.map((image, i) => (
            <button
              key={image.url}
              role="tab"
              type="button"
              aria-selected={i === index}
              aria-controls="gallery-panel"
              tabIndex={i === index ? 0 : -1}
              onClick={() => setIndex(i)}
              onKeyDown={(event) => {
                if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
                  event.preventDefault();
                  const next =
                    event.key === 'ArrowRight'
                      ? (i + 1) % images.length
                      : (i - 1 + images.length) % images.length;
                  setIndex(next);
                  // Keep focus with the selection, which is what a tab list
                  // does and what makes arrow keys feel right.
                  const list = event.currentTarget.parentElement;
                  const tabs = list?.querySelectorAll<HTMLButtonElement>('[role="tab"]');
                  tabs?.[next]?.focus();
                }
              }}
              className={cn(
                'relative size-16 shrink-0 overflow-hidden rounded-panel border-2 bg-canvas',
                'transition-[border-color] duration-[--duration-feedback] ease-out',
                'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red',
                i === index
                  ? 'border-ink'
                  : 'border-transparent hover:border-line-strong',
              )}
            >
              <Image
                src={image.url}
                alt=""
                fill
                sizes="64px"
                className="object-cover"
              />
              <span className="sr-only">
                {image.colourName
                  ? `${productName} in ${image.colourName}`
                  : `${productName}, photograph ${i + 1}`}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
