import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, SearchX } from 'lucide-react';
import { ConfirmationCard } from '@/components/booking/ConfirmationCard';
import { PageHero } from '@/components/layout/PageHero';
import { ProductCard } from '@/components/shop/ProductCard';
import { ButtonLink } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/Primitives';
import { normalizeReference } from '@/lib/booking/reference';
import {
  getBookingByToken,
  serviceIdForReference,
} from '@/lib/booking/service';
import { prisma } from '@/lib/db';
import {
  preparationNotesFor,
  recommendationsForAppointment,
} from '@/lib/recommendations';

/**
 * Booking confirmation.
 *
 * Reached only with a valid management token, and excluded from search
 * indexing because it describes one person's appointment.
 */
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Booking confirmed',
  robots: { index: false, follow: false },
};

export default async function ConfirmedPage({
  params,
  searchParams,
}: PageProps<'/book/confirmed/[reference]'>) {
  const { reference } = await params;
  const query = await searchParams;
  const token = typeof query.token === 'string' ? query.token : '';

  const booking = await getBookingByToken(reference, token);

  if (!booking) {
    return (
      <>
        <PageHero
          eyebrow="Appointments"
          title="We could not open that booking"
          lede="The link may have expired. Confirmation links are deliberately short lived, so looking the appointment up again is the quickest way in."
        />
        <div className="bg-white">
          <div className="container-prose py-12 lg:py-16">
            <EmptyState
              icon={<SearchX className="size-5" aria-hidden="true" />}
              title="This link has expired"
              description="Use your booking reference together with the email address or mobile number you booked with."
              action={
                <ButtonLink
                  href={`/appointment?reference=${normalizeReference(reference)}`}
                >
                  Find my appointment
                  <ArrowRight className="size-4" aria-hidden="true" />
                </ButtonLink>
              }
            />
          </div>
        </div>
      </>
    );
  }

  // Relevant products only, and none at all for an urgent appointment.
  const serviceId = await serviceIdForReference(reference);
  const [recommendations, service] = await Promise.all([
    serviceId ? recommendationsForAppointment(serviceId) : Promise.resolve([]),
    serviceId
      ? prisma.service.findUnique({
          where: { id: serviceId },
          select: { slug: true },
        })
      : Promise.resolve(null),
  ]);

  const notes = preparationNotesFor(service?.slug ?? '');

  return (
    <div className="bg-canvas pt-16 lg:pt-[4.5rem]">
      <div className="container-page py-12 lg:py-16">
        <div className="mx-auto max-w-2xl">
          <ConfirmationCard booking={booking} preparationNotes={notes} />

          {recommendations.length > 0 && (
            <section className="mt-12" aria-labelledby="recommended-heading">
              <h2
                id="recommended-heading"
                className="text-[1.0625rem] font-semibold text-ink"
              >
                {booking.serviceName.toLowerCase().includes('whitening')
                  ? 'Often paired with this appointment'
                  : 'Complete your oral care routine'}
              </h2>
              <p className="mt-1 text-sm text-grey-strong">
                Entirely optional, and collectable at your appointment.
              </p>
              <ul className="mt-5 grid gap-4 sm:grid-cols-2">
                {recommendations.map((product) => (
                  <li key={product.id}>
                    <ProductCard product={product} />
                  </li>
                ))}
              </ul>
              <Link
                href="/shop"
                className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-blue underline decoration-blue/30 underline-offset-2 hover:decoration-blue"
              >
                See everything we stock
                <ArrowRight className="size-3.5" aria-hidden="true" />
              </Link>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
