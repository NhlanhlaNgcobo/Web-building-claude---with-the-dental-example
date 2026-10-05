'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { Dialog } from '@base-ui/react/dialog';
import { Menu, Phone, Siren, X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Logo } from '@/components/brand/Logo';
import { ButtonLink } from '@/components/ui/Button';
import { clinic } from '@/data/clinic';
import { track } from '@/lib/analytics';

const navItems = [
  { href: '/treatments', label: 'Treatments' },
  { href: '/emergency', label: 'Emergency' },
  { href: '/about', label: 'About' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/shop', label: 'Shop' },
  { href: '/contact', label: 'Contact' },
] as const;

/**
 * Site navigation.
 *
 * Starts transparent over the hero and settles into a frosted surface once the
 * page has moved. Two things are worth noting about how that is done:
 *
 * 1. The state change is driven by an IntersectionObserver watching a one
 *    pixel sentinel at the top of the page, not by a scroll listener. Nothing
 *    runs on the main thread while the user scrolls.
 *
 * 2. backdrop-filter is applied once and never transitioned. Animating a blur
 *    across the full width of the viewport forces the compositor to re-filter
 *    every frame, which is the most expensive thing this page could do. Only
 *    background-color, border-color and box-shadow cross-fade, and the bar is
 *    a thin isolated strip rather than a large surface, which is what makes
 *    animating those properties reasonable here.
 */
/**
 * Routes whose first screen is a dark full-bleed hero, where the navigation
 * should start transparent and sit over the image. Everywhere else it starts
 * in its solid state, because a transparent bar over white content is
 * invisible.
 */
const DARK_HERO_ROUTES = new Set(['/', '/emergency']);

export function Nav() {
  const pathname = usePathname();
  const overHero = DARK_HERO_ROUTES.has(pathname);
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  /**
   * The observer only exists on routes with a dark hero behind the bar.
   * Everywhere else the solid state is derived at render below rather than
   * being pushed into state by an effect, which is both simpler and avoids a
   * cascading render on every navigation.
   */
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

  // Derived, not stored: a page without a dark hero is always solid, and an
  // open mobile sheet always needs a solid bar behind it.
  const solid = !overHero || scrolled || mobileOpen;

  return (
    <>
      {overHero && (
        <div ref={sentinelRef} aria-hidden="true" className="absolute top-0 h-px w-full" />
      )}

      <header
        className={cn(
          'fixed inset-x-0 top-0 z-nav',
          // Blur is constant, never animated. See the note above.
          'backdrop-blur-[18px]',
          'transition-[background-color,border-color,box-shadow]',
          'duration-[--duration-feedback] ease-out',
          solid
            ? 'border-b border-line bg-white/85 shadow-[0_1px_2px_rgb(10_11_13/0.04)]'
            : 'border-b border-white/10 bg-ink/25',
        )}
      >
        <div className="container-page">
          <div className="flex h-16 items-center justify-between gap-4 lg:h-[4.5rem]">
            <Link
              href="/"
              aria-label="Harbour Dental Studio, home"
              className="shrink-0 rounded-panel focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue"
            >
              <Logo tone={solid ? 'ink' : 'white'} />
            </Link>

            <nav aria-label="Main" className="hidden lg:block">
              <ul className="flex items-center gap-1">
                {navItems.map((item) => {
                  const active =
                    pathname === item.href || pathname.startsWith(`${item.href}/`);
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        aria-current={active ? 'page' : undefined}
                        className={cn(
                          'relative flex h-9 items-center rounded-panel px-3 text-sm font-medium',
                          'transition-colors duration-[--duration-feedback] ease-out',
                          'focus-visible:outline-2 focus-visible:outline-offset-2',
                          solid
                            ? cn(
                                'focus-visible:outline-blue',
                                active
                                  ? 'text-blue'
                                  : 'text-charcoal hover:text-blue',
                              )
                            : cn(
                                'focus-visible:outline-white',
                                active ? 'text-white' : 'text-white/75 hover:text-white',
                              ),
                        )}
                      >
                        {item.label}
                        {/* Active state is marked with an underline as well as
                            colour, so it does not rely on colour alone. */}
                        {active && (
                          <span
                            aria-hidden="true"
                            className={cn(
                              'absolute inset-x-3 bottom-1 h-0.5 rounded-full',
                              solid ? 'bg-blue' : 'bg-white',
                            )}
                          />
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>

            <div className="flex items-center gap-2">
              <a
                href={`tel:${clinic.telephone.e164}`}
                onClick={() => track({ name: 'contact_clicked', channel: 'telephone' })}
                className={cn(
                  'hidden h-9 items-center gap-2 rounded-panel px-3 text-sm font-medium lg:flex',
                  'transition-colors duration-[--duration-feedback] ease-out',
                  'focus-visible:outline-2 focus-visible:outline-offset-2',
                  solid
                    ? 'text-charcoal hover:text-blue focus-visible:outline-blue'
                    : 'text-white/75 hover:text-white focus-visible:outline-white',
                )}
              >
                <Phone className="size-4" aria-hidden="true" />
                <span className="tabular-nums">{clinic.telephone.display}</span>
              </a>

              <ButtonLink
                href="/book"
                size="sm"
                variant={solid ? 'primary' : 'onDark'}
                className="hidden sm:inline-flex"
              >
                Book Appointment
              </ButtonLink>

              <Dialog.Root open={mobileOpen} onOpenChange={setMobileOpen}>
                <Dialog.Trigger
                  aria-label="Open menu"
                  className={cn(
                    'flex size-10 items-center justify-center rounded-panel lg:hidden',
                    'transition-colors duration-[--duration-feedback] ease-out',
                    'focus-visible:outline-2 focus-visible:outline-offset-2',
                    solid
                      ? 'text-ink hover:bg-canvas focus-visible:outline-blue'
                      : 'text-white hover:bg-white/10 focus-visible:outline-white',
                  )}
                >
                  <Menu className="size-5" aria-hidden="true" />
                </Dialog.Trigger>

                <Dialog.Portal>
                  <Dialog.Backdrop
                    className={cn(
                      'fixed inset-0 z-overlay min-h-dvh bg-ink/40',
                      'transition-opacity duration-[--duration-feedback]',
                      'data-starting-style:opacity-0 data-ending-style:opacity-0',
                    )}
                  />
                  <Dialog.Popup
                    className={cn(
                      'fixed inset-y-0 right-0 z-modal flex w-[min(22rem,88vw)] flex-col',
                      'border-l border-line bg-white',
                      'transition-transform duration-200 ease-out',
                      'data-starting-style:translate-x-full data-ending-style:translate-x-full',
                    )}
                  >
                    <div className="flex h-16 items-center justify-between border-b border-line px-5">
                      <Dialog.Title className="sr-only">Menu</Dialog.Title>
                      <Logo />
                      <Dialog.Close
                        aria-label="Close menu"
                        className="flex size-10 items-center justify-center rounded-panel text-ink hover:bg-canvas focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue"
                      >
                        <X className="size-5" aria-hidden="true" />
                      </Dialog.Close>
                    </div>

                    <nav aria-label="Mobile" className="flex-1 overflow-y-auto px-3 py-4">
                      <ul className="flex flex-col gap-0.5">
                        {navItems.map((item) => {
                          const active =
                            pathname === item.href ||
                            pathname.startsWith(`${item.href}/`);
                          return (
                            <li key={item.href}>
                              <Link
                                href={item.href}
                                onClick={() => setMobileOpen(false)}
                                aria-current={active ? 'page' : undefined}
                                className={cn(
                                  'flex items-center justify-between rounded-panel px-3 py-3',
                                  'text-[0.9375rem] font-medium',
                                  active
                                    ? 'bg-blue-soft text-blue-deep'
                                    : 'text-charcoal hover:bg-canvas',
                                )}
                              >
                                {item.label}
                                {item.href === '/emergency' && (
                                  <Siren
                                    className="size-4 text-[--color-critical]"
                                    aria-hidden="true"
                                  />
                                )}
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    </nav>

                    <div className="border-t border-line p-4">
                      <ButtonLink
                        href="/book"
                        block
                        size="lg"
                        onClick={() => setMobileOpen(false)}
                      >
                        Book Appointment
                      </ButtonLink>
                      <a
                        href={`tel:${clinic.telephone.e164}`}
                        onClick={() =>
                          track({ name: 'contact_clicked', channel: 'telephone' })
                        }
                        className="mt-3 flex items-center justify-center gap-2 text-sm font-medium text-charcoal"
                      >
                        <Phone className="size-4" aria-hidden="true" />
                        <span className="tabular-nums">
                          {clinic.telephone.display}
                        </span>
                      </a>
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
