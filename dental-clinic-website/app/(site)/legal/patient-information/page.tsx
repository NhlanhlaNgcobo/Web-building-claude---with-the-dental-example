import type { Metadata } from 'next';
import { LegalPage } from '@/components/layout/LegalPage';
import { LAST_UPDATED, patientInformationSections } from '@/data/legal';
import { pageMetadata } from '@/lib/seo';

export const metadata: Metadata = pageMetadata({
  title: "Patient information",
  description: "Practical information for patients of Harbour Dental Studio: first appointments, consent, records, fees and raising a concern.",
  path: '/legal/patient-information',
});

export default function Page() {
  return (
    <LegalPage
      title={"Patient information"}
      intro={"What to expect at your first appointment, how consent works, access to your records, and how to raise a concern."}
      updated={LAST_UPDATED}
      sections={patientInformationSections}
      current="/legal/patient-information"
    />
  );
}
