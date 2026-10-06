'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useTransition } from 'react';
import { Check, ChevronDown, X } from 'lucide-react';
import { Select } from '@base-ui/react/select';
import { cn } from '@/lib/cn';
import { CONDITION_ORDER, CONDITION_SHORT } from '@/lib/domain/enums';
import type { Condition } from '@/types';

/**
 * Catalogue filters.
 *
 * The URL is the state. Every control reads from searchParams and writes back
 * to the address bar, which means a filtered grid is a shareable link, the
 * back button steps through filter changes, and there is no second copy of the
 * selection to fall out of sync with the page.
 *
 * useTransition keeps the current grid on screen while the next one loads
 * instead of blanking it, and gives us an honest pending state to dim with.
 */

export const SORT_OPTIONS = [
  { value: 'featured', label: 'Our order' },
  { value: 'price_asc', label: 'Price, low to high' },
  { value: 'price_desc', label: 'Price, high to low' },
  { value: 'newest', label: 'Newest model first' },
] as const;

const PRICE_BANDS = [
  { value: '', label: 'Any price' },
  { value: '0-500000', label: 'Under R5 000' },
  { value: '500000-1000000', label: 'R5 000 to R10 000' },
  { value: '1000000-2000000', label: 'R10 000 to R20 000' },
  { value: '2000000-', label: 'Over R20 000' },
] as const;

export function FilterBar({
  resultCount,
  className,
}: {
  readonly resultCount: number;
  readonly className?: string;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();

  const selectedConditions = new Set(
    (params.get('condition') ?? '').split(',').filter(Boolean),
  );
  const sort = params.get('sort') ?? 'featured';
  const price = params.get('price') ?? '';
  const filtered = selectedConditions.size > 0 || price !== '';

  function push(next: URLSearchParams) {
    startTransition(() => {
      const query = next.toString();
      router.push(query ? `?${query}` : '?', { scroll: false });
    });
  }

  function setParam(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    push(next);
  }

  function toggleCondition(condition: Condition) {
    const next = new URLSearchParams(params.toString());
    const set = new Set(selectedConditions);
    if (set.has(condition)) set.delete(condition);
    else set.add(condition);

    // Written back in our canonical grade order rather than click order, so
    // the same selection always produces the same URL.
    const ordered = CONDITION_ORDER.filter((c) => set.has(c));
    if (ordered.length > 0) next.set('condition', ordered.join(','));
    else next.delete('condition');
    push(next);
  }

  return (
    <div
      className={cn(
        'flex flex-col gap-4 border-y border-line py-4',
        'lg:flex-row lg:items-center lg:justify-between',
        className,
      )}
    >
      {/* Condition, as toggles rather than a dropdown. It is the filter people
          actually came for, so it should not be hidden behind a click. */}
      <fieldset className="min-w-0">
        <legend className="sr-only">Filter by condition</legend>
        <ul className="scroll-x flex gap-2">
          {CONDITION_ORDER.map((condition) => {
            const on = selectedConditions.has(condition);
            return (
              <li key={condition}>
                <button
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggleCondition(condition)}
                  className={cn(
                    'inline-flex h-9 items-center gap-1.5 rounded-panel border px-3',
                    'text-[0.8125rem] font-medium whitespace-nowrap',
                    'transition-[background-color,border-color,color] duration-[--duration-feedback] ease-out',
                    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red',
                    on
                      ? 'border-ink bg-ink text-white'
                      : 'border-line-strong bg-white text-grey-strong hover:border-ink hover:text-ink',
                  )}
                >
                  {/* A tick as well as the colour change, so the selected
                      state is not carried by colour alone. */}
                  {on && <Check className="size-3.5" aria-hidden="true" />}
                  {CONDITION_SHORT[condition]}
                </button>
              </li>
            );
          })}
        </ul>
      </fieldset>

      <div className="flex flex-wrap items-center gap-3">
        <p
          aria-live="polite"
          className={cn(
            'text-[0.8125rem] tabular-nums text-grey-strong',
            'transition-opacity duration-[--duration-feedback]',
            pending && 'opacity-50',
          )}
        >
          {resultCount === 1 ? '1 model' : `${resultCount} models`}
        </p>

        {filtered && (
          <button
            type="button"
            onClick={() => {
              const next = new URLSearchParams(params.toString());
              next.delete('condition');
              next.delete('price');
              push(next);
            }}
            className="inline-flex h-9 items-center gap-1 rounded-panel px-2 text-[0.8125rem] font-medium text-grey-strong transition-colors duration-[--duration-feedback] hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red"
          >
            <X className="size-3.5" aria-hidden="true" />
            Clear filters
          </button>
        )}

        <FilterSelect
          label="Price"
          value={price}
          options={PRICE_BANDS}
          onChange={(value) => setParam('price', value)}
        />
        <FilterSelect
          label="Sort"
          value={sort}
          options={SORT_OPTIONS}
          onChange={(value) =>
            setParam('sort', value === 'featured' ? '' : value)
          }
        />
      </div>
    </div>
  );
}

/**
 * A select built on Base UI, so the keyboard behaviour, typeahead and focus
 * handling are the library's rather than something hand-rolled here.
 */
function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  readonly label: string;
  readonly value: string;
  readonly options: readonly { readonly value: string; readonly label: string }[];
  readonly onChange: (value: string) => void;
}) {
  const current = options.find((o) => o.value === value) ?? options[0]!;

  return (
    <Select.Root
      value={current.value}
      onValueChange={(next) => onChange(String(next))}
    >
      <Select.Trigger className="inline-flex h-9 items-center gap-2 rounded-panel border border-line-strong bg-white px-3 text-[0.8125rem] font-medium text-ink transition-colors duration-[--duration-feedback] hover:border-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red">
        <span className="text-grey-strong">{label}</span>
        <Select.Value>{current.label}</Select.Value>
        <Select.Icon>
          <ChevronDown className="size-3.5 text-grey" aria-hidden="true" />
        </Select.Icon>
      </Select.Trigger>

      <Select.Portal>
        <Select.Positioner sideOffset={6} align="end">
          <Select.Popup className="z-overlay min-w-52 overflow-hidden rounded-card border border-line bg-white py-1 shadow-[0_16px_40px_-12px_rgb(13_17_23/0.2)]">
            {options.map((option) => (
              <Select.Item
                key={option.value}
                value={option.value}
                className="flex cursor-default items-center justify-between gap-3 px-3 py-2 text-[0.8125rem] text-ink outline-none data-highlighted:bg-canvas"
              >
                <Select.ItemText>{option.label}</Select.ItemText>
                <Select.ItemIndicator>
                  <Check className="size-3.5 text-red" aria-hidden="true" />
                </Select.ItemIndicator>
              </Select.Item>
            ))}
          </Select.Popup>
        </Select.Positioner>
      </Select.Portal>
    </Select.Root>
  );
}
