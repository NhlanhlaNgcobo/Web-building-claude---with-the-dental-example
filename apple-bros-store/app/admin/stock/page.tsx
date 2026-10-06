import Link from 'next/link';
import { StockAdjuster } from '@/components/admin/StockAdjuster';
import { requireStaffPage } from '@/lib/admin/auth';
import { listStock } from '@/lib/admin/queries';
import { formatPrice } from '@/lib/currency';
import { stockLabel, stockState } from '@/lib/orders/stock';
import { cn } from '@/lib/cn';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Stock' };

export default async function AdminStockPage({
  searchParams,
}: PageProps<'/admin/stock'>) {
  await requireStaffPage('/admin/stock');

  const params = await searchParams;
  const lowOnly = params.low === '1';
  const query = typeof params.q === 'string' ? params.q : '';

  const rows = await listStock({ lowOnly, query });

  return (
    <div className="container-page py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-display text-[1.75rem] text-ink">Stock</h1>
          <p className="mt-1 text-[0.875rem] text-grey-strong">
            Shelf quantity, and how much of it is already committed to orders
            that have not gone out.
          </p>
        </div>

        <div className="flex gap-2">
          <Link
            href="/admin/stock"
            className={cn(
              'h-9 rounded-panel border px-3 text-[0.8125rem] font-medium leading-9',
              'transition-colors duration-[--duration-feedback]',
              'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red',
              lowOnly
                ? 'border-line-strong bg-white text-grey-strong hover:border-ink'
                : 'border-ink bg-ink text-white',
            )}
          >
            Everything
          </Link>
          <Link
            href="/admin/stock?low=1"
            className={cn(
              'h-9 rounded-panel border px-3 text-[0.8125rem] font-medium leading-9',
              'transition-colors duration-[--duration-feedback]',
              'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red',
              lowOnly
                ? 'border-ink bg-ink text-white'
                : 'border-line-strong bg-white text-grey-strong hover:border-ink',
            )}
          >
            Running low
          </Link>
        </div>
      </div>

      {rows.length === 0 ? (
        <p className="mt-6 rounded-card border border-line bg-white px-5 py-10 text-center text-[0.9375rem] text-grey-strong">
          {lowOnly
            ? 'Nothing is running low. Every shelf has more than a couple on it.'
            : 'No variants match that search.'}
        </p>
      ) : (
        <div className="mt-6 overflow-hidden rounded-card border border-line bg-white">
          <div className="scroll-x">
            <table className="w-full min-w-[52rem] text-left text-[0.875rem]">
              <caption className="sr-only">
                Stock levels, emptiest shelves first
              </caption>
              <thead>
                <tr className="border-b border-line text-[0.6875rem] uppercase text-grey-strong">
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Item
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    SKU
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Price
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    On the shelf
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Committed
                  </th>
                  <th scope="col" className="px-4 py-3 text-right font-semibold">
                    <span className="sr-only">Adjust</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const state = stockState(row.stockQuantity, row.isActive);
                  return (
                    <tr
                      key={row.variantId}
                      className="border-b border-line last:border-0"
                    >
                      <td className="px-4 py-3">
                        <Link
                          href={`/product/${row.productSlug}`}
                          className="block font-medium text-ink underline decoration-red decoration-2 underline-offset-4 hover:text-red focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red"
                        >
                          {row.productName}
                        </Link>
                        <span className="block text-[0.75rem] text-grey-strong">
                          {row.variantLabel}
                          {!row.isActive && ' (not listed)'}
                        </span>
                      </td>
                      <td className="text-spec px-4 py-3 text-[0.75rem] text-grey-strong">
                        {row.sku}
                      </td>
                      <td className="px-4 py-3 tabular-nums text-ink">
                        {formatPrice(row.priceCents)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            'font-semibold tabular-nums',
                            state === 'out'
                              ? 'text-red-deep'
                              : state === 'low' || state === 'last_one'
                                ? 'text-caution'
                                : 'text-ink',
                          )}
                        >
                          {row.stockQuantity}
                        </span>
                        <span className="ml-2 text-[0.75rem] text-grey-strong">
                          {stockLabel(row.stockQuantity, row.isActive)}
                        </span>
                      </td>
                      <td className="px-4 py-3 tabular-nums text-grey-strong">
                        {row.committed}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <StockAdjuster
                          variantId={row.variantId}
                          label={`${row.productName}, ${row.variantLabel}`}
                          current={row.stockQuantity}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
