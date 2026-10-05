'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { CalendarCheck, Mail, Phone, Store } from 'lucide-react';
import { cn } from '@/lib/cn';
import { OrderStatus, type OrderStatus as Status } from '@/lib/domain/enums';

interface OrderView {
  readonly id: string;
  readonly reference: string;
  readonly status: string;
  readonly fulfilment: string;
  readonly contactName: string;
  readonly contactMobile: string;
  readonly contactEmail: string;
  readonly totalLabel: string;
  readonly placedLabel: string;
  readonly notes: string | null;
  readonly items: readonly {
    name: string;
    quantity: number;
    lineTotalLabel: string;
  }[];
  readonly appointment: {
    readonly reference: string;
    readonly dateLabel: string;
  } | null;
}

const statusLabels: Record<Status, string> = {
  pending: 'To prepare',
  paid: 'Paid',
  ready_for_collection: 'Ready',
  fulfilled: 'Collected',
  cancelled: 'Cancelled',
};

const statusStyles: Record<Status, string> = {
  pending: 'bg-[--color-caution]/20 text-[#fdb022]',
  paid: 'bg-blue/25 text-blue-soft',
  ready_for_collection: 'bg-[--color-positive]/20 text-[#75e0a7]',
  fulfilled: 'bg-white/10 text-white/60',
  cancelled: 'bg-[--color-critical]/20 text-[#ff9c93]',
};

export function OrderRow({ order }: { readonly order: OrderView }) {
  const router = useRouter();
  const [working, setWorking] = useState(false);

  async function setStatus(status: Status) {
    setWorking(true);
    try {
      await fetch(`/api/admin/orders/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      router.refresh();
    } finally {
      setWorking(false);
    }
  }

  const status = order.status as Status;

  return (
    <li className="rounded-card border border-line-dark bg-white/[0.02] p-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="text-[0.9375rem] font-semibold tabular-nums text-white">
              {order.reference}
            </span>
            <span
              className={cn(
                'inline-flex items-center rounded-panel px-2 py-0.5 text-[0.625rem] font-semibold uppercase',
                statusStyles[status] ?? statusStyles.pending,
              )}
              style={{ letterSpacing: '0.05em' }}
            >
              {statusLabels[status] ?? status}
            </span>
            {order.appointment && (
              <span className="inline-flex items-center gap-1.5 rounded-panel bg-blue/20 px-2 py-0.5 text-[0.625rem] font-semibold uppercase text-blue-soft">
                <CalendarCheck className="size-3" aria-hidden="true" />
                For {order.appointment.dateLabel}
              </span>
            )}
          </div>

          <p className="mt-1.5 text-[0.8125rem] text-white/70">
            {order.contactName}
            <span className="text-white/35"> placed {order.placedLabel}</span>
          </p>

          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
            <a
              href={`tel:${order.contactMobile}`}
              className="flex items-center gap-1.5 text-[0.75rem] tabular-nums text-white/55 transition-colors hover:text-white"
            >
              <Phone className="size-3" aria-hidden="true" />
              {order.contactMobile}
            </a>
            <a
              href={`mailto:${order.contactEmail}`}
              className="flex items-center gap-1.5 truncate text-[0.75rem] text-white/55 transition-colors hover:text-white"
            >
              <Mail className="size-3" aria-hidden="true" />
              {order.contactEmail}
            </a>
            <span className="flex items-center gap-1.5 text-[0.75rem] text-white/55">
              <Store className="size-3" aria-hidden="true" />
              {order.fulfilment === 'collect_at_appointment'
                ? 'Collect at appointment'
                : 'Collect at reception'}
            </span>
          </div>
        </div>

        <p className="text-[1.0625rem] font-semibold tabular-nums text-white">
          {order.totalLabel}
        </p>
      </div>

      <ul className="mt-4 flex flex-col gap-1 border-t border-line-dark pt-3">
        {order.items.map((item) => (
          <li
            key={item.name}
            className="flex items-baseline justify-between gap-4 text-[0.8125rem]"
          >
            <span className="text-white/75">
              <span className="tabular-nums text-white/50">
                {item.quantity} ×
              </span>{' '}
              {item.name}
            </span>
            <span className="tabular-nums text-white/55">
              {item.lineTotalLabel}
            </span>
          </li>
        ))}
      </ul>

      {order.notes && (
        <p className="mt-3 rounded-panel bg-white/[0.04] px-3 py-2 text-[0.75rem] leading-relaxed text-white/60">
          {order.notes}
        </p>
      )}

      <div className="mt-4 flex flex-wrap gap-1.5">
        {OrderStatus.values
          .filter((value) => value !== status)
          .map((value) => (
            <button
              key={value}
              type="button"
              disabled={working}
              onClick={() => void setStatus(value)}
              className="h-8 rounded-panel border border-line-dark px-2.5 text-[0.75rem] font-medium text-white/60 transition-colors duration-[--duration-feedback] hover:bg-white/10 hover:text-white disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              Mark {statusLabels[value].toLowerCase()}
            </button>
          ))}
      </div>
    </li>
  );
}
