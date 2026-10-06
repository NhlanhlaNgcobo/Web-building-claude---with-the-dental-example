import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { OrderActions } from '@/components/admin/OrderActions';
import { StatusPill } from '@/components/admin/StatusPill';
import { requireStaffPage } from '@/lib/admin/auth';
import { getOrderDetail } from '@/lib/admin/queries';
import { normalizeReference } from '@/lib/orders/reference';
import { formatPrice } from '@/lib/currency';
import {
  FULFILMENT_LABELS,
  PAYMENT_METHOD_LABELS,
  STOCK_REASON_LABELS,
  type FulfilmentMethod,
  type OrderStatus,
  type PaymentMethod,
  type StockReason,
} from '@/lib/domain/enums';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: PageProps<'/admin/orders/[reference]'>) {
  const { reference } = await params;
  return { title: `Order ${reference}` };
}

export default async function AdminOrderPage({
  params,
}: PageProps<'/admin/orders/[reference]'>) {
  const { reference } = await params;
  await requireStaffPage(`/admin/orders/${reference}`);

  const order = await getOrderDetail(normalizeReference(reference));
  if (!order) notFound();

  const placed = order.placedAt.toLocaleString('en-ZA', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const address = [
    order.addressLine1,
    order.addressLine2,
    order.addressSuburb,
    order.addressCity && order.addressPostalCode
      ? `${order.addressCity}, ${order.addressPostalCode}`
      : order.addressCity,
    order.addressProvince,
  ].filter((line): line is string => Boolean(line));

  return (
    <div className="container-page py-8">
      <Link
        href="/admin/orders"
        className="inline-flex items-center gap-1.5 rounded-panel text-[0.8125rem] font-medium text-grey-strong transition-colors duration-[--duration-feedback] hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red"
      >
        <ArrowLeft className="size-3.5" aria-hidden="true" />
        All orders
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-spec text-[1.75rem] font-medium text-ink">
            {order.reference}
          </h1>
          <p className="mt-1 text-[0.875rem] text-grey-strong">Placed {placed}</p>
        </div>
        <StatusPill status={order.status as OrderStatus} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_20rem] lg:gap-8">
        <div className="flex flex-col gap-6">
          {/* ---------------- Items ---------------- */}
          <section
            aria-labelledby="items-heading"
            className="overflow-hidden rounded-card border border-line bg-white"
          >
            <h2
              id="items-heading"
              className="border-b border-line px-5 py-3.5 text-[0.9375rem] font-bold text-ink"
            >
              Items
            </h2>
            <div className="scroll-x">
              <table className="w-full min-w-[36rem] text-left text-[0.875rem]">
                <thead>
                  <tr className="border-b border-line text-[0.6875rem] uppercase text-grey-strong">
                    <th scope="col" className="px-5 py-2.5 font-semibold">
                      Item
                    </th>
                    <th scope="col" className="px-5 py-2.5 font-semibold">
                      SKU
                    </th>
                    <th scope="col" className="px-5 py-2.5 font-semibold">
                      Qty
                    </th>
                    <th scope="col" className="px-5 py-2.5 text-right font-semibold">
                      Line
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item) => (
                    <tr key={item.id} className="border-b border-line last:border-0">
                      <td className="px-5 py-3">
                        <span className="block font-medium text-ink">
                          {item.nameSnapshot}
                        </span>
                        <span className="block text-[0.75rem] text-grey-strong">
                          {item.variantSnapshot}, {item.warrantyMonths} month
                          warranty
                        </span>
                      </td>
                      <td className="text-spec px-5 py-3 text-[0.75rem] text-grey-strong">
                        {item.skuSnapshot}
                      </td>
                      <td className="px-5 py-3 tabular-nums text-ink">
                        {item.quantity}
                      </td>
                      <td className="px-5 py-3 text-right font-semibold tabular-nums text-ink">
                        {formatPrice(item.lineTotalCents)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* ---------------- Stock ledger ---------------- */}
          {order.movements.length > 0 && (
            <section
              aria-labelledby="ledger-heading"
              className="overflow-hidden rounded-card border border-line bg-white"
            >
              <h2
                id="ledger-heading"
                className="border-b border-line px-5 py-3.5 text-[0.9375rem] font-bold text-ink"
              >
                Stock movements
              </h2>
              <p className="border-b border-line px-5 py-2.5 text-[0.75rem] leading-relaxed text-grey-strong">
                Every change this order made to the shelf. Append only, so the
                history cannot be rewritten.
              </p>
              <ul className="divide-y divide-line">
                {order.movements.map((movement) => (
                  <li
                    key={movement.id}
                    className="flex items-center justify-between gap-4 px-5 py-3 text-[0.8125rem]"
                  >
                    <div>
                      <span className="font-medium text-ink">
                        {STOCK_REASON_LABELS[movement.reason as StockReason]}
                      </span>
                      <span className="ml-2 text-grey-strong">
                        {movement.createdAt.toLocaleString('en-ZA', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <span className="text-spec shrink-0 text-ink">
                      {movement.delta > 0 ? '+' : ''}
                      {movement.delta}
                      <span className="ml-2 text-grey-strong">
                        leaving {movement.resulting}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {order.customerNote && (
            <section className="rounded-card border border-line bg-white p-5">
              <h2 className="text-[0.9375rem] font-bold text-ink">
                What the customer said
              </h2>
              <p className="mt-2 text-pretty text-[0.875rem] leading-relaxed text-grey-strong">
                {order.customerNote}
              </p>
            </section>
          )}
        </div>

        {/* ---------------- Side ---------------- */}
        <aside className="flex flex-col gap-4">
          <section className="rounded-card border border-line bg-white p-5">
            <h2 className="text-[0.9375rem] font-bold text-ink">Next step</h2>
            <div className="mt-4">
              <OrderActions
                reference={order.reference}
                status={order.status as OrderStatus}
              />
            </div>
          </section>

          <section className="rounded-card border border-line bg-white p-5">
            <h2 className="text-[0.6875rem] font-semibold uppercase text-grey-strong">
              Customer
            </h2>
            <p className="mt-2 text-[0.9375rem] font-medium text-ink">
              {order.customerName}
            </p>
            <a
              href={`mailto:${order.customerEmail}`}
              className="mt-1 block text-[0.8125rem] text-grey-strong underline decoration-red decoration-2 underline-offset-2 hover:text-ink"
            >
              {order.customerEmail}
            </a>
            <a
              href={`tel:${order.customerMobile}`}
              className="mt-0.5 block text-[0.8125rem] text-grey-strong underline decoration-red decoration-2 underline-offset-2 hover:text-ink"
            >
              {order.customerMobile}
            </a>
          </section>

          <section className="rounded-card border border-line bg-white p-5">
            <h2 className="text-[0.6875rem] font-semibold uppercase text-grey-strong">
              {FULFILMENT_LABELS[order.fulfilment as FulfilmentMethod]}
            </h2>
            {address.length > 0 ? (
              <address className="mt-2 not-italic text-[0.875rem] leading-relaxed text-ink">
                {address.map((line) => (
                  <span key={line}>
                    {line}
                    <br />
                  </span>
                ))}
              </address>
            ) : (
              <p className="mt-2 text-[0.875rem] text-grey-strong">
                Collecting from the counter.
              </p>
            )}
          </section>

          <section className="rounded-card border border-line bg-white p-5">
            <h2 className="text-[0.6875rem] font-semibold uppercase text-grey-strong">
              Money
            </h2>
            <dl className="mt-3 flex flex-col gap-2 text-[0.875rem]">
              <div className="flex justify-between gap-3">
                <dt className="text-grey-strong">Subtotal</dt>
                <dd className="tabular-nums text-ink">
                  {formatPrice(order.subtotalCents)}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-grey-strong">Delivery</dt>
                <dd className="tabular-nums text-ink">
                  {order.shippingCents === 0
                    ? 'Free'
                    : formatPrice(order.shippingCents)}
                </dd>
              </div>
              {order.tradeInCents > 0 && (
                <div className="flex justify-between gap-3">
                  <dt className="text-grey-strong">Trade in</dt>
                  <dd className="tabular-nums text-leaf">
                    Less {formatPrice(order.tradeInCents)}
                  </dd>
                </div>
              )}
              <div className="mt-1 flex justify-between gap-3 border-t border-line pt-2.5">
                <dt className="font-bold text-ink">Total</dt>
                <dd className="font-bold tabular-nums text-ink">
                  {formatPrice(order.totalCents)}
                </dd>
              </div>
            </dl>
            <p className="mt-3 text-[0.75rem] text-grey-strong">
              {PAYMENT_METHOD_LABELS[order.paymentMethod as PaymentMethod]}
              {order.paidAt
                ? `, paid ${order.paidAt.toLocaleDateString('en-ZA')}`
                : ', not yet paid'}
            </p>
            {order.tradeIn && (
              <p className="text-spec mt-2 text-[0.75rem] text-grey-strong">
                Trade in {order.tradeIn.reference}, {order.tradeIn.deviceLabel}
              </p>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}
