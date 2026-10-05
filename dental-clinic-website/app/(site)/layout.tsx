import { Nav } from '@/components/layout/Nav';
import { Footer } from '@/components/layout/Footer';
import { MobileActionBar } from '@/components/layout/MobileActionBar';
import { BasketProvider } from '@/hooks/useBasket';

/**
 * The public site shell.
 *
 * Everything patient-facing sits inside this route group so that the staff
 * diary at /admin can have its own chrome without inheriting the marketing
 * navigation or the mobile conversion bar.
 */
export default function SiteLayout({ children }: LayoutProps<'/'>) {
  return (
    <BasketProvider>
      <Nav />
      <main id="main">{children}</main>
      <Footer />
      <MobileActionBar />
    </BasketProvider>
  );
}
