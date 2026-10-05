import type { Metadata } from 'next';
import { Package, PackageOpen } from 'lucide-react';
import { OrderRow } from '@/components/admin/OrderRow';
import { requireStaffPage } from '@/lib/admin/auth';
import { getOrders } from '@/lib/admin/queries';
import { formatPrice } from '@/lib/currency';
import { formatLocalDateShort, todayLocalDate } from '@/lib/availability/tz';

export const metadata: Metadata = { title: 'Orders' };
export const dynamic = 'force-dynamic';

/**
 * Product orders.
 *
 * Collection only, paid at reception, so this is a preparation list rather
 * than a fulfilment pipeline. Orders attached to an appointment are flagged
 * with the date, because those need to be ready by then.
 */
export default async function OrdersPage() {
  await requireStaffPage('/admin/orders');

  const orders = await getOrders(50);
  const pending = orders.filter((order) => order.status === 'pending').length;

  return (
    <div className="mx-auto max-w-[80rem] px-4 py-8 sm:px-6">
      <h1 className="text-[1.5rem] font-semibold text-white">Product orders</h1>
      <p className="mt-1.5 text-sm text-white/55">
        <span className="tabular-nums">{pending}</span>{' '}
        {pending === 1 ? 'order' : 'orders'} to prepare. Everything is collected
        at reception and paid for on collection.
      </p>

      {orders.length === 0 ? (
        <div className="mt-8 flex flex-col items-center gap-3 rounded-card border border-line-dark bg-white/[0.03] px-6 py-14 text-center">
          <span className="flex size-11 items-center justify-center rounded-full bg-white/8 text-white/50">
            <PackageOpen className="size-5" aria-hidden="true" />
          </span>
          <p className="text-sm font-medium text-white">No orders yet</p>
          <p className="max-w-sm text-sm text-white/55">
            Orders placed through the shop appear here straight away, with
            whatever the patient asked us to put aside.
          </p>
        </div>
      ) : (
        <ul className="mt-8 flex flex-col gap-3">
          {orders.map((order) => (
            <OrderRow
              key={order.id}
              order={{
                id: order.id,
                reference: order.reference,
                status: order.status,
                fulfilment: order.fulfilment,
                contactName: order.contactName,
                contactMobile: order.contactMobile,
                contactEmail: order.contactEmail,
                totalLabel: formatPrice(order.totalCents),
                placedLabel: formatLocalDateShort(
                  todayLocalDate(order.createdAt),
                ),
                notes: order.notes,
                items: order.items.map((item) => ({
                  name: item.nameSnapshot,
                  quantity: item.quantity,
                  lineTotalLabel: formatPrice(item.lineTotalCents),
                })),
                appointment: order.appointment
                  ? {
                      reference: order.appointment.reference,
                      dateLabel: formatLocalDateShort(
                        todayLocalDate(order.appointment.startTime),
                      ),
                    }
                  : null,
              }}
            />
          ))}
        </ul>
      )}

      <p className="mt-8 flex items-start gap-2.5 text-[0.8125rem] leading-relaxed text-white/40">
        <Package className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        Showing the fifty most recent orders.
      </p>
    </div>
  );
}
