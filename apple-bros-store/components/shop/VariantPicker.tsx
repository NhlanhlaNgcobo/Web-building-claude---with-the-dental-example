'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  BatteryCharging,
  Check,
  Minus,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Truck,
} from 'lucide-react';
import { Button, ButtonLink } from '@/components/ui/Button';
import { cn } from '@/lib/cn';
import { formatPrice } from '@/lib/currency';
import { CONDITION_LABELS, CONDITION_SHORT } from '@/lib/domain/enums';
import {
  availableOptions,
  defaultVariant,
  findVariant,
  savingFor,
  vatBreakdown,
} from '@/lib/catalogue/pricing';
import { stockLabel, stockState } from '@/lib/orders/stock';
import { BASKET_MAX_QUANTITY, useBasket } from '@/hooks/useBasket';
import { track } from '@/lib/analytics';
import { store } from '@/data/store';
import type { Condition, ProductDetailDto, VariantDto } from '@/types';

/**
 * Storage, colour and condition, plus the buy panel.
 *
 * The selection is three independent values and the variant is derived from
 * them at render. There is no effect syncing one to the other, and no second
 * copy of the chosen variant to go stale.
 *
 * Two rules the component holds to, because both are how refurbished shops
 * lose people's trust:
 *
 * 1. A combination that does not exist is never silently swapped for a
 *    different one. When somebody changes condition and their colour is not
 *    made in that grade, we move them to a real variant and say which one.
 * 2. An option that cannot be bought is still shown, but disabled and
 *    labelled, so the page reads as a complete range with gaps rather than
 *    pretending the gaps were never there.
 */

interface Selection {
  readonly storageGb: number | null;
  readonly colourName: string;
  readonly condition: Condition;
}

type Dimension = 'storage' | 'colour' | 'condition';

/**
 * Pick a real variant after a change.
 *
 * The dimension the customer just touched is held fixed. The other two are
 * kept if the combination exists, and otherwise relaxed to the cheapest
 * buyable variant that honours the fixed choice. Returning the variant rather
 * than the selection means the caller cannot end up holding a selection with
 * nothing behind it.
 */
function resolveSelection(
  variants: readonly VariantDto[],
  next: Selection,
  changed: Dimension,
): VariantDto {
  const exact = findVariant(variants, next);
  if (exact) return exact;

  const holdsFixed = (v: VariantDto) =>
    changed === 'storage'
      ? v.storageGb === next.storageGb
      : changed === 'colour'
        ? v.colourName === next.colourName
        : v.condition === next.condition;

  const candidates = variants.filter(holdsFixed);
  // Prefer something that also keeps one of the other two choices, so a
  // colour change does not quietly move the customer to a different grade
  // when the same grade was available in that colour.
  const nearest =
    candidates.find(
      (v) =>
        (changed !== 'condition' && v.condition === next.condition) ||
        (changed !== 'colour' && v.colourName === next.colourName),
    ) ?? candidates[0];

  const buyable = candidates.filter((v) => v.isActive && v.stockQuantity > 0);
  return (
    buyable.reduce<VariantDto | null>(
      (cheapest, v) =>
        cheapest === null || v.priceCents < cheapest.priceCents ? v : cheapest,
      null,
    ) ??
    nearest ??
    variants[0]!
  );
}

function storageLabel(gb: number | null): string {
  if (gb === null) return 'Standard';
  if (gb >= 1024) return `${gb / 1024} TB`;
  return `${gb} GB`;
}

export function variantLabel(variant: VariantDto): string {
  const parts = [
    variant.storageGb === null ? null : storageLabel(variant.storageGb),
    variant.colourName,
    CONDITION_SHORT[variant.condition],
  ].filter(Boolean);
  return parts.join(', ');
}

