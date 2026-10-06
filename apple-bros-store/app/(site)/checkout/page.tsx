import type { Metadata } from 'next';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { CheckoutForm } from '@/components/shop/CheckoutForm';
import { pageMetadata } from '@/lib/seo';
import { availablePaymentMethods } from '@/lib/providers/payment';

export const metadata: Metadata = pageMetadata({
  title: 'Checkout',
  description: 'Complete your order.',
  path: '/checkout',
  noIndex: true,
});

/**
 * Which payment methods exist is a server question, because it depends on what
 * is configured in the environment. Resolving it here means the browser is
 * never handed a method it cannot complete, and no provider configuration
 * reaches the client bundle.
 */
export const dynamic = 'force-dynamic';

export default function CheckoutPage() {
  return (
    <div className="bg-white pt-16 lg:pt-[4.5rem]">
      <div className="container-page py-8 lg:py-10">
        <Breadcrumbs
          items={[
            { name: 'Home', path: '/' },
            { name: 'Basket', path: '/basket' },
            { name: 'Checkout', path: '/checkout' },
          ]}
        />
        <h1 className="text-display mt-5 text-[2rem] text-ink sm:text-[2.25rem]">
          Checkout
        </h1>
      </div>

      <div className="container-page pb-20">
        <CheckoutForm paymentMethods={availablePaymentMethods()} />
      </div>
    </div>
  );
}
