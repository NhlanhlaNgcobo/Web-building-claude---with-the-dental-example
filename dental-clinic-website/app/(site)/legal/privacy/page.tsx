import type { Metadata } from 'next';
import { LegalPage } from '@/components/layout/LegalPage';
import { LAST_UPDATED, privacySections } from '@/data/legal';
import { pageMetadata } from '@/lib/seo';

export const metadata: Metadata = pageMetadata({
  title: "Privacy notice and POPIA",
  description: "How Harbour Dental Studio handles personal information, what is collected when you book online, and your rights under the Protection of Personal Information Act.",
  path: '/legal/privacy',
});

export default function Page() {
  return (
    <LegalPage
      title={"Privacy notice"}
      intro={"How this practice handles your personal information, what we collect when you book online, and the rights you have under POPIA."}
      updated={LAST_UPDATED}
      sections={privacySections}
      current="/legal/privacy"
    />
  );
}
