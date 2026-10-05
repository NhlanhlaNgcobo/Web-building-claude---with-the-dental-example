'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  CalendarDays,
  ExternalLink,
  LayoutDashboard,
  LogOut,
  Package,
  Users,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { Monogram } from '@/components/brand/Logo';

const links = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/calendar', label: 'Diary', icon: CalendarDays },
  { href: '/admin/schedules', label: 'Schedules', icon: Users },
  { href: '/admin/orders', label: 'Orders', icon: Package },
] as const;

export function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  // The login page has its own chrome.
  if (pathname === '/admin/login') return null;

  async function signOut() {
    setSigningOut(true);
    try {
      await fetch('/api/admin/session', { method: 'DELETE' });
      router.push('/admin/login');
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <header className="sticky top-0 z-nav border-b border-line-dark bg-ink/90 backdrop-blur-[18px]">
      <div className="mx-auto flex h-16 max-w-[110rem] items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-6">
          <Link
            href="/admin"
            className="flex shrink-0 items-center gap-2.5 rounded-panel focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
          >
            <Monogram className="size-7 text-blue" />
            <span className="hidden flex-col leading-none sm:flex">
              <span className="text-sm font-semibold text-white">
                Practice diary
              </span>
              <span
                className="text-[0.625rem] font-medium uppercase text-white/45"
                style={{ letterSpacing: '0.14em' }}
              >
                Harbour Dental
              </span>
            </span>
          </Link>

          <nav aria-label="Staff area" className="min-w-0">
            <ul className="flex items-center gap-0.5 overflow-x-auto">
              {links.map((link) => {
                const active =
                  link.href === '/admin'
                    ? pathname === '/admin'
                    : pathname.startsWith(link.href);
                const Icon = link.icon;
                return (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      aria-current={active ? 'page' : undefined}
                      className={cn(
                        'flex h-9 items-center gap-2 whitespace-nowrap rounded-panel px-3 text-[0.8125rem] font-medium',
                        'transition-colors duration-[--duration-feedback] ease-out',
                        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white',
                        active
                          ? 'bg-white/12 text-white'
                          : 'text-white/60 hover:bg-white/8 hover:text-white',
                      )}
                    >
                      <Icon className="size-4 shrink-0" aria-hidden="true" />
                      <span className="hidden sm:inline">{link.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <Link
            href="/"
            target="_blank"
            className="flex h-9 items-center gap-2 rounded-panel px-3 text-[0.8125rem] font-medium text-white/60 transition-colors duration-[--duration-feedback] hover:bg-white/8 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            <ExternalLink className="size-3.5" aria-hidden="true" />
            <span className="hidden lg:inline">View site</span>
          </Link>
          <button
            type="button"
            onClick={() => void signOut()}
            disabled={signingOut}
            className="flex h-9 items-center gap-2 rounded-panel px-3 text-[0.8125rem] font-medium text-white/60 transition-colors duration-[--duration-feedback] hover:bg-white/8 hover:text-white disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            <LogOut className="size-3.5" aria-hidden="true" />
            <span className="hidden lg:inline">
              {signingOut ? 'Signing out' : 'Sign out'}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}
