import { cn } from '@/lib/cn';

/**
 * The Apple Bros mark.
 *
 * Rebuilt as inline SVG from the supplied logo so it scales to any size, stays
 * crisp on any display, costs no network request, and can take a flat
 * treatment where a photographic one would be wrong (the favicon, a dark
 * footer, a disabled state).
 *
 * Note on the gradients below: the project otherwise forbids them, and this is
 * the deliberate exception. They reproduce the shading of a brand asset that
 * was given to us rather than decorating something, and they are confined to
 * this one file. Nothing else on the site uses a gradient.
 *
 * To use the original raster instead, drop it into public/ and swap the
 * AppleMark body for an <Image>. Everything else keeps working, because the
 * rest of the site only ever imports Logo or AppleMark.
 */

export function AppleMark({
  className,
  id = 'ab',
  ...props
}: React.SVGProps<SVGSVGElement> & { readonly id?: string }) {
  // Gradient ids must be unique per instance, otherwise a second mark on the
  // same page inherits the first one's fills.
  const body = `${id}-body`;
  const band = `${id}-band`;
  const leaf = `${id}-leaf`;

  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
      className={cn('size-9', className)}
      {...props}
    >
      <defs>
        <linearGradient id={body} x1="10" y1="12" x2="54" y2="58">
          <stop offset="0" stopColor="#F63440" />
          <stop offset="0.55" stopColor="#E11D2E" />
          <stop offset="1" stopColor="#B01222" />
        </linearGradient>
        <linearGradient id={band} x1="8" y1="30" x2="56" y2="38">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.34" />
          <stop offset="1" stopColor="#FFFFFF" stopOpacity="0.12" />
        </linearGradient>
        <linearGradient id={leaf} x1="33" y1="16" x2="51" y2="5">
          <stop offset="0" stopColor="#2F8F23" />
          <stop offset="1" stopColor="#8DC63F" />
        </linearGradient>
        <clipPath id={`${id}-clip`}>
          <path d="M32 19c-5-8-16-9-21-2-6 8-4 24 3 34 4 6 9 8 13 6 3-1 7-1 10 0 4 2 9 0 13-6 7-10 9-26 3-34-5-7-16-6-21 2Z" />
        </clipPath>
      </defs>

      {/* Body */}
      <path
        d="M32 19c-5-8-16-9-21-2-6 8-4 24 3 34 4 6 9 8 13 6 3-1 7-1 10 0 4 2 9 0 13-6 7-10 9-26 3-34-5-7-16-6-21 2Z"
        fill={`url(#${body})`}
      />

      {/* The diagonal highlight band from the original mark, clipped to the
          body so it reads as a sheen rather than a stripe laid on top. */}
      <g clipPath={`url(#${id}-clip)`}>
        <rect
          x="-10"
          y="26"
          width="84"
          height="9"
          rx="4.5"
          fill={`url(#${band})`}
          transform="rotate(-9 32 30)"
        />
        <rect
          x="-10"
          y="41"
          width="84"
          height="5"
          rx="2.5"
          fill="#FFFFFF"
          fillOpacity="0.1"
          transform="rotate(-9 32 43)"
        />
      </g>

      {/* Stem */}
      <path
        d="M31 20c-.6-4-1.4-7.6-3.4-10.4"
        stroke="#7B4A1E"
        strokeWidth="3.4"
        strokeLinecap="round"
      />

      {/* Leaf */}
      <path
        d="M31.5 13.5c2-5.5 7.5-9 14-9 .8 0 1.3.8 1 1.5-2.4 5.8-7.6 9.4-13.8 9.4-.9 0-1.5-1-1.2-1.9Z"
        fill={`url(#${leaf})`}
      />
    </svg>
  );
}

interface LogoProps {
  readonly className?: string;
  /** 'ink' for light backgrounds, 'white' for dark ones. */
  readonly tone?: 'ink' | 'white';
  /** Hide the wordmark and show only the apple. */
  readonly compact?: boolean;
  /** Unique id prefix, needed when more than one mark is on a page. */
  readonly id?: string;
}

export function Logo({
  className,
  tone = 'ink',
  compact = false,
  id = 'ab',
}: LogoProps) {
  if (compact) {
    return <AppleMark id={id} className={className} />;
  }

  return (
    <span className={cn('flex items-center gap-2.5', className)}>
      <AppleMark id={id} className="size-9 shrink-0" />

      {/* The divider from the original lockup. */}
      <span
        aria-hidden="true"
        className={cn(
          'h-7 w-px shrink-0',
          tone === 'white' ? 'bg-white/25' : 'bg-line-strong',
        )}
      />

      <span className="flex flex-col leading-none">
        <span
          className={cn(
            'text-[0.6875rem] font-semibold',
            tone === 'white' ? 'text-white/60' : 'text-grey-strong',
          )}
          style={{ letterSpacing: '0.02em' }}
        >
          The
        </span>
        <span
          className={cn(
            'text-display text-[1.0625rem]',
            tone === 'white' ? 'text-white' : 'text-ink',
          )}
        >
          Apple Bros
        </span>
      </span>
    </span>
  );
}
