'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Search, X } from 'lucide-react';
import { track } from '@/lib/analytics';

/**
 * The search box.
 *
 * A plain form that navigates on submit, rather than a live-filtering input.
 * That is deliberate: live search over a few dozen models costs a request per
 * keystroke to save nobody any time, and a submitted search leaves a URL that
 * can be shared and that the back button understands.
 *
 * It is a real <form> with a real submit, so Enter works and so does the
 * keyboard Search button on a phone.
 */
export function SearchField({
  defaultValue = '',
  autoFocus = false,
}: {
  readonly defaultValue?: string;
  readonly autoFocus?: boolean;
}) {
  const router = useRouter();
  const [value, setValue] = useState(defaultValue);

  return (
    <form
      role="search"
      onSubmit={(event) => {
        event.preventDefault();
        const query = value.trim();
        if (query.length < 2) return;
        track({ name: 'search_performed', query });
        router.push(`/search?q=${encodeURIComponent(query)}`);
      }}
      className="relative"
    >
      <label htmlFor="site-search" className="sr-only">
        Search for a device
      </label>
      <Search
        className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-grey"
        aria-hidden="true"
      />
      <input
        id="site-search"
        name="q"
        type="search"
        value={value}
        autoFocus={autoFocus}
        onChange={(event) => setValue(event.target.value)}
        placeholder="iPhone 14, MacBook Air, AirPods"
        className="h-12 w-full rounded-panel border border-line-strong bg-white pl-10 pr-24 text-[0.9375rem] text-ink placeholder:text-grey-light transition-[border-color] duration-[--duration-feedback] focus:border-ink focus:outline-none"
      />
      {value.length > 0 && (
        <button
          type="button"
          aria-label="Clear search"
          onClick={() => setValue('')}
          className="absolute right-[4.75rem] top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-full text-grey transition-colors duration-[--duration-feedback] hover:bg-canvas hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red"
        >
          <X className="size-3.5" aria-hidden="true" />
        </button>
      )}
      <button
        type="submit"
        className="absolute right-1.5 top-1/2 h-9 -translate-y-1/2 rounded-panel bg-ink px-4 text-[0.8125rem] font-semibold text-white transition-colors duration-[--duration-feedback] hover:bg-graphite focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red"
      >
        Search
      </button>
    </form>
  );
}
