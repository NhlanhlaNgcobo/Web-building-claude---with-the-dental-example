import Link from 'next/link';
import { StatusPill } from '@/components/admin/StatusPill';
import { OrderFilters } from '@/components/admin/OrderFilters';
import { requireStaffPage } from '@/lib/admin/auth';
import { listOrders } from '@/lib/admin/queries';
import { formatPrice } from '@/lib/currency';
import { FULFILMENT_LABELS, OrderStatus } from '@/lib/domain/enums';
import type { FulfilmentMethod } from '@/types';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Orders' };

export default async function AdminOrdersPage({
  searchParams,
}: PageProps<'/admin/orders'>) {
  await requireStaffPage('/admin/orders');

  const params = await searchParams;
  const rawStatus = typeof params.status === 'string' ? params.status : '';
  // Validated against the known list rather than cast, so a hand-edited URL
  // cannot reach the query with a status that does not exist.
  const status = OrderStatus.values.find((s) => s === rawStatus);
  const query = typeof params.q === 'string' ? params.q : '';

  const orders = await listOrders({ status, query, take: 100 });

  return (
    <div className="container-page py-8">
      <h1 className="text-display text-[1.75rem] text-ink">Orders</h1>

      <div className="mt-6">
        <OrderFilters resultCount={orders.length} />
      </div>

      {orders.length === 0 ? (
        <p className="mt-6 rounded-card border border-line bg-white px-5 py-10 text-center text-[0.9375rem] text-grey-strong">
          Nothing matches that. Clear the filters to see everything.
        </p>
      ) : (
        <div className="mt-6 overflow-hidden rounded-card border border-line bg-white">
          <div className="scroll-x">
            <table className="w-full min-w-[56rem] text-left text-[0.875rem]">
              <caption className="sr-only">
                Orders, most recently placed first
              </caption>
              <thead>
                <tr className="border-b border-line text-[0.6875rem] uppercase text-grey-strong">
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Reference
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Placed
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Customer
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Status
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Going out as
                  </th>
                  <th scope="col" className="px-4 py-3 text-right font-semibold">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className="border-b border-line last:border-0">
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/orders/${order.reference}`}
                        className="text-spec font-medium text-ink underline decoration-red decoration-2 underline-offset-4 hover:text-red focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red"
                      >
                        {order.reference}
                      </Link>
                    </td>
                    <td className="px-4 py-3 tabular-nums text-grey-strong">
                      {new Date(order.placedAt).toLocaleDateString('en-ZA', {
                        day: '2-digit',
                        month: 'short',
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <span className="block text-ink">{order.customerName}</span>
                      <span className="block text-[0.75rem] text-grey">
                        {order.customerEmail}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <StatusPill status={order.status} />
                    </td>
                    <td className="px-4 py-3 text-grey-strong">
                      {FULFILMENT_LABELS[order.fulfilment as FulfilmentMethod]}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold tabular-nums text-ink">
                      {formatPrice(order.totalCents)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
