import type { Metadata } from 'next';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { OrderLookup } from '@/components/shop/OrderLookup';
import { pageMetadata } from '@/lib/seo';

export const metadata: Metadata = pageMetadata({
  title: 'Track your order',
  description:
    'Enter your reference and the email you ordered with to see where your order is.',
  path: '/order',
  // An order is personal. There is nothing here to index and nothing a search
  // result could usefully show.
  noIndex: true,
});

export default function OrderPage() {
  return (
    <div className="bg-white pt-16 lg:pt-[4.5rem]">
      <div className="container-page py-8 lg:py-12">
        <Breadcrumbs
          items={[
            { name: 'Home', path: '/' },
            { name: 'Track your order', path: '/order' },
          ]}
        />
        <h1 className="text-display mt-5 text-[2rem] text-ink sm:text-[2.25rem]">
          Track your order
        </h1>
        <p className="mt-4 max-w-2xl text-pretty text-[1.0625rem] leading-relaxed text-grey-strong">
          Your reference and the email you ordered with. We do not make you
          create an account to see your own order.
        </p>
      </div>

      <div className="container-page pb-20">
        <OrderLookup />
      </div>
    </div>
  );
}
