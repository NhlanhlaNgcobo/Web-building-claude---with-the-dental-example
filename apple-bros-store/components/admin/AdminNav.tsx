'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LogOut, Boxes, LayoutDashboard, Receipt, Recycle } from 'lucide-react';
import { Logo } from '@/components/brand/Logo';
import { cn } from '@/lib/cn';

const links = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/admin/orders', label: 'Orders', icon: Receipt, exact: false },
  { href: '/admin/stock', label: 'Stock', icon: Boxes, exact: false },
  { href: '/admin/trade-ins', label: 'Trade ins', icon: Recycle, exact: false },
];

/**
 * Staff navigation.
 *
 * Hides itself on the login page, which renders its own centred layout. Doing
 * it here rather than with a second layout file keeps the staff area to one
 * shell with one place to add a link.
 */
export function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();

  if (pathname === '/admin/login') return null;

  async function signOut() {
    await fetch('/api/admin/session', { method: 'DELETE' });
    router.replace('/admin/login');
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-nav border-b border-line bg-white">
      <div className="container-page flex h-16 items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <Link
            href="/admin"
            className="rounded-panel focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red"
          >
            <Logo compact className="lg:hidden" />
            <Logo className="hidden lg:flex" />
          </Link>

          <nav aria-label="Staff">
            <ul className="scroll-x flex items-center gap-1">
              {links.map((link) => {
                const Icon = link.icon;
                const active = link.exact
                  ? pathname === link.href
                  : pathname.startsWith(link.href);
                return (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      aria-current={active ? 'page' : undefined}
                      className={cn(
                        'inline-flex h-9 items-center gap-2 whitespace-nowrap rounded-panel px-3',
                        'text-[0.875rem] font-medium',
                        'transition-colors duration-[--duration-feedback]',
                        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red',
                        active
                          ? 'bg-ink text-white'
                          : 'text-grey-strong hover:bg-canvas hover:text-ink',
                      )}
                    >
                      <Icon className="size-4" aria-hidden="true" />
                      {link.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="hidden h-9 items-center rounded-panel px-3 text-[0.8125rem] font-medium text-grey-strong transition-colors duration-[--duration-feedback] hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red sm:inline-flex"
          >
            View the shop
          </Link>
          <button
            type="button"
            onClick={signOut}
            className="inline-flex h-9 items-center gap-2 rounded-panel border border-line-strong px-3 text-[0.8125rem] font-medium text-ink transition-colors duration-[--duration-feedback] hover:border-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red"
          >
            <LogOut className="size-3.5" aria-hidden="true" />
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}
