import Link from 'next/link';
import {
  AlertTriangle,
  ArrowRight,
  Banknote,
  Boxes,
  PackageCheck,
  Receipt,
  Recycle,
} from 'lucide-react';
import { requireStaffPage } from '@/lib/admin/auth';
import { getAdminMetrics, listOrders } from '@/lib/admin/queries';
import { formatPrice } from '@/lib/currency';
import { cn } from '@/lib/cn';
import { StatusPill } from '@/components/admin/StatusPill';

/** Staff screens are never cached. A stale order list is worse than a slow one. */
export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
  await requireStaffPage('/admin');

  const [metrics, recent] = await Promise.all([
    getAdminMetrics(),
    listOrders({ take: 8 }),
  ]);

  const needsAttention =
    metrics.awaitingPayment > 0 ||
    metrics.toPrepare > 0 ||
    metrics.tradeInsWaiting > 0 ||
    metrics.outOfStockCount > 0;

  return (
    <div className="container-page py-8">
      <h1 className="text-display text-[1.75rem] text-ink">Today</h1>

      {/* The numbers that change what somebody does next, first. */}
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Metric
          icon={Receipt}
          label="Orders today"
          value={String(metrics.ordersToday)}
          href="/admin/orders"
        />
        <Metric
          icon={Banknote}
          label="Awaiting payment"
          value={String(metrics.awaitingPayment)}
          href="/admin/orders?status=pending_payment"
          urgent={metrics.awaitingPayment > 0}
        />
        <Metric
          icon={PackageCheck}
          label="To prepare"
          value={String(metrics.toPrepare)}
          href="/admin/orders?status=paid"
          urgent={metrics.toPrepare > 0}
        />
        <Metric
          icon={Banknote}
          label="Paid this month"
          value={formatPrice(metrics.revenueThisMonthCents)}
        />
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <Metric
          icon={Boxes}
          label="Low stock"
          value={String(metrics.lowStockCount)}
          href="/admin/stock?low=1"
          urgent={metrics.lowStockCount > 0}
        />
        <Metric
          icon={AlertTriangle}
          label="Out of stock"
          value={String(metrics.outOfStockCount)}
          href="/admin/stock?low=1"
        />
        <Metric
          icon={Recycle}
          label="Trade ins waiting"
          value={String(metrics.tradeInsWaiting)}
          href="/admin/trade-ins"
          urgent={metrics.tradeInsWaiting > 0}
        />
      </div>

      {!needsAttention && (
        <p className="mt-6 rounded-card border border-line bg-white px-5 py-4 text-[0.9375rem] text-ink">
          Nothing is waiting on you. Every order is either complete or with the
          courier, and no shelf is empty.
        </p>
      )}

      {/* ---------------- Recent orders ---------------- */}
      <section aria-labelledby="recent-heading" className="mt-10">
        <div className="flex items-end justify-between gap-4">
          <h2 id="recent-heading" className="text-[1.125rem] font-bold text-ink">
            Latest orders
          </h2>
          <Link
            href="/admin/orders"
            className="inline-flex items-center gap-1.5 rounded-panel text-[0.8125rem] font-semibold text-red hover:text-red-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red"
          >
            All orders
            <ArrowRight className="size-3.5" aria-hidden="true" />
          </Link>
        </div>

        {recent.length === 0 ? (
          <p className="mt-4 rounded-card border border-line bg-white px-5 py-8 text-center text-[0.9375rem] text-grey-strong">
            No orders yet. They will appear here the moment one is placed.
          </p>
        ) : (
          <div className="mt-4 overflow-hidden rounded-card border border-line bg-white">
            <div className="scroll-x">
              <table className="w-full min-w-[44rem] text-left text-[0.875rem]">
                <caption className="sr-only">
                  The eight most recent orders
                </caption>
                <thead>
                  <tr className="border-b border-line text-[0.6875rem] uppercase text-grey-strong">
                    <th scope="col" className="px-4 py-3 font-semibold">
                      Reference
                    </th>
                    <th scope="col" className="px-4 py-3 font-semibold">
                      Customer
                    </th>
                    <th scope="col" className="px-4 py-3 font-semibold">
                      Status
                    </th>
                    <th scope="col" className="px-4 py-3 font-semibold">
                      Items
                    </th>
                    <th scope="col" className="px-4 py-3 text-right font-semibold">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((order) => (
                    <tr
                      key={order.id}
                      className="border-b border-line last:border-0"
                    >
                      <td className="px-4 py-3">
                        <Link
                          href={`/admin/orders/${order.reference}`}
                          className="text-spec font-medium text-ink underline decoration-red decoration-2 underline-offset-4 hover:text-red focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red"
                        >
                          {order.reference}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-ink">{order.customerName}</td>
                      <td className="px-4 py-3">
                        <StatusPill status={order.status} />
                      </td>
                      <td className="px-4 py-3 tabular-nums text-grey-strong">
                        {order.itemCount}
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
      </section>
    </div>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
  href,
  urgent = false,
}: {
  readonly icon: React.ComponentType<{ className?: string }>;
  readonly label: string;
  readonly value: string;
  readonly href?: string;
  readonly urgent?: boolean;
}) {
  const body = (
    <>
      <div className="flex items-center gap-2">
        <Icon
          className={cn('size-4', urgent ? 'text-red' : 'text-grey')}
          aria-hidden="true"
        />
        <span className="text-[0.75rem] font-medium text-grey-strong">
          {label}
        </span>
      </div>
      <p className="mt-2 text-[1.5rem] font-bold tabular-nums text-ink">
        {value}
      </p>
    </>
  );

  const className = cn(
    'block rounded-card border bg-white p-4',
    'transition-[border-color] duration-[--duration-feedback]',
    urgent ? 'border-red/30' : 'border-line',
    href &&
      'hover:border-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red',
  );

  return href ? (
    <Link href={href} className={className}>
      {body}
    </Link>
  ) : (
    <div className={className}>{body}</div>
  );
}
