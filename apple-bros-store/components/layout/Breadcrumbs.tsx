import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/cn';

export interface Crumb {
  readonly name: string;
  readonly path: string;
}

/**
 * Breadcrumbs.
 *
 * The last crumb is the current page, so it is text with aria-current rather
 * than a link to where you already are. The separators are decorative and
 * hidden from the accessibility tree, which leaves a screen reader with a
 * clean list of the trail.
 *
 * Pair with breadcrumbSchema() from lib/seo for the structured data; this
 * component renders the visible trail only.
 */
export function Breadcrumbs({
  items,
  className,
  tone = 'light',
}: {
  readonly items: readonly Crumb[];
  readonly className?: string;
  readonly tone?: 'light' | 'dark';
}) {
  if (items.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className={cn('min-w-0', className)}>
      <ol className="scroll-x flex items-center gap-1.5 text-[0.8125rem]">
        {items.map((item, index) => {
          const last = index === items.length - 1;
          return (
            <li key={item.path} className="flex items-center gap-1.5">
              {index > 0 && (
                <ChevronRight
                  className={cn(
                    'size-3.5 shrink-0',
                    tone === 'dark' ? 'text-white/40' : 'text-grey',
                  )}
                  aria-hidden="true"
                />
              )}
              {last ? (
                <span
                  aria-current="page"
                  className={cn(
                    'whitespace-nowrap font-medium',
                    tone === 'dark' ? 'text-white' : 'text-ink',
                  )}
                >
                  {item.name}
                </span>
              ) : (
                <Link
                  href={item.path}
                  className={cn(
                    'whitespace-nowrap rounded-panel transition-colors duration-[--duration-feedback]',
                    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red',
                    tone === 'dark'
                      ? 'text-white/65 hover:text-white'
                      : 'text-grey-strong hover:text-ink',
                  )}
                >
                  {item.name}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
