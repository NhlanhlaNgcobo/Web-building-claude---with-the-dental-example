import { requireStaffPage } from '@/lib/admin/auth';
import { listTradeIns } from '@/lib/admin/queries';
import { formatPrice } from '@/lib/currency';
import {
  TRADE_IN_CONDITION_LABELS,
  TRADE_IN_STATUS_LABELS,
  type TradeInCondition,
  type TradeInStatus,
} from '@/lib/domain/enums';
import { cn } from '@/lib/cn';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Trade ins' };

export default async function AdminTradeInsPage() {
  await requireStaffPage('/admin/trade-ins');

  const quotes = await listTradeIns(100);

  return (
    <div className="container-page py-8">
      <h1 className="text-display text-[1.75rem] text-ink">Trade ins</h1>
      <p className="mt-1 text-[0.875rem] text-grey-strong">
        Quotes customers have asked us to hold. Each one stands until its expiry
        date, against the published rules.
      </p>

      {quotes.length === 0 ? (
        <p className="mt-6 rounded-card border border-line bg-white px-5 py-10 text-center text-[0.9375rem] text-grey-strong">
          No trade in quotes yet.
        </p>
      ) : (
        <div className="mt-6 overflow-hidden rounded-card border border-line bg-white">
          <div className="scroll-x">
            <table className="w-full min-w-[56rem] text-left text-[0.875rem]">
              <caption className="sr-only">Trade in quotes, newest first</caption>
              <thead>
                <tr className="border-b border-line text-[0.6875rem] uppercase text-grey-strong">
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Reference
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Device
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    As described
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Customer
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Status
                  </th>
                  <th scope="col" className="px-4 py-3 text-right font-semibold">
                    Quoted
                  </th>
                </tr>
              </thead>
              <tbody>
                {quotes.map((quote) => {
                  const expired = quote.hasLapsed;
                  return (
                    <tr
                      key={quote.id}
                      className="border-b border-line last:border-0"
                    >
                      <td className="text-spec px-4 py-3 text-ink">
                        {quote.reference}
                      </td>
                      <td className="px-4 py-3">
                        <span className="block font-medium text-ink">
                          {quote.deviceLabel}
                        </span>
                        {quote.storageGb && (
                          <span className="block text-[0.75rem] text-grey-strong">
                            {quote.storageGb} GB
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-grey-strong">
                        <span className="block">
                          {
                            TRADE_IN_CONDITION_LABELS[
                              quote.condition as TradeInCondition
                            ]
                          }
                        </span>
                        <span className="block text-[0.75rem]">
                          {quote.powersOn ? 'Powers on' : 'Does not power on'}
                          {quote.isUnlocked ? ', unlocked' : ', network locked'}
                          {quote.batteryHealth !== null
                            ? `, battery ${quote.batteryHealth}%`
                            : ''}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="block text-ink">
                          {quote.customerName}
                        </span>
                        <a
                          href={`mailto:${quote.customerEmail}`}
                          className="block text-[0.75rem] text-grey-strong underline decoration-red decoration-2 underline-offset-2 hover:text-ink"
                        >
                          {quote.customerEmail}
                        </a>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            'inline-block whitespace-nowrap rounded-panel px-2 py-1 text-[0.75rem] font-semibold',
                            expired
                              ? 'bg-canvas-deep text-grey-strong'
                              : quote.status === 'quoted'
                                ? 'bg-red-soft text-red-deep'
                                : 'bg-leaf-soft text-leaf-deep',
                          )}
                        >
                          {expired
                            ? 'Expired'
                            : TRADE_IN_STATUS_LABELS[
                                quote.status as TradeInStatus
                              ]}
                        </span>
                        <span className="mt-1 block text-[0.75rem] text-grey-strong">
                          {expired ? 'Lapsed ' : 'Valid until '}
                          {quote.expiresAt.toLocaleDateString('en-ZA', {
                            day: '2-digit',
                            month: 'short',
                          })}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="block font-semibold tabular-nums text-ink">
                          {formatPrice(quote.quotedCents)}
                        </span>
                        {quote.revisedCents !== null && (
                          <span className="block text-[0.75rem] tabular-nums text-grey-strong">
                            revised to {formatPrice(quote.revisedCents)}
                          </span>
                        )}
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
