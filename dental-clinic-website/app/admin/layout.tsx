import type { Metadata } from 'next';
import { AdminNav } from '@/components/admin/AdminNav';

/**
 * Staff area shell.
 *
 * Dark by default, which is the right call for a screen reception has open all
 * day, and visually related to the public site without being the same thing.
 * It sits outside the (site) route group so it inherits none of the marketing
 * navigation, the footer or the mobile conversion bar.
 *
 * Never indexed, never cached. The cache headers are also set in
 * next.config.ts, because a header is enforced where metadata is only a hint.
 */
export const metadata: Metadata = {
  title: {
    default: 'Practice diary',
    template: '%s | Practice diary',
  },
  robots: { index: false, follow: false, nocache: true },
};

export default function AdminLayout({ children }: LayoutProps<'/admin'>) {
  return (
    <div className="min-h-dvh bg-ink text-white">
      <AdminNav />
      <main id="main" className="pb-16">
        {children}
      </main>
    </div>
  );
}
