'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import {
  Activity,
  CircleDot,
  Search,
  Siren,
  Smile,
  Sparkles,
  Stethoscope,
  Wrench,
  X,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { quickSelectorOptions } from '@/data/services';
import { treatments } from '@/data/treatments';
import { track } from '@/lib/analytics';
import type { Treatment } from '@/types';

/**
 * "What can we help you with?"
 *
 * Two ways in, both of which land on the right booking journey rather than a
 * menu: eight named shortcuts, and a search that maps what a patient would
 * actually type ("broken tooth", "bleeding gums") onto the relevant treatment.
 */

const optionIcons: Record<string, React.ReactNode> = {
  'Check-up': <Stethoscope className="size-5" aria-hidden="true" />,
  Toothache: <Zap className="size-5" aria-hidden="true" />,
  'Teeth cleaning': <Sparkles className="size-5" aria-hidden="true" />,
  'Teeth whitening': <Smile className="size-5" aria-hidden="true" />,
  'Broken tooth': <Wrench className="size-5" aria-hidden="true" />,
  Filling: <CircleDot className="size-5" aria-hidden="true" />,
  Crown: <Activity className="size-5" aria-hidden="true" />,
  'Dental emergency': <Siren className="size-5" aria-hidden="true" />,
};

/**
 * Match a query against treatment names, summaries and the search terms each
 * treatment declares. Scored so that an exact term match ranks above an
 * incidental mention in body copy.
 */
function searchTreatments(query: string): Treatment[] {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];

  const scored = treatments
    .map((treatment) => {
      let score = 0;
      const name = treatment.name.toLowerCase();

      if (name === q) score += 100;
      else if (name.startsWith(q)) score += 60;
      else if (name.includes(q)) score += 40;

      for (const term of treatment.searchTerms) {
        const t = term.toLowerCase();
        if (t === q) score += 80;
        else if (t.startsWith(q)) score += 45;
        else if (t.includes(q)) score += 20;
      }

      if (treatment.summary.toLowerCase().includes(q)) score += 8;

      return { treatment, score };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, 5).map((entry) => entry.treatment);
}

export function QuickSelector() {
  const [query, setQuery] = useState('');
  const results = useMemo(() => searchTreatments(query), [query]);
  const showResults = query.trim().length >= 2;

  return (
    <div>
      {/* Search */}
      <div className="relative max-w-xl">
        <label htmlFor="treatment-search" className="sr-only">
          Search treatments and symptoms
        </label>
        <Search
          className="pointer-events-none absolute left-4 top-1/2 size-[1.125rem] -translate-y-1/2 text-grey"
          aria-hidden="true"
        />
        <input
          id="treatment-search"
          type="search"
          value={query}
          onChange={(event) => {
            const value = event.target.value;
            setQuery(value);
            if (value.trim().length >= 2) {
              track({
                name: 'search_performed',
                query: value.trim(),
                resultCount: searchTreatments(value).length,
              });
            }
          }}
          placeholder="Toothache, whitening, bleeding gums..."
          autoComplete="off"
          role="combobox"
          aria-expanded={showResults}
          aria-controls="treatment-search-results"
          aria-describedby="treatment-search-hint"
          className={cn(
            'h-14 w-full rounded-card border border-line-strong bg-white',
            'pl-12 pr-11 text-[0.9375rem] text-ink placeholder:text-grey-light',
            'transition-[border-color,box-shadow] duration-[--duration-feedback] ease-out',
            'focus:border-blue focus:outline-none',
            'focus:shadow-[0_0_0_3px_rgb(20_92_255/0.12)]',
          )}
        />
        {query.length > 0 && (
          <button
            type="button"
            onClick={() => setQuery('')}
            aria-label="Clear search"
            className="absolute right-3 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-panel text-grey transition-colors hover:bg-canvas hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        )}
      </div>

      <p id="treatment-search-hint" className="mt-2 text-xs text-grey-strong">
        Search by treatment or by what you have noticed.
      </p>

      {/* Results are announced politely, and the count is spoken as well as
          shown, so a screen reader user knows the search did something. */}
      <div
        id="treatment-search-results"
        role="region"
        aria-live="polite"
        aria-atomic="true"
      >
        {showResults && (
          <div className="mt-4">
            {results.length === 0 ? (
              <div className="rounded-card border border-line bg-canvas p-5">
                <p className="text-sm font-medium text-ink">
                  Nothing matched &ldquo;{query.trim()}&rdquo;
                </p>
                <p className="mt-1 text-sm text-grey-strong">
                  Book a general consultation and we will work out what is
                  needed, or phone reception and ask.
                </p>
                <Link
                  href="/book?service=general-consultation"
                  className="mt-3 inline-flex text-sm font-medium text-blue underline decoration-blue/30 underline-offset-2 hover:decoration-blue"
                >
                  Book a general consultation
                </Link>
              </div>
            ) : (
              <>
                <p className="sr-only">
                  {results.length} matching{' '}
                  {results.length === 1 ? 'treatment' : 'treatments'}
                </p>
                <ul className="flex flex-col gap-1.5 rounded-card border border-line bg-white p-1.5 shadow-[0_12px_32px_-12px_rgb(10_11_13/0.12)]">
                  {results.map((treatment) => (
                    <li key={treatment.slug}>
                      <Link
                        href={`/treatments/${treatment.slug}`}
                        className="flex items-center justify-between gap-4 rounded-panel px-3.5 py-3 transition-colors duration-[--duration-feedback] hover:bg-canvas focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-blue"
                      >
                        <span className="min-w-0">
                          <span className="block text-sm font-medium text-ink">
                            {treatment.name}
                          </span>
                          <span className="mt-0.5 block truncate text-xs text-grey-strong">
                            {treatment.summary}
                          </span>
                        </span>
                        <span className="shrink-0 text-xs font-medium text-blue">
                          View
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        )}
      </div>

      {/* Shortcuts */}
      <ul className="mt-8 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {quickSelectorOptions.map((option) => (
          <li key={option.label}>
            <Link
              href={`/book?service=${option.serviceSlug}`}
              onClick={() =>
                track({
                  name: 'booking_started',
                  entryPoint: 'quick_selector',
                  serviceSlug: option.serviceSlug,
                })
              }
              className={cn(
                'group flex h-full flex-col gap-3 rounded-card border border-line bg-white p-4',
                'transition-[border-color,transform,box-shadow]',
                'duration-[--duration-feedback] ease-out',
                'hover:-translate-y-0.5 hover:border-blue/40',
                'hover:shadow-[0_10px_24px_-10px_rgb(7_61_158/0.16)]',
                'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue',
              )}
            >
              <span
                className={cn(
                  'flex size-10 items-center justify-center rounded-panel',
                  option.label === 'Dental emergency'
                    ? 'bg-[--color-critical-soft] text-[--color-critical]'
                    : 'bg-blue-soft text-blue-deep',
                )}
              >
                {optionIcons[option.label]}
              </span>
              <span className="text-sm font-medium leading-snug text-ink">
                {option.label}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
