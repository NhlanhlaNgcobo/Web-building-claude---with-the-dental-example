import type { Metadata } from 'next';
import { LegalPage } from '@/components/layout/LegalPage';
import { LAST_UPDATED, cancellationSections } from '@/data/legal';
import { pageMetadata } from '@/lib/seo';

export const metadata: Metadata = pageMetadata({
  title: "Cancellation policy",
  description: "Cancellation and rescheduling policy for appointments at Harbour Dental Studio, including how deposits are handled.",
  path: '/legal/cancellation',
});

export default function Page() {
  return (
    <LegalPage
      title={"Cancellation policy"}
      intro={"The notice we ask for, what happens to a deposit, and what we do if we have to change your appointment."}
      updated={LAST_UPDATED}
      sections={cancellationSections}
      current="/legal/cancellation"
    />
  );
}
