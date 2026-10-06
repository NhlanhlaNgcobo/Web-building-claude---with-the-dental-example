import Link from 'next/link';
import { Logo } from '@/components/brand/Logo';
import { ButtonLink } from '@/components/ui/Button';

/**
 * Not found.
 *
 * A stock page that has sold out and been removed is the most likely way
 * somebody lands here, so the page says that rather than shouting 404 at them,
 * and points at the places they can actually go.
 */
export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col bg-white">
      <header className="border-b border-line">
        <div className="container-page flex h-16 items-center">
          <Link
            href="/"
            className="rounded-panel focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red"
          >
            <Logo />
          </Link>
        </div>
      </header>

      <main
        id="main"
        className="container-page flex flex-1 flex-col items-center justify-center py-20 text-center"
      >
        <p className="text-eyebrow">That page is not here</p>
        <h1 className="text-display mt-4 max-w-xl text-[2rem] text-ink sm:text-[2.5rem]">
          It may have sold and come off the shelf
        </h1>
        <p className="mt-5 max-w-lg text-pretty text-[1rem] leading-relaxed text-grey-strong">
          Most of what we sell is a single unit, so a product page disappears
          when that device goes. The same model often comes back in, so it is
          worth looking at the category.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <ButtonLink href="/shop" size="lg">
            Everything we stock
          </ButtonLink>
          <ButtonLink href="/search" size="lg" variant="secondary">
            Search for a model
          </ButtonLink>
        </div>

        <p className="mt-10 text-[0.875rem] text-grey-strong">
          Or{' '}
          <Link
            href="/contact"
            className="font-semibold text-ink underline decoration-red decoration-2 underline-offset-4 hover:text-red focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red"
          >
            ask us
          </Link>{' '}
          whether we can get one in.
        </p>
      </main>
    </div>
  );
}
