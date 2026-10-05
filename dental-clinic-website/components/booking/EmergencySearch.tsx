'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowRight, Clock, Phone, Search } from 'lucide-react';
import { cn } from '@/lib/cn';
import { clinic } from '@/data/clinic';
import { track } from '@/lib/analytics';
import type { SlotDto } from '@/types';

/**
 * Earliest-first search for urgent appointments.
 *
 * Grouped as today, tomorrow and then whatever is next, because when somebody
 * is in pain those are the only three answers that matter. The search is
 * capped at a seven day horizon on the server: a slot three weeks out is not
 * an answer to "my tooth hurts", and offering it would be worse than saying
 * plainly that nothing is free and to phone us.
 */

interface NextResponse {
  readonly slots: readonly SlotDto[];
  readonly exhausted: boolean;
}

function dateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function EmergencySearch() {
  const [state, setState] = useState<
    { status: 'loading' } | { status: 'ready'; slots: readonly SlotDto[] } | { status: 'error' }
  >({ status: 'loading' });

  useEffect(() => {
    track({ name: 'emergency_viewed', source: 'emergency_page' });

    const controller = new AbortController();
    const params = new URLSearchParams({
      service: 'emergency-consultation',
      dentist: 'any',
      count: '8',
      onePerDay: 'false',
      maxDays: '7',
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
  }, []);

  const now = new Date();
  const todayKey = dateKey(now);
  const tomorrowKey = dateKey(new Date(now.getTime() + 86_400_000));

  const slots = state.status === 'ready' ? state.slots : [];
  const today = slots.filter((s) => s.date === todayKey);
  const tomorrow = slots.filter((s) => s.date === tomorrowKey);
  const later = slots.filter(
    (s) => s.date !== todayKey && s.date !== tomorrowKey,
  );

  return (
    <div className="rounded-card glass-dark p-5 sm:p-6">
      <div className="flex items-center gap-2.5">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-panel bg-[--color-critical] text-white">
          <Search className="size-4" aria-hidden="true" />
        </span>
        <div>
          <h2 className="text-[0.9375rem] font-semibold text-white">
            Earliest urgent appointments
          </h2>
          <p className="text-xs text-white/55">
            Emergency consultation, 30 minutes
          </p>
        </div>
      </div>

      <div className="mt-6" aria-live="polite">
        {state.status === 'loading' ? (
          <div className="flex animate-pulse flex-col gap-2">
            {Array.from({ length: 3 }, (_, i) => (
              <div key={i} className="h-16 rounded-panel bg-white/10" />
            ))}
          </div>
        ) : state.status === 'error' ? (
          <p className="text-[0.8125rem] leading-relaxed text-white/70">
            We could not load live availability. Please phone the practice and
            we will get you seen.
          </p>
        ) : slots.length === 0 ? (
          <div className="rounded-panel bg-white/[0.06] p-4">
            <p className="text-[0.9375rem] font-semibold text-white">
              Nothing free online in the next week
            </p>
            <p className="mt-1.5 text-[0.8125rem] leading-relaxed text-white/65">
              That does not mean we cannot see you. Phone reception: urgent
              cases are triaged by telephone and we hold time back each morning
              that is not released online.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            <SlotGroup title="Today" slots={today} emptyNote="No urgent appointments left today." />
            <SlotGroup title="Tomorrow" slots={tomorrow} emptyNote="Nothing free tomorrow." />
            {later.length > 0 && (
              <SlotGroup title="Next available" slots={later.slice(0, 4)} />
            )}
          </div>
        )}
      </div>

      <div className="mt-6 border-t border-white/10 pt-5">
        <a
          href={`tel:${clinic.telephone.e164}`}
          onClick={() => track({ name: 'contact_clicked', channel: 'telephone' })}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-panel bg-white text-sm font-semibold text-ink transition-colors duration-[--duration-feedback] hover:bg-canvas focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          <Phone className="size-4" aria-hidden="true" />
          Call the practice
          <span className="tabular-nums">{clinic.telephone.display}</span>
        </a>
        <p className="mt-3 text-center text-xs text-white/50">
          Phoning is the fastest route if nothing above suits.
        </p>
      </div>
    </div>
  );
}

function SlotGroup({
  title,
  slots,
  emptyNote,
}: {
  readonly title: string;
  readonly slots: readonly SlotDto[];
  readonly emptyNote?: string;
}) {
  if (slots.length === 0 && !emptyNote) return null;

  return (
    <div>
      <h3 className="text-eyebrow text-white/55">{title}</h3>
      {slots.length === 0 ? (
        <p className="mt-2 text-[0.8125rem] text-white/45">{emptyNote}</p>
      ) : (
        <ul className="mt-2.5 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {slots.map((slot) => (
            <li key={`${slot.date}-${slot.startMinutes}`}>
              <Link
                href={{
                  pathname: '/book',
                  query: {
                    service: 'emergency-consultation',
                    dentist: slot.dentistId,
                    date: slot.date,
                    time: String(slot.startMinutes),
                    step: 'details',
                  },
                }}
                className={cn(
                  'group flex flex-col items-start gap-0.5 rounded-panel px-3 py-2.5',
                  'bg-white/[0.07] transition-colors duration-[--duration-feedback] ease-out',
                  'hover:bg-white/[0.14]',
                  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white',
                )}
              >
                <span className="flex w-full items-center justify-between gap-2">
                  <time
                    dateTime={slot.startTime}
                    className="text-[0.9375rem] font-semibold tabular-nums text-white"
                  >
                    {slot.startLabel}
                  </time>
                  <ArrowRight
                    className="size-3.5 shrink-0 text-white/40 transition-transform duration-[--duration-feedback] ease-out group-hover:translate-x-0.5"
                    aria-hidden="true"
                  />
                </span>
                <span className="flex items-center gap-1 text-[0.6875rem] text-white/50">
                  <Clock className="size-3" aria-hidden="true" />
                  {new Date(`${slot.date}T12:00:00`).toLocaleDateString(
                    'en-ZA',
                    { weekday: 'short', day: 'numeric', month: 'short' },
                  )}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
