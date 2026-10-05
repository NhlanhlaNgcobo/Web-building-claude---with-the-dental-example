'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Filter, X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { AppointmentStatus } from '@/lib/domain/enums';
import type { AppointmentStatus as Status } from '@/lib/domain/enums';

/**
 * Diary filters.
 *
 * Filter state lives in the query string, so a filtered view can be
 * bookmarked, shared with a colleague and survives a refresh. The page is a
 * server component, so changing a filter is a navigation and the data is
 * refetched server side rather than filtered in the browser.
 */

const statusLabels: Record<Status, string> = {
  pending: 'Deposit due',
  confirmed: 'Confirmed',
  completed: 'Completed',
  cancelled: 'Cancelled',
  no_show: 'Did not attend',
};

export function DiaryControls({
  dentists,
  services,
  selectedDentist,
  selectedService,
  selectedStatuses,
}: {
  readonly dentists: readonly { id: string; name: string }[];
  readonly services: readonly { id: string; name: string }[];
  readonly selectedDentist?: string;
  readonly selectedService?: string;
  readonly selectedStatuses?: readonly Status[];
}) {
  const router = useRouter();
  const params = useSearchParams();

  function update(changes: Record<string, string | undefined>) {
    const next = new URLSearchParams(params.toString());
    for (const [key, value] of Object.entries(changes)) {
      if (value === undefined || value === '') next.delete(key);
      else next.set(key, value);
    }
    router.push(`/admin/calendar?${next.toString()}`);
  }

  function toggleStatus(status: Status) {
    const current = new Set(selectedStatuses ?? []);
    if (current.has(status)) current.delete(status);
    else current.add(status);
    update({
      status: current.size > 0 ? [...current].join(',') : undefined,
    });
  }

  const hasFilters =
    Boolean(selectedDentist) ||
    Boolean(selectedService) ||
    (selectedStatuses?.length ?? 0) > 0;

  const selectClasses =
    'h-9 rounded-panel border border-line-dark bg-charcoal px-2.5 text-[0.8125rem] ' +
    'text-white transition-colors duration-[--duration-feedback] ' +
    'hover:border-line-dark-strong focus:border-blue focus:outline-none';

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-card border border-line-dark bg-white/[0.02] p-3">
      <span className="flex items-center gap-1.5 text-[0.75rem] font-medium text-white/50">
        <Filter className="size-3.5" aria-hidden="true" />
        Filter
      </span>

      <label className="flex items-center gap-2">
        <span className="sr-only">Dentist</span>
        <select
          value={selectedDentist ?? ''}
          onChange={(event) =>
            update({ dentist: event.target.value || undefined })
          }
          className={selectClasses}
        >
          <option value="">All dentists</option>
          {dentists.map((dentist) => (
            <option key={dentist.id} value={dentist.id}>
              {dentist.name}
            </option>
          ))}
        </select>
      </label>

      <label className="flex items-center gap-2">
        <span className="sr-only">Appointment type</span>
        <select
          value={selectedService ?? ''}
          onChange={(event) =>
            update({ service: event.target.value || undefined })
          }
          className={selectClasses}
        >
          <option value="">All appointment types</option>
          {services.map((service) => (
            <option key={service.id} value={service.id}>
              {service.name}
            </option>
          ))}
        </select>
      </label>

      <div
        className="flex flex-wrap items-center gap-1.5"
        role="group"
        aria-label="Filter by status"
      >
        {AppointmentStatus.values.map((status) => {
          const active = selectedStatuses?.includes(status) ?? false;
          return (
            <button
              key={status}
              type="button"
              aria-pressed={active}
              onClick={() => toggleStatus(status)}
              className={cn(
                'h-8 rounded-panel border px-2.5 text-[0.75rem] font-medium',
                'transition-colors duration-[--duration-feedback] ease-out',
                'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white',
                active
                  ? 'border-blue bg-blue/25 text-white'
                  : 'border-line-dark text-white/55 hover:border-line-dark-strong hover:text-white',
              )}
            >
              {statusLabels[status]}
            </button>
          );
        })}
      </div>

      {hasFilters && (
        <button
          type="button"
          onClick={() =>
            update({ dentist: undefined, service: undefined, status: undefined })
          }
          className="ml-auto flex h-8 items-center gap-1.5 rounded-panel px-2.5 text-[0.75rem] font-medium text-white/55 transition-colors duration-[--duration-feedback] hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          <X className="size-3.5" aria-hidden="true" />
          Clear
        </button>
      )}
    </div>
  );
}
