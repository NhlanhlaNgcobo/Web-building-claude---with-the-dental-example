'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowRight, CalendarCheck, CalendarX2, Phone } from 'lucide-react';
import { cn } from '@/lib/cn';
import { clinic } from '@/data/clinic';
import type { SlotDto } from '@/types';

/**
 * The live availability card.
 *
 * Every time shown here comes from the same availability engine that drives
 * the booking calendar, so the card cannot drift out of step with what is
 * actually bookable. It is not marketing copy with a plausible-looking time
 * typed into it.
 *
 * Why this fetches on the client rather than rendering on the server: the
 * marketing pages are statically generated, which is what makes them fast. A
 * server-rendered time would therefore be frozen at build time, or at best at
 * whatever moment a CDN last revalidated the page, and would confidently show
 * a slot that went hours ago. Fetching after mount keeps the page static and
 * the times genuinely current. The skeleton below is shaped like the loaded
 * card, so nothing shifts when the data lands.
 *
 * On honest urgency: there is no countdown, no "book now before it goes" and
 * no invented demand. The only scarcity message is the real one, shown when a
 * day genuinely has a single appointment left, and even then it is stated
 * flatly.
 */

interface NextAvailableResponse {
  readonly slots: readonly SlotDto[];
  readonly exhausted: boolean;
  readonly remainingToday: number | null;
  readonly service?: {
    readonly slug: string;
    readonly name: string;
    readonly durationMinutes: number;
  };
}

type State =
  | { status: 'loading' }
  | { status: 'ready'; data: NextAvailableResponse }
  | { status: 'error' };

