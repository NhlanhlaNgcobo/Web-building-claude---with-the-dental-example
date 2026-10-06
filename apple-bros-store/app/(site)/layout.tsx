import { Nav } from '@/components/layout/Nav';
import { Footer } from '@/components/layout/Footer';

/**
 * The public shop shell.
 *
 * Everything customer facing sits in this route group, so the staff screens
 * at /admin inherit none of the shop navigation.
 */
export default function SiteLayout({ children }: LayoutProps<'/'>) {
  return (
    <>
      <Nav />
      <main id="main">{children}</main>
      <Footer />
    </>
  );
}
