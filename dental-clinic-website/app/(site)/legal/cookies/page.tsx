import type { Metadata } from 'next';
import { LegalPage } from '@/components/layout/LegalPage';
import { LAST_UPDATED, cookieSections } from '@/data/legal';
import { pageMetadata } from '@/lib/seo';

export const metadata: Metadata = pageMetadata({
  title: "Cookie policy",
  description: "What the Harbour Dental Studio website stores in your browser. No advertising cookies and no third-party tracking.",
  path: '/legal/cookies',
});

export default function Page() {
  return (
    <LegalPage
      title={"Cookies"}
      intro={"What this website stores in your browser, which is very little, and how to clear it."}
      updated={LAST_UPDATED}
      sections={cookieSections}
      current="/legal/cookies"
    />
  );
}