export function AvailabilityCard({
  serviceSlug = 'routine-examination',
  tone = 'dark',
  className,
  heading = 'Next available appointment',
  count = 3,
}: {
  readonly serviceSlug?: string;
  readonly tone?: 'light' | 'dark';
  readonly className?: string;
  readonly heading?: string;
  readonly count?: number;
}) {
  const [state, setState] = useState<State>({ status: 'loading' });

  useEffect(() => {
    // Aborted on unmount so a slow response cannot set state on a gone card.
    const controller = new AbortController();

    const params = new URLSearchParams({
      service: serviceSlug,
      dentist: 'any',
      count: String(count),
      onePerDay: 'true',
      withToday: 'true',
    });

    fetch(`/api/availability/next?${params.toString()}`, {
      signal: controller.signal,
      cache: 'no-store',
    })
      .then((response) => {
        if (!response.ok) throw new Error(`status ${response.status}`);
        return response.json() as Promise<NextAvailableResponse>;
      })
      .then((data) => setState({ status: 'ready', data }))
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        setState({ status: 'error' });
      });

    return () => controller.abort();
  }, [serviceSlug, count]);

  const dark = tone === 'dark';

  if (state.status === 'loading') {
    return (
      <AvailabilityCardSkeleton tone={tone} className={className} count={count} />
    );
  }

  return (
    <div
      className={cn(
        'rounded-card p-5 sm:p-6',
        dark ? 'glass-dark' : 'glass-light',
        className,
      )}
    >
      <div className="flex items-center gap-2.5">
        <span
          className={cn(
            'flex size-8 shrink-0 items-center justify-center rounded-panel',
            dark ? 'bg-blue/20 text-blue-soft' : 'bg-blue-soft text-blue-deep',
          )}
        >
          <CalendarCheck className="size-4" aria-hidden="true" />
        </span>
        <div>
          <h2
            className={cn(
              'text-[0.9375rem] font-semibold',
              dark ? 'text-white' : 'text-ink',
            )}
          >
            {heading}
          </h2>
          {state.status === 'ready' && state.data.service && (
            <p
              className={cn(
                'text-xs',
                dark ? 'text-white/55' : 'text-grey-strong',
              )}
            >
              {state.data.service.name},{' '}
              <span className="tabular-nums">
                {state.data.service.durationMinutes}
              </span>{' '}
              minutes
            </p>
          )}
        </div>
      </div>

      {state.status === 'error' ? (
        <FallbackNotice dark={dark}>
          We could not load live availability just now. Please phone reception
          and we will find you a time.
        </FallbackNotice>
      ) : state.data.slots.length === 0 ? (
        <FallbackNotice dark={dark}>
          Online booking is full for the period we show. Please phone reception
          and we will find you a time.
        </FallbackNotice>
      ) : (
        <ul className="mt-5 flex flex-col gap-1.5">
          {state.data.slots.map((slot) => (
            <li key={`${slot.date}-${slot.startMinutes}`}>
              {/* Each row links straight into the booking flow with the slot
                  already chosen, so the card is a shortcut rather than a
                  signpost. */}
              <Link
                href={{
                  pathname: '/book',
                  query: {
                    service: serviceSlug,
                    dentist: slot.dentistId,
                    date: slot.date,
                    time: String(slot.startMinutes),
                    step: 'details',
                  },
                }}
                className={cn(
                  'group flex items-center justify-between gap-4 rounded-panel px-3.5 py-3',
                  'transition-colors duration-[--duration-feedback] ease-out',
                  'focus-visible:outline-2 focus-visible:outline-offset-2',
                  dark
                    ? 'bg-white/[0.05] hover:bg-white/[0.1] focus-visible:outline-white'
                    : 'bg-canvas hover:bg-blue-soft focus-visible:outline-blue',
                )}
              >
                <span className="flex min-w-0 flex-col">
                  <span
                    className={cn(
                      'text-[0.8125rem] font-medium',
                      dark ? 'text-white' : 'text-ink',
                    )}
                  >
                    {relativeLabel(slot.date)}
                  </span>
                  <span
                    className={cn(
                      'truncate text-xs',
                      dark ? 'text-white/50' : 'text-grey-strong',
                    )}
                  >
                    {shortLabel(slot.date)} with {slot.dentistName}
                  </span>
                </span>
                <span className="flex items-center gap-2">
                  <time
                    dateTime={slot.startTime}
                    className={cn(
                      'text-[1.0625rem] font-semibold tabular-nums',
                      dark ? 'text-white' : 'text-ink',
                    )}
                  >
                    {slot.startLabel}
                  </time>
                  <ArrowRight
                    className={cn(
                      'size-4 shrink-0',
                      'transition-transform duration-[--duration-feedback] ease-out',
                      'group-hover:translate-x-0.5',
                      dark ? 'text-white/40' : 'text-grey',
                    )}
                    aria-hidden="true"
                  />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {/* Stated only when it is literally true. */}
      {state.status === 'ready' && state.data.remainingToday === 1 && (
        <p
          className={cn(
            'mt-3 text-xs',
            dark ? 'text-white/55' : 'text-grey-strong',
          )}
        >
          1 appointment available today.
        </p>
      )}

      <div className="mt-5">
        {state.status === 'error' ? (
          <a
            href={`tel:${clinic.telephone.e164}`}
            className={cn(
              'flex h-11 w-full items-center justify-center gap-2 rounded-panel text-sm font-medium',
              'transition-colors duration-[--duration-feedback] ease-out',
              dark
                ? 'bg-white text-ink hover:bg-canvas focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white'
                : 'bg-blue text-white hover:bg-blue-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue',
            )}
          >
            <Phone className="size-4" aria-hidden="true" />
            <span className="tabular-nums">{clinic.telephone.display}</span>
          </a>
        ) : (
          <Link
            href={`/book?service=${serviceSlug}`}
            className={cn(
              'flex h-11 w-full items-center justify-center rounded-panel text-sm font-medium',
              'transition-colors duration-[--duration-feedback] ease-out',
              dark
                ? 'bg-white text-ink hover:bg-canvas focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white'
                : 'bg-blue text-white hover:bg-blue-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue',
            )}
          >
            View available times
          </Link>
        )}
      </div>
    </div>
  );
}

function FallbackNotice({
  dark,
  children,
}: {
  readonly dark: boolean;
  readonly children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        'mt-5 flex items-start gap-3 rounded-panel p-4',
        dark ? 'bg-white/[0.04]' : 'bg-canvas',
      )}
    >
      <CalendarX2
        className={cn(
          'mt-0.5 size-4 shrink-0',
          dark ? 'text-white/45' : 'text-grey',
        )}
        aria-hidden="true"
      />
      <p
        className={cn(
          'text-[0.8125rem] leading-relaxed',
          dark ? 'text-white/70' : 'text-grey-strong',
        )}
      >
        {children}
      </p>
    </div>
  );
}

/**
 * Loading shape, matched to the real card's height so the hero does not shift
 * when the data arrives.
 */
export function AvailabilityCardSkeleton({
  tone = 'dark',
  className,
  count = 3,
}: {
  readonly tone?: 'light' | 'dark';
  readonly className?: string;
  readonly count?: number;
}) {
  const dark = tone === 'dark';
  const block = dark ? 'bg-white/10' : 'bg-canvas-deep';

  return (
    <div
      className={cn(
        'rounded-card p-5 sm:p-6',
        dark ? 'glass-dark' : 'glass-light',
        className,
      )}
      role="status"
      aria-busy="true"
      aria-label="Loading appointment availability"
    >
      <div className="flex animate-pulse items-center gap-2.5">
        <div className={cn('size-8 rounded-panel', block)} />
        <div className="flex flex-col gap-1.5">
          <div className={cn('h-3.5 w-44 rounded-panel', block)} />
          <div className={cn('h-2.5 w-28 rounded-panel', block)} />
        </div>
      </div>
      <div className="mt-5 flex animate-pulse flex-col gap-1.5">
        {Array.from({ length: count }, (_, i) => (
          <div key={i} className={cn('h-[3.25rem] rounded-panel', block)} />
        ))}
      </div>
      <div className={cn('mt-5 h-11 animate-pulse rounded-panel', block)} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Local date formatting                                               */
/* ------------------------------------------------------------------ */

/**
 * Formatted in the browser rather than with the server's timezone helpers,
 * because this is a client component and importing the server date utilities
 * would pull date-fns-tz into the client bundle for two labels.
 *
 * The API has already resolved every slot in the clinic's timezone, so these
 * only have to render a plain 'YYYY-MM-DD' string that is already correct.
 */
function parseLocalDate(date: string): Date {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(y!, m! - 1, d!);
}

function relativeLabel(date: string): string {
  const now = new Date();
  const today = toDateKey(now);
  const tomorrow = toDateKey(new Date(now.getTime() + 86_400_000));
  if (date === today) return 'Today';
  if (date === tomorrow) return 'Tomorrow';
  return parseLocalDate(date).toLocaleDateString('en-ZA', { weekday: 'long' });
}

function shortLabel(date: string): string {
  return parseLocalDate(date).toLocaleDateString('en-ZA', {
    day: 'numeric',
    month: 'short',
  });
}

function toDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
