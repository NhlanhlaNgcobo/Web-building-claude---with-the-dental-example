'use client';

import { Clock, Siren, Wallet } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Badge } from '@/components/ui/Primitives';
import { formatPrice } from '@/lib/currency';
import { track } from '@/lib/analytics';
import type { ServiceSummaryDto } from '@/types';

/**
 * Step one: which appointment.
 *
 * Each option states its length, its fee and whether a deposit applies, before
 * the patient commits to anything. A deposit discovered at the payment step
 * would be a bait and switch.
 */
export function ServiceStep({
  services,
  selected,
  onSelect,
}: {
  readonly services: readonly ServiceSummaryDto[];
  readonly selected: string | null;
  readonly onSelect: (slug: string) => void;
}) {
  return (
    <div>
      <h2 className="text-[1.0625rem] font-semibold text-ink">
        What is the appointment for?
      </h2>
      <p className="mt-1 text-sm text-grey-strong">
        If you are not sure, choose a general consultation and we will work it
        out together.
      </p>

      <ul className="mt-6 grid gap-3 sm:grid-cols-2">
        {services.map((service) => {
          const active = selected === service.slug;
          return (
            <li key={service.id}>
              <button
                type="button"
                aria-pressed={active}
                onClick={() => {
                  onSelect(service.slug);
                  track({
                    name: 'service_selected',
                    serviceId: service.id,
                    serviceSlug: service.slug,
                  });
                }}
                className={cn(
                  'flex h-full w-full flex-col items-start gap-3 rounded-card border p-4 text-left',
                  'transition-[border-color,background-color,box-shadow]',
                  'duration-[--duration-feedback] ease-out',
                  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue',
                  active
                    ? 'border-blue bg-blue-tint shadow-[0_0_0_1px_var(--color-blue)]'
                    : 'border-line bg-white hover:border-blue/40 hover:bg-canvas',
                )}
              >
                <div className="flex w-full items-start justify-between gap-3">
                  <span className="text-[0.9375rem] font-semibold text-ink">
                    {service.name}
                  </span>
                  {service.isEmergency && (
                    <Badge
                      tone="critical"
                      icon={<Siren className="size-3" aria-hidden="true" />}
                    >
                      Urgent
                    </Badge>
                  )}
                </div>

                <span className="text-[0.8125rem] leading-relaxed text-grey-strong">
                  {service.shortDescription}
                </span>

                <span className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-grey-strong">
                  <span className="flex items-center gap-1.5">
                    <Clock className="size-3.5" aria-hidden="true" />
                    <span className="tabular-nums">
                      {service.durationMinutes} min
                    </span>
                  </span>
                  {service.priceFromCents !== null && (
                    <span className="font-medium tabular-nums text-charcoal">
                      From {formatPrice(service.priceFromCents)}
                    </span>
                  )}
                  {service.depositType !== 'none' &&
                    service.depositAmountCents !== null && (
                      <span className="flex items-center gap-1.5">
                        <Wallet className="size-3.5" aria-hidden="true" />
                        <span className="tabular-nums">
                          {formatPrice(service.depositAmountCents)} deposit
                          {service.depositType === 'optional' ? ' (optional)' : ''}
                        </span>
                      </span>
                    )}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
