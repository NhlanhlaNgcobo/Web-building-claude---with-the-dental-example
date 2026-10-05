'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowRight, CalendarCheck, Clock, Phone } from 'lucide-react';
import { cn } from '@/lib/cn';
import { clinic } from '@/data/clinic';
import type { SlotDto } from '@/types';

/**
 * The next-appointment call to action on a treatment page.
 *
 * This is what makes the site feel like it knows something. Rather than a
 * generic "contact us to enquire", the page states the genuine next available
 * appointment for this specific treatment and offers to book that exact time
 * in one click.
 *
 * It fetches after mount for the same reason the hero card does: treatment
 * pages are statically generated, so a server-rendered time would be frozen at
 * build time. The skeleton holds the same height to avoid a layout shift.
 */

interface NextResponse {
  readonly slots: readonly SlotDto[];
  readonly exhausted: boolean;
}

export function NextAvailableCta({
  serviceSlug,
  ctaLabel,
  durationMinutes,
  priceLabel,
  treatmentName,
  className,
}: {
  readonly serviceSlug: string;
  readonly ctaLabel: string;
  readonly durationMinutes: number;
  readonly priceLabel: string;
  readonly treatmentName: string;
  readonly className?: string;
}) {
  const [state, setState] = useState<
    { status: 'loading' } | { status: 'ready'; slots: readonly SlotDto[] } | { status: 'error' }
  >({ status: 'loading' });

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams({
      service: serviceSlug,
      dentist: 'any',
      count: '1',
      onePerDay: 'false',
    });

    fetch(`/api/availability/next?${params.toString()}`, {
      signal: controller.signal,
      cache: 'no-store',
    })
      .then((r) => {
        if (!r.ok) throw new Error(String(r.status));
        return r.json() as Promise<NextResponse>;
      })
      .then((data) => setState({ status: 'ready', slots: data.slots }))
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        setState({ status: 'error' });
      });

    return () => controller.abort();
  }, [serviceSlug]);

  const next = state.status === 'ready' ? state.slots[0] : undefined;

  return (
    <aside
      className={cn('rounded-card glass-light p-5 sm:p-6', className)}
      aria-label={`Booking ${treatmentName}`}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <p className="text-[1.25rem] font-semibold tabular-nums text-ink">
          {priceLabel}
        </p>
        <p className="flex items-center gap-1.5 text-[0.8125rem] text-grey-strong">
          <Clock className="size-3.5" aria-hidden="true" />
          <span className="tabular-nums">{durationMinutes} minutes</span>
        </p>
      </div>

      <div className="mt-5 border-t border-line pt-5" aria-live="polite">
        {state.status === 'loading' ? (
          <div className="flex animate-pulse flex-col gap-2">
            <div className="h-3 w-32 rounded-panel bg-canvas-deep" />
            <div className="h-5 w-48 rounded-panel bg-canvas-deep" />
          </div>
        ) : state.status === 'error' || !next ? (
          <div>
            <p className="text-[0.8125rem] text-grey-strong">
              {state.status === 'error'
                ? 'We could not load live availability just now.'
                : 'Nothing is available online for this appointment at the moment.'}
            </p>
            <a
              href={`tel:${clinic.telephone.e164}`}
              className="mt-2 inline-flex items-center gap-2 text-sm font-medium text-blue underline decoration-blue/30 underline-offset-2 hover:decoration-blue"
            >
              <Phone className="size-3.5" aria-hidden="true" />
              <span className="tabular-nums">{clinic.telephone.display}</span>
            </a>
          </div>
        ) : (
          <>
            <p className="flex items-center gap-2 text-[0.8125rem] text-grey-strong">
              <CalendarCheck className="size-3.5 text-blue" aria-hidden="true" />
              Next appointment
            </p>
            <p className="mt-1.5 text-[1.0625rem] font-semibold text-ink">
              {relativeLabel(next.date)} at{' '}
              <time dateTime={next.startTime} className="tabular-nums">
                {next.startLabel}
              </time>
            </p>
            <p className="mt-0.5 text-xs text-grey-strong">
              with {next.dentistName}
            </p>
          </>
        )}
      </div>

      <div className="mt-5 flex flex-col gap-2">
        {next && (
          <Link
            href={{
              pathname: '/book',
              query: {
                service: serviceSlug,
                dentist: next.dentistId,
                date: next.date,
                time: String(next.startMinutes),
                step: 'details',
              },
            }}
            className="flex h-12 items-center justify-center gap-2 rounded-panel bg-blue text-sm font-semibold text-white transition-colors duration-[--duration-feedback] hover:bg-blue-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue"
          >
            Book <span className="tabular-nums">{next.startLabel}</span>
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        )}
        <Link
          href={`/book?service=${serviceSlug}`}
          className={cn(
            'flex h-12 items-center justify-center rounded-panel text-sm font-medium',
            'transition-colors duration-[--duration-feedback] ease-out',
            'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue',
            next
              ? 'border border-line-strong bg-white text-ink hover:border-ink hover:bg-canvas'
              : 'bg-blue text-white hover:bg-blue-deep',
          )}
        >
          {next ? 'View other times' : ctaLabel}
        </Link>
      </div>
    </aside>
  );
}

function parseLocalDate(date: string): Date {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(y!, m! - 1, d!);
}

function relativeLabel(date: string): string {
  const now = new Date();
  const key = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  if (date === key(now)) return 'Today';
  if (date === key(new Date(now.getTime() + 86_400_000))) return 'Tomorrow';
  return parseLocalDate(date).toLocaleDateString('en-ZA', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
  });
}
