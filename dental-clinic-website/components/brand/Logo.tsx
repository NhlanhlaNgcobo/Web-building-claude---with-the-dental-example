import { cn } from '@/lib/cn';

/**
 * The Harbour Dental Studio mark.
 *
 * An H whose two uprights are bridged not by the usual crossbar but by a
 * shallow upward arc, so the negative space between the stems reads as a smile
 * without any tooth imagery. The counter is left open deliberately: the shape
 * is completed by the space rather than by a line.
 */
export function Monogram({
  className,
  ...props
}: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
      className={cn('size-8', className)}
      {...props}
    >
      {/* Left and right stems. */}
      <rect x="4" y="5" width="3.4" height="22" rx="1.7" fill="currentColor" />
      <rect x="24.6" y="5" width="3.4" height="22" rx="1.7" fill="currentColor" />
      {/* The smile curve that replaces the crossbar. */}
      <path
        d="M7.4 14.2c0 5.2 3.8 8.4 8.6 8.4s8.6-3.2 8.6-8.4"
        stroke="currentColor"
        strokeWidth="3.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

interface LogoProps {
  readonly className?: string;
  /** 'ink' for light backgrounds, 'white' for dark ones. */
  readonly tone?: 'ink' | 'white';
  /** Hide the wordmark and show only the monogram. */
  readonly compact?: boolean;
}

export function Logo({ className, tone = 'ink', compact = false }: LogoProps) {
  const toneClass = tone === 'white' ? 'text-white' : 'text-ink';

  return (
    <span className={cn('flex items-center gap-2.5', toneClass, className)}>
      <Monogram className={tone === 'white' ? 'text-white' : 'text-blue'} />
      {!compact && (
        <span className="flex flex-col leading-none">
          <span className="text-[0.9375rem] font-semibold">
            Harbour Dental
          </span>
          <span
            className={cn(
              'text-[0.625rem] font-medium uppercase',
              tone === 'white' ? 'text-white/60' : 'text-grey-strong',
            )}
            style={{ letterSpacing: '0.18em' }}
          >
            Studio
          </span>
        </span>
      )}
    </span>
  );
}
