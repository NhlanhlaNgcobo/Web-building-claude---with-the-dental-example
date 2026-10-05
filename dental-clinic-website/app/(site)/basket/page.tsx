import type { Metadata } from 'next';
import { BasketPanel } from '@/components/shop/BasketPanel';
import { PageHero } from '@/components/layout/PageHero';
import { pageMetadata } from '@/lib/seo';

export const metadata: Metadata = pageMetadata({
  title: 'Your basket',
  description:
    'Review the dental products you have chosen and reserve them for collection at the practice.',
  path: '/basket',
  noIndex: true,
});

export default function BasketPage() {
  return (
    <>
      <PageHero
        eyebrow="Shop"
        title="Your basket"
        lede="Reserve what you need and pay when you collect. If you have an appointment booked, we can have it ready for you then."
        crumbs={[
          { name: 'Shop', path: '/shop' },
          { name: 'Basket', path: '/basket' },
        ]}
      />

      <div className="bg-white">
        <div className="container-page py-12 lg:py-16">
          <BasketPanel />
        </div>
      </div>
    </>
  );
}
