import type { Metadata } from 'next';
import { LegalPage } from '@/components/layout/LegalPage';
import { LAST_UPDATED, termsSections } from '@/data/legal';
import { pageMetadata } from '@/lib/seo';

export const metadata: Metadata = pageMetadata({
  title: "Terms of use",
  description: "Terms of use for the Harbour Dental Studio website, covering treatment information, published fees and online booking.",
  path: '/legal/terms',
});

export default function Page() {
  return (
    <LegalPage
      title={"Terms of use"}
      intro={"The terms that apply to using this website, including what the treatment information is and is not, and how online booking works."}
      updated={LAST_UPDATED}
      sections={termsSections}
      current="/legal/terms"
    />
  );
}