export function VariantPicker({
  product,
  initialVariantId,
}: {
  readonly product: ProductDetailDto;
  /** From ?variant= in the URL, so a shared link opens on the right one. */
  readonly initialVariantId?: string;
}) {
  const variants = product.variants;
  const basket = useBasket();

  const opening =
    variants.find((v) => v.id === initialVariantId) ??
    defaultVariant(variants) ??
    variants[0]!;

  const [variant, setVariant] = useState<VariantDto>(opening);
  const [quantity, setQuantity] = useState(1);
  /**
   * Set when a change had to move the customer off their exact combination.
   * Cleared by the next clean selection, so the notice never outlives the
   * situation that caused it.
   */
  const [substituted, setSubstituted] = useState<string | null>(null);
  const [addedId, setAddedId] = useState<string | null>(null);

  const selection: Selection = {
    storageGb: variant.storageGb,
    colourName: variant.colourName,
    condition: variant.condition,
  };

  const options = availableOptions(variants, {});
  const saving = savingFor(variant);
  const vat = vatBreakdown(variant.priceCents);
  const state = stockState(variant.stockQuantity, variant.isActive);
  const buyable = state !== 'out';
  const maxQuantity = Math.min(variant.stockQuantity, BASKET_MAX_QUANTITY);
  const added = addedId === variant.id;

  function choose(partial: Partial<Selection>, changed: Dimension) {
    const wanted: Selection = { ...selection, ...partial };
    const resolved = resolveSelection(variants, wanted, changed);

    const exact = findVariant(variants, wanted) !== null;
    setSubstituted(
      exact
        ? null
        : `We do not make that combination. Showing ${variantLabel(resolved)} instead.`,
    );
    setVariant(resolved);
    setQuantity(1);
    setAddedId(null);
  }

  function addToBasket() {
    basket.add(
      {
        variantId: variant.id,
        productSlug: product.slug,
        productName: product.name,
        variantLabel: variantLabel(variant),
        condition: variant.condition,
        priceCents: variant.priceCents,
        imageUrl: product.images[0]?.url ?? null,
      },
      quantity,
    );
    setAddedId(variant.id);
    track({
      name: 'add_to_basket',
      variantId: variant.id,
      productSlug: product.slug,
      quantity,
      valueCents: variant.priceCents * quantity,
    });
  }

  /** Does any variant exist for this option value, given the rest of the pick? */
  function existsWith(partial: Partial<Selection>): boolean {
    return variants.some((v) => {
      const target = { ...selection, ...partial };
      return (
        (partial.storageGb === undefined || v.storageGb === target.storageGb) &&
        (partial.colourName === undefined ||
          v.colourName === target.colourName) &&
        (partial.condition === undefined || v.condition === target.condition)
      );
    });
  }

  /** Is this option value in stock anywhere, so we can mark empty ones? */
  function inStockWith(partial: Partial<Selection>): boolean {
    return variants.some(
      (v) =>
        v.isActive &&
        v.stockQuantity > 0 &&
        (partial.storageGb === undefined || v.storageGb === partial.storageGb) &&
        (partial.colourName === undefined ||
          v.colourName === partial.colourName) &&
        (partial.condition === undefined || v.condition === partial.condition),
    );
  }

  return (
    <div className="flex flex-col gap-7">
      {/* ---------------- Price ---------------- */}
      <div>
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <p className="text-[2rem] font-bold tabular-nums leading-none text-ink">
            {formatPrice(variant.priceCents)}
          </p>
          {variant.compareAtCents !== null && (
            <p className="text-[1rem] tabular-nums text-grey line-through">
              {formatPrice(variant.compareAtCents)}
            </p>
          )}
          {saving && (
            <span className="rounded-panel bg-red-soft px-2 py-1 text-[0.75rem] font-bold tabular-nums text-red-deep">
              Save {formatPrice(saving.amountCents)}
            </span>
          )}
        </div>
        <p className="mt-2 text-[0.8125rem] tabular-nums text-grey-strong">
          Includes {formatPrice(vat.vatCents)} VAT.{' '}
          {variant.priceCents >= store.freeDeliveryThresholdCents
            ? 'Delivery is free on this one.'
            : `Add ${formatPrice(store.freeDeliveryThresholdCents - variant.priceCents)} for free delivery.`}
        </p>
      </div>

      {/* ---------------- Storage ---------------- */}
      {options.storage.length > 1 && (
        <OptionGroup label="Storage">
          {options.storage.map((gb) => (
            <OptionChip
              key={String(gb)}
              selected={variant.storageGb === gb}
              exists={existsWith({ storageGb: gb })}
              inStock={inStockWith({ storageGb: gb })}
              onSelect={() => choose({ storageGb: gb }, 'storage')}
              label={storageLabel(gb)}
            />
          ))}
        </OptionGroup>
      )}

      {/* ---------------- Colour ---------------- */}
      {options.colours.length > 1 && (
        <OptionGroup label="Colour" value={variant.colourName}>
          {options.colours.map((colourName) => {
            const hex =
              variants.find((v) => v.colourName === colourName)?.colourHex ??
              '#cccccc';
            return (
              <ColourChip
                key={colourName}
                colourName={colourName}
                hex={hex}
                selected={variant.colourName === colourName}
                inStock={inStockWith({ colourName })}
                onSelect={() => choose({ colourName }, 'colour')}
              />
            );
          })}
        </OptionGroup>
      )}

      {/* ---------------- Condition ---------------- */}
      <OptionGroup
        label="Condition"
        hint={
          <Link
            href="/grading"
            className="text-[0.75rem] font-semibold text-red underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red"
          >
            What do these mean?
          </Link>
        }
      >
        {options.conditions.map((condition) => {
          const cheapest = variants
            .filter((v) => v.condition === condition)
            .reduce<VariantDto | null>(
              (low, v) =>
                low === null || v.priceCents < low.priceCents ? v : low,
              null,
            );
          return (
            <OptionChip
              key={condition}
              selected={variant.condition === condition}
              exists
              inStock={inStockWith({ condition })}
              onSelect={() => choose({ condition }, 'condition')}
              label={CONDITION_SHORT[condition]}
              sub={cheapest ? formatPrice(cheapest.priceCents) : undefined}
            />
          );
        })}
      </OptionGroup>

      {substituted && (
        <p
          role="status"
          className="rounded-panel border border-line-strong bg-canvas px-3 py-2.5 text-[0.8125rem] leading-relaxed text-ink"
        >
          {substituted}
        </p>
      )}

      {/* ---------------- What this grade means ---------------- */}
      <dl className="grid gap-px overflow-hidden rounded-card border border-line bg-line sm:grid-cols-2">
        <SpecRow
          icon={ShieldCheck}
          term="Warranty"
          detail={`${variant.warrantyMonths} months, covered by us`}
        />
        <SpecRow
          icon={BatteryCharging}
          term="Battery"
          detail={
            variant.batteryHealthMin === null
              ? 'Sealed, as the manufacturer shipped it'
              : `${variant.batteryHealthMin}% health or better, guaranteed`
          }
        />
        <SpecRow
          icon={Check}
          term="Grade"
          detail={CONDITION_LABELS[variant.condition]}
        />
        <SpecRow
          icon={Truck}
          term="Delivery"
          detail={`${store.deliveryDays.min} to ${store.deliveryDays.max} working days`}
        />
      </dl>

      {variant.conditionNote && (
        <p className="text-pretty text-[0.875rem] leading-relaxed text-grey-strong">
          <span className="font-semibold text-ink">This one specifically: </span>
          {variant.conditionNote}
        </p>
      )}

      {/* ---------------- Buy ---------------- */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-4">
          <p
            className={cn(
              'inline-flex items-center gap-2 text-[0.8125rem] font-semibold',
              state === 'out' ? 'text-grey-strong' : 'text-leaf',
            )}
          >
            {/* The dot is decoration; the word carries the meaning, so stock
                is never communicated by colour alone. */}
            <span
              className={cn(
                'size-2 rounded-full',
                state === 'out' ? 'bg-grey' : 'bg-leaf',
              )}
              aria-hidden="true"
            />
            {stockLabel(variant.stockQuantity, variant.isActive)}
          </p>
          <p className="text-spec text-[0.75rem] text-grey">{variant.sku}</p>
        </div>

        {buyable && (
          <QuantityStepper
            value={quantity}
            max={maxQuantity}
            onChange={(next) => {
              setQuantity(next);
              setAddedId(null);
            }}
          />
        )}

        {buyable ? (
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              variant="critical"
              size="lg"
              block
              onClick={addToBasket}
              className="sm:flex-1"
            >
              <ShoppingBag className="size-4" aria-hidden="true" />
              {added ? 'Added to basket' : 'Add to basket'}
            </Button>
            {added && (
              <ButtonLink
                href="/basket"
                size="lg"
                variant="secondary"
                className="sm:w-auto"
              >
                View basket
              </ButtonLink>
            )}
          </div>
        ) : (
          <div className="rounded-card border border-line bg-paper p-4">
            <p className="text-[0.9375rem] font-semibold text-ink">
              This configuration has gone
            </p>
            <p className="mt-1 text-pretty text-[0.8125rem] leading-relaxed text-grey-strong">
              Stock is one device at a time, so a grade can empty quickly. Pick
              another grade above, or ask us on WhatsApp to let you know when
              this one is back.
            </p>
            <ButtonLink href="/contact" variant="secondary" className="mt-4">
              Ask about this one
            </ButtonLink>
          </div>
        )}

        {/* Announced for screen readers without stealing focus. */}
        <p aria-live="polite" className="sr-only">
          {added
            ? `${product.name}, ${variantLabel(variant)}, added to your basket. Basket now holds ${basket.itemCount} ${basket.itemCount === 1 ? 'item' : 'items'}.`
            : ''}
        </p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Pieces                                                              */
/* ------------------------------------------------------------------ */

function OptionGroup({
  label,
  value,
  hint,
  children,
}: {
  readonly label: string;
  readonly value?: string;
  readonly hint?: React.ReactNode;
  readonly children: React.ReactNode;
}) {
  return (
    <fieldset>
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <legend className="text-[0.8125rem] font-semibold text-ink">
          {label}
          {value && <span className="ml-2 font-normal text-grey-strong">{value}</span>}
        </legend>
        {hint}
      </div>
      <div className="flex flex-wrap gap-2">{children}</div>
    </fieldset>
  );
}

function OptionChip({
  label,
  sub,
  selected,
  exists,
  inStock,
  onSelect,
}: {
  readonly label: string;
  readonly sub?: string;
  readonly selected: boolean;
  readonly exists: boolean;
  readonly inStock: boolean;
  readonly onSelect: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      disabled={!exists}
      onClick={onSelect}
      className={cn(
        'relative flex min-w-20 flex-col items-start gap-0.5 rounded-panel border px-3.5 py-2.5',
        'text-left transition-[background-color,border-color,color] duration-[--duration-feedback] ease-out',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red',
        'disabled:cursor-not-allowed disabled:opacity-45',
        selected
          ? 'border-ink bg-ink text-white'
          : 'border-line-strong bg-white text-ink hover:border-ink',
      )}
    >
      <span className="text-[0.875rem] font-semibold">{label}</span>
      {sub && (
        <span
          className={cn(
            'text-[0.75rem] tabular-nums',
            selected ? 'text-white/70' : 'text-grey-strong',
          )}
        >
          {inStock ? sub : 'Sold out'}
        </span>
      )}
      {!sub && !inStock && exists && (
        <span
          className={cn(
            'text-[0.6875rem]',
            selected ? 'text-white/70' : 'text-grey',
          )}
        >
          Sold out
        </span>
      )}
    </button>
  );
}

function ColourChip({
  colourName,
  hex,
  selected,
  inStock,
  onSelect,
}: {
  readonly colourName: string;
  readonly hex: string;
  readonly selected: boolean;
  readonly inStock: boolean;
  readonly onSelect: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      // The swatch is a colour, so the name has to be in the accessible name.
      aria-label={inStock ? colourName : `${colourName}, sold out`}
      onClick={onSelect}
      className={cn(
        'relative flex size-11 items-center justify-center rounded-full border-2',
        'transition-[border-color,transform] duration-[--duration-feedback] ease-out',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red',
        selected ? 'border-ink' : 'border-transparent hover:border-line-strong',
        !inStock && 'opacity-45',
      )}
    >
      <span
        className="size-7 rounded-full ring-1 ring-inset ring-ink/15"
        style={{ backgroundColor: hex }}
        aria-hidden="true"
      />
      {!inStock && (
        <span
          className="absolute h-[2px] w-8 rotate-45 rounded-full bg-ink/60"
          aria-hidden="true"
        />
      )}
    </button>
  );
}

function QuantityStepper({
  value,
  max,
  onChange,
}: {
  readonly value: number;
  readonly max: number;
  readonly onChange: (next: number) => void;
}) {
  if (max <= 1) return null;

  return (
    <div className="flex items-center gap-3">
      <span id="qty-label" className="text-[0.8125rem] font-semibold text-ink">
        Quantity
      </span>
      <div className="inline-flex items-center rounded-panel border border-line-strong">
        <button
          type="button"
          aria-label="One fewer"
          disabled={value <= 1}
          onClick={() => onChange(value - 1)}
          className="flex size-10 items-center justify-center rounded-l-panel text-ink transition-colors duration-[--duration-feedback] hover:bg-canvas disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red"
        >
          <Minus className="size-4" aria-hidden="true" />
        </button>
        <output
          aria-labelledby="qty-label"
          className="w-10 text-center text-[0.9375rem] font-semibold tabular-nums text-ink"
        >
          {value}
        </output>
        <button
          type="button"
          aria-label="One more"
          disabled={value >= max}
          onClick={() => onChange(value + 1)}
          className="flex size-10 items-center justify-center rounded-r-panel text-ink transition-colors duration-[--duration-feedback] hover:bg-canvas disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red"
        >
          <Plus className="size-4" aria-hidden="true" />
        </button>
      </div>
      {value >= max && (
        <p className="text-[0.75rem] text-grey-strong">
          {max === BASKET_MAX_QUANTITY
            ? 'Our limit per order'
            : 'All we have of this one'}
        </p>
      )}
    </div>
  );
}

function SpecRow({
  icon: Icon,
  term,
  detail,
}: {
  readonly icon: React.ComponentType<{ className?: string }>;
  readonly term: string;
  readonly detail: string;
}) {
  return (
    <div className="flex items-start gap-3 bg-white p-4">
      <Icon className="mt-0.5 size-4 shrink-0 text-red" aria-hidden="true" />
      <div className="min-w-0">
        <dt className="text-[0.6875rem] font-semibold uppercase text-grey-strong">
          {term}
        </dt>
        <dd className="mt-0.5 text-pretty text-[0.8125rem] font-medium leading-snug text-ink">
          {detail}
        </dd>
      </div>
    </div>
  );
}
