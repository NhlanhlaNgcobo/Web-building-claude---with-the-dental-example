'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useTransition } from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { ORDER_STATUS_LABELS, OrderStatus } from '@/lib/domain/enums';

/**
 * Order list filters.
 *
 * URL driven, like the shopfront filters, so a staff member can bookmark
 * "everything awaiting payment" or send somebody a link to it.
 */
export function OrderFilters({
  resultCount,
}: {
  readonly resultCount: number;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [query, setQuery] = useState(params.get('q') ?? '');

  const status = params.get('status') ?? '';

  function push(next: URLSearchParams) {
    startTransition(() => {
      const search = next.toString();
      router.push(search ? `?${search}` : '?', { scroll: false });
    });
  }

  function setStatus(value: string) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set('status', value);
    else next.delete('status');
    push(next);
  }

  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="scroll-x flex gap-2">
        <FilterChip
          label="All"
          active={status === ''}
          onSelect={() => setStatus('')}
        />
        {OrderStatus.values.map((value) => (
          <FilterChip
            key={value}
            label={ORDER_STATUS_LABELS[value]}
            active={status === value}
            onSelect={() => setStatus(value)}
          />
        ))}
      </div>

      <div className="flex items-center gap-3">
        <p
          aria-live="polite"
          className={cn(
            'whitespace-nowrap text-[0.8125rem] tabular-nums text-grey-strong',
            pending && 'opacity-50',
          )}
        >
          {resultCount === 1 ? '1 order' : `${resultCount} orders`}
        </p>

        <form
          role="search"
          onSubmit={(event) => {
            event.preventDefault();
            const next = new URLSearchParams(params.toString());
            const trimmed = query.trim();
            if (trimmed) next.set('q', trimmed);
            else next.delete('q');
            push(next);
          }}
          className="relative"
        >
          <label htmlFor="order-search" className="sr-only">
            Search orders by reference, name or email
          </label>
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-grey"
            aria-hidden="true"
          />
          <input
            id="order-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Reference, name or email"
            className="h-9 w-56 rounded-panel border border-line-strong bg-white pl-9 pr-8 text-[0.8125rem] text-ink placeholder:text-grey-light focus:border-ink focus:outline-none"
          />
          {query.length > 0 && (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => {
                setQuery('');
                const next = new URLSearchParams(params.toString());
                next.delete('q');
                push(next);
              }}
              className="absolute right-2 top-1/2 flex size-5 -translate-y-1/2 items-center justify-center rounded-full text-grey hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red"
            >
              <X className="size-3" aria-hidden="true" />
            </button>
          )}
        </form>
      </div>
    </div>
  );
}

function FilterChip({
  label,
  active,
  onSelect,
}: {
  readonly label: string;
  readonly active: boolean;
  readonly onSelect: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onSelect}
      className={cn(
        'h-8 whitespace-nowrap rounded-panel border px-3 text-[0.8125rem] font-medium',
        'transition-[background-color,border-color,color] duration-[--duration-feedback]',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red',
        active
          ? 'border-ink bg-ink text-white'
          : 'border-line-strong bg-white text-grey-strong hover:border-ink hover:text-ink',
      )}
    >
      {label}
    </button>
  );
}
