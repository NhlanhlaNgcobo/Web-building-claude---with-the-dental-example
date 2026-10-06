'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { Dialog } from '@base-ui/react/dialog';
import { Menu, Search, ShoppingBag, X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Logo } from '@/components/brand/Logo';
import { useBasket } from '@/hooks/useBasket';

const navItems = [
  { href: '/shop/iphone', label: 'iPhone' },
  { href: '/shop/mac', label: 'Mac' },
  { href: '/shop/ipad', label: 'iPad' },
  { href: '/shop/watch', label: 'Watch' },
  { href: '/shop/audio', label: 'Audio' },
  { href: '/shop/accessories', label: 'Accessories' },
] as const;

const secondaryItems = [
  { href: '/trade-in', label: 'Trade in' },
  { href: '/grading', label: 'How we grade' },
  { href: '/help', label: 'Help' },
] as const;

/**
 * Site navigation.
 *
 * Sits over the hero on the home page and is solid everywhere else. Two
 * things worth noting about how that is done:
 *
 * 1. The state change comes from an IntersectionObserver watching a one
 *    pixel sentinel, not a scroll listener, so nothing runs on the main
 *    thread while the page scrolls.
 *
 * 2. backdrop-filter is set once in the surface-nav utility and never
 *    transitioned. Animating a blur across the width of the viewport forces
 *    the compositor to re-filter every frame.
 */
const TRANSPARENT_ROUTES = new Set(['/']);

