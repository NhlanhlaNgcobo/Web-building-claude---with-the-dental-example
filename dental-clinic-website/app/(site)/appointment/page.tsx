import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Phone } from 'lucide-react';
import { ManageAppointment } from '@/components/booking/ManageAppointment';
import { PageHero } from '@/components/layout/PageHero';
import { ButtonAnchor } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Primitives';
import { clinic } from '@/data/clinic';
import { pageMetadata } from '@/lib/seo';

/**
 * Manage an appointment.
 *
 * Not indexed: there is nothing here for a search engine, and the page exists
 * to serve someone who already holds a booking reference.
 */
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  ...pageMetadata({
    title: 'Manage your appointment',
    description:
      'View, move or cancel your appointment at Harbour Dental Studio using your booking reference.',
    path: '/appointment',
    noIndex: true,
  }),
};

export default async function AppointmentPage({
  searchParams,
}: PageProps<'/appointment'>) {
  const query = await searchParams;
  const reference =
    typeof query.reference === 'string' ? query.reference : '';

  return (
    <>
      <PageHero
        eyebrow="Appointments"
        title="Your appointment"
        lede="View what you have booked, move it to another time, or cancel it. You need your booking reference and the email address or mobile number you booked with."
        crumbs={[{ name: 'Your appointment', path: '/appointment' }]}
      />

      <div className="bg-white">
        <div className="container-page py-12 lg:py-16">
          <div className="mx-auto max-w-2xl">
            <Suspense fallback={<Skeleton className="h-96" />}>
              <ManageAppointment initialReference={reference} />
            </Suspense>

            <div className="mt-8 rounded-card border border-line bg-canvas p-5">
              <h2 className="text-[0.9375rem] font-semibold text-ink">
                Need to change something we cannot do here?
              </h2>
              <p className="mt-1.5 text-sm leading-relaxed text-grey-strong">
                Changing dentist, booking a longer appointment, or moving
                something inside the{' '}
                {clinic.cancellationNoticeHours} hour notice window all need a
                quick word with reception.
              </p>
              <ButtonAnchor
                href={`tel:${clinic.telephone.e164}`}
                variant="secondary"
                className="mt-4"
              >
                <Phone className="size-4" aria-hidden="true" />
                {clinic.telephone.display}
              </ButtonAnchor>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
