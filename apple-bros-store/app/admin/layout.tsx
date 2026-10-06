import type { Metadata } from 'next';
import { AdminNav } from '@/components/admin/AdminNav';

export const metadata: Metadata = {
  title: { default: 'Shop admin', template: '%s | Shop admin' },
  robots: { index: false, follow: false },
};

/**
 * The staff shell.
 *
 * Deliberately outside the (site) route group, so none of the customer
 * navigation, footer or basket state appears here. A staff screen and a
 * shopfront want different things from a layout.
 *
 * The login page renders its own full-page layout, so the nav here is rendered
 * by a component that hides itself on that route rather than by splitting this
 * into two layouts.
 */
export default function AdminLayout({ children }: LayoutProps<'/admin'>) {
  return (
    <div className="min-h-dvh bg-canvas">
      <AdminNav />
      <main id="main" className="pb-16">
        {children}
      </main>
    </div>
  );
}
