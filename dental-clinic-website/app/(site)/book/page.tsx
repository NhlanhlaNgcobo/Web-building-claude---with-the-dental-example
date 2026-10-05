import type { Metadata } from 'next';
import { Suspense } from 'react';
import { BookingWizard } from '@/components/booking/BookingWizard';
import { PageHero } from '@/components/layout/PageHero';
import { Skeleton } from '@/components/ui/Primitives';
import { getBookableServices, getDentists } from '@/lib/queries';
import { getProviders } from '@/lib/providers/registry';
import { pageMetadata } from '@/lib/seo';

/**
 * The booking page.
 *
 * Dynamic and never cached, because everything inside it is about current
 * availability. The wizard itself reads its state from the query string, which
 * is why this page is wrapped in Suspense: useSearchParams suspends during
 * prerendering.
 */
export const dynamic = 'force-dynamic';

export const metadata: Metadata = pageMetadata({
  title: 'Book an appointment',
  description:
    'Book a dental appointment in Durban from the live practice diary. Choose your treatment, your dentist and a time that suits you.',
  path: '/book',
});

export default async function BookPage() {
  const [services, dentists] = await Promise.all([
    getBookableServices(),
    getDentists(),
  ]);

  // Whether a card payment can be taken online right now. False with no
  // gateway configured, in which case the flow offers settlement at the
  // practice instead. The booking still completes either way.
  const { payment } = getProviders();

  return (
    <>
      <PageHero
        eyebrow="Appointments"
        title="Book an appointment"
        lede="Times come straight from the practice diary, so what you see is genuinely free. It takes about a minute."
        crumbs={[{ name: 'Book an appointment', path: '/book' }]}
      />

      <div className="bg-white">
        <div className="container-page py-12 lg:py-16">
          <Suspense fallback={<WizardSkeleton />}>
            <BookingWizard
              services={services}
              dentists={dentists}
              canTakePaymentOnline={payment.canTakePaymentOnline}
            />
          </Suspense>
        </div>
      </div>
    </>
  );
}

function WizardSkeleton() {
  return (
    <div role="status" aria-busy="true" aria-label="Loading the booking form">
      <div className="flex gap-3 border-b border-line pb-6">
        {Array.from({ length: 5 }, (_, i) => (
          <Skeleton key={i} className="h-6 w-20" />
        ))}
      </div>
      <div className="grid gap-3 pt-8 sm:grid-cols-2">
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
    </div>
  );
}
