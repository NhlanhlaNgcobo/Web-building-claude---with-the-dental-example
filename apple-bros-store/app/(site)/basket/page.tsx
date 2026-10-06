import type { Metadata } from 'next';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { BasketView } from '@/components/shop/BasketView';
import { pageMetadata } from '@/lib/seo';

export const metadata: Metadata = pageMetadata({
  title: 'Your basket',
  description: 'Review what you are buying before you check out.',
  path: '/basket',
  // A basket is personal and has nothing to rank for.
  noIndex: true,
});

export default function BasketPage() {
  return (
    <div className="bg-white pt-16 lg:pt-[4.5rem]">
      <div className="container-page py-8 lg:py-12">
        <Breadcrumbs
          items={[
            { name: 'Home', path: '/' },
            { name: 'Basket', path: '/basket' },
          ]}
        />
        <h1 className="text-display mt-5 text-[2rem] text-ink sm:text-[2.25rem]">
          Your basket
        </h1>
      </div>

      <div className="container-page pb-20">
        <BasketView />
      </div>
    </div>
  );
}