export function Nav() {
  const pathname = usePathname();
  const overHero = TRANSPARENT_ROUTES.has(pathname);
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const { itemCount, hydrated } = useBasket();

  useEffect(() => {
    if (!overHero) return;
    const sentinel = sentinelRef.current;
    if (!sentinel || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      ([entry]) => setScrolled(!entry!.isIntersecting),
      { threshold: 0 },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [overHero]);

  // Derived rather than stored: a page without a hero is always solid.
  const solid = !overHero || scrolled || mobileOpen;

  return (
    <>
      {overHero && (
        <div
          ref={sentinelRef}
          aria-hidden="true"
          className="absolute top-0 h-px w-full"
        />
      )}

      <header
        className={cn(
          'fixed inset-x-0 top-0 z-nav surface-nav',
          'transition-[background-color,border-color,box-shadow]',
          'duration-[--duration-feedback] ease-out',
          solid
            ? 'border-b border-line bg-white/92 shadow-[0_1px_2px_rgb(13_17_23/0.04)]'
            : 'border-b border-transparent bg-white/0',
        )}
      >
        <div className="container-page">
          <div className="flex h-16 items-center justify-between gap-6 lg:h-[4.5rem]">
            <Link
              href="/"
              aria-label="The Apple Bros, home"
              className="shrink-0 rounded-panel focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-red"
            >
              <Logo id="nav" />
            </Link>

            <nav aria-label="Product categories" className="hidden lg:block">
              <ul className="flex items-center gap-0.5">
                {navItems.map((item) => {
                  const active = pathname.startsWith(item.href);
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        aria-current={active ? 'page' : undefined}
                        className={cn(
                          'relative flex h-9 items-center rounded-panel px-3 text-sm font-medium',
                          'transition-colors duration-[--duration-feedback] ease-out',
                          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red',
                          active ? 'text-red' : 'text-graphite hover:text-red',
                        )}
                      >
                        {item.label}
                        {/* Marked with an underline as well as colour, so the
                            active state does not rely on colour alone. */}
                        {active && (
                          <span
                            aria-hidden="true"
                            className="absolute inset-x-3 bottom-1 h-0.5 rounded-full bg-red"
                          />
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>

            <div className="flex items-center gap-1">
              <Link
                href="/search"
                aria-label="Search"
                className="flex size-10 items-center justify-center rounded-panel text-graphite transition-colors duration-[--duration-feedback] hover:bg-canvas focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red"
              >
                <Search className="size-[1.125rem]" aria-hidden="true" />
              </Link>

              <Link
                href="/trade-in"
                className="hidden h-9 items-center rounded-panel px-3 text-sm font-medium text-graphite transition-colors duration-[--duration-feedback] hover:text-red focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red lg:flex"
              >
                Trade in
              </Link>

              <Link
                href="/basket"
                className="relative flex size-10 items-center justify-center rounded-panel text-graphite transition-colors duration-[--duration-feedback] hover:bg-canvas focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red"
              >
                <ShoppingBag className="size-[1.125rem]" aria-hidden="true" />
                <span className="sr-only">
                  Basket{hydrated && itemCount > 0 ? `, ${itemCount} items` : ', empty'}
                </span>
                {hydrated && itemCount > 0 && (
                  <span
                    aria-hidden="true"
                    className="absolute right-1 top-1 flex min-w-[1.125rem] items-center justify-center rounded-full bg-red px-1 text-[0.625rem] font-bold tabular-nums text-white"
                  >
                    {itemCount}
                  </span>
                )}
              </Link>

              <Dialog.Root open={mobileOpen} onOpenChange={setMobileOpen}>
                <Dialog.Trigger
                  aria-label="Open menu"
                  className="flex size-10 items-center justify-center rounded-panel text-graphite transition-colors duration-[--duration-feedback] hover:bg-canvas focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red lg:hidden"
                >
                  <Menu className="size-5" aria-hidden="true" />
                </Dialog.Trigger>

                <Dialog.Portal>
                  <Dialog.Backdrop className="fixed inset-0 z-overlay min-h-dvh bg-ink/40 transition-opacity duration-[--duration-feedback] data-starting-style:opacity-0 data-ending-style:opacity-0" />
                  <Dialog.Popup className="fixed inset-y-0 right-0 z-modal flex w-[min(22rem,88vw)] flex-col border-l border-line bg-white transition-transform duration-200 ease-out data-starting-style:translate-x-full data-ending-style:translate-x-full">
                    <div className="flex h-16 items-center justify-between border-b border-line px-5">
                      <Dialog.Title className="sr-only">Menu</Dialog.Title>
                      <Logo id="sheet" />
                      <Dialog.Close
                        aria-label="Close menu"
                        className="flex size-10 items-center justify-center rounded-panel text-ink hover:bg-canvas focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red"
                      >
                        <X className="size-5" aria-hidden="true" />
                      </Dialog.Close>
                    </div>

                    <nav
                      aria-label="Mobile"
                      className="flex-1 overflow-y-auto px-3 py-4"
                    >
                      <p className="px-3 pb-2 text-eyebrow">Shop</p>
                      <ul className="flex flex-col gap-0.5">
                        {navItems.map((item) => {
                          const active = pathname.startsWith(item.href);
                          return (
                            <li key={item.href}>
                              <Link
                                href={item.href}
                                onClick={() => setMobileOpen(false)}
                                aria-current={active ? 'page' : undefined}
                                className={cn(
                                  'flex items-center rounded-panel px-3 py-3 text-[0.9375rem] font-medium',
                                  active
                                    ? 'bg-red-soft text-red-deep'
                                    : 'text-graphite hover:bg-canvas',
                                )}
                              >
                                {item.label}
                              </Link>
                            </li>
                          );
                        })}
                      </ul>

                      <p className="px-3 pb-2 pt-5 text-eyebrow">More</p>
                      <ul className="flex flex-col gap-0.5">
                        {secondaryItems.map((item) => (
                          <li key={item.href}>
                            <Link
                              href={item.href}
                              onClick={() => setMobileOpen(false)}
                              className="flex items-center rounded-panel px-3 py-3 text-[0.9375rem] font-medium text-graphite hover:bg-canvas"
                            >
                              {item.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </nav>

                    <div className="border-t border-line p-4">
                      <Link
                        href="/basket"
                        onClick={() => setMobileOpen(false)}
                        className="flex h-12 w-full items-center justify-center gap-2 rounded-panel bg-ink text-sm font-semibold text-white transition-colors duration-[--duration-feedback] hover:bg-graphite focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red"
                      >
                        <ShoppingBag className="size-4" aria-hidden="true" />
                        View basket
                        {hydrated && itemCount > 0 && (
                          <span className="tabular-nums">({itemCount})</span>
                        )}
                      </Link>
                    </div>
                  </Dialog.Popup>
                </Dialog.Portal>
              </Dialog.Root>
            </div>
          </div>
        </div>
      </header>
    </>
  );
}
