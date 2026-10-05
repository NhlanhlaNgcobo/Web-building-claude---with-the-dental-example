import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/cn';
import { JsonLd, breadcrumbSchema } from '@/lib/seo';

/**
 * The standard top of every inner page.
 *
 * It owns the padding that clears the fixed navigation, so that spacing is
 * defined once rather than remembered on each page. The homepage and the
 * emergency page use their own full-bleed heroes instead.
 */

export interface Crumb {
  readonly name: string;
  readonly path: string;
}

interface PageHeroProps {
  readonly eyebrow?: string;
  readonly title: React.ReactNode;
  readonly lede?: React.ReactNode;
  readonly crumbs?: readonly Crumb[];
  readonly tone?: 'light' | 'dark';
  readonly children?: React.ReactNode;
  readonly align?: 'start' | 'center';
  readonly className?: string;
}

export function PageHero({
  eyebrow,
  title,
  lede,
  crumbs,
  tone = 'light',
  children,
  align = 'start',
  className,
}: PageHeroProps) {
  const dark = tone === 'dark';

  return (
    <div
      className={cn(
        'pt-16 lg:pt-[4.5rem]',
        dark ? 'bg-ink text-white' : 'bg-canvas text-ink',
        className,
      )}
    >
      <div className="container-page py-12 lg:py-16">
        {crumbs && crumbs.length > 0 && (
          <>
            <Breadcrumbs crumbs={crumbs} tone={tone} />
            <JsonLd
              schema={breadcrumbSchema([
                { name: 'Home', path: '/' },
                ...crumbs,
              ])}
            />
          </>
        )}

        <div
          className={cn(
            'max-w-3xl',
            align === 'center' && 'mx-auto text-center',
            crumbs && crumbs.length > 0 ? 'mt-6' : '',
          )}
        >
          {eyebrow && (
            <p className={cn('text-eyebrow mb-3', dark && 'text-white/55')}>
              {eyebrow}
            </p>
          )}
          <h1
            className={cn(
              'text-[2rem] font-semibold leading-[1.1] sm:text-[2.5rem] lg:text-[3rem]',
              dark ? 'text-white' : 'text-ink',
            )}
          >
            {title}
          </h1>
          {lede && (
            <p
              className={cn(
                'mt-5 text-[1.0625rem] leading-relaxed sm:text-[1.125rem]',
                dark ? 'text-white/70' : 'text-grey-strong',
              )}
            >
              {lede}
            </p>
          )}
          {children && <div className="mt-8">{children}</div>}
        </div>
      </div>
    </div>
  );
}

export function Breadcrumbs({
  crumbs,
  tone = 'light',
}: {
  readonly crumbs: readonly Crumb[];
  readonly tone?: 'light' | 'dark';
}) {
  const dark = tone === 'dark';

  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center gap-1 text-[0.8125rem]">
        <li className="flex items-center gap-1">
          <Link
            href="/"
            className={cn(
              'rounded-panel transition-colors duration-[--duration-feedback]',
              dark
                ? 'text-white/55 hover:text-white'
                : 'text-grey-strong hover:text-blue',
            )}
          >
            Home
          </Link>
        </li>
        {crumbs.map((crumb, index) => {
          const isLast = index === crumbs.length - 1;
          return (
            <li key={crumb.path} className="flex items-center gap-1">
              <ChevronRight
                className={cn(
                  'size-3.5 shrink-0',
                  dark ? 'text-white/30' : 'text-grey-light',
                )}
                aria-hidden="true"
              />
              {isLast ? (
                <span
                  aria-current="page"
                  className={cn(
                    'font-medium',
                    dark ? 'text-white' : 'text-ink',
                  )}
                >
                  {crumb.name}
                </span>
              ) : (
                <Link
                  href={crumb.path}
                  className={cn(
                    'rounded-panel transition-colors duration-[--duration-feedback]',
                    dark
                      ? 'text-white/55 hover:text-white'
                      : 'text-grey-strong hover:text-blue',
                  )}
                >
                  {crumb.name}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
