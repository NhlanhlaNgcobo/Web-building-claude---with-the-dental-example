import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/cn';

type Variant =
  | 'primary'
  | 'secondary'
  | 'ghost'
  | 'onDark'
  | 'onDarkGhost'
  | 'critical';
type Size = 'sm' | 'md' | 'lg';

/**
 * Shared button styling.
 *
 * Interaction feedback is capped at the feedback duration token, and only
 * colour and shadow move. Buttons do not scale or lift on hover, because at
 * this size a transform reads as wobble rather than response.
 */
const base =
  'relative inline-flex items-center justify-center gap-2 rounded-panel font-medium ' +
  'whitespace-nowrap select-none ' +
  'transition-[background-color,border-color,color,box-shadow] ' +
  'duration-[--duration-feedback] ease-out ' +
  'disabled:pointer-events-none disabled:opacity-50 ' +
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue';

const variants: Record<Variant, string> = {
  primary:
    'bg-blue text-white shadow-[0_1px_2px_rgb(7_61_158/0.24)] ' +
    'hover:bg-blue-deep active:bg-blue-dark',
  secondary:
    'border border-line-strong bg-white text-ink ' +
    'hover:border-ink hover:bg-canvas active:bg-canvas-deep',
  ghost: 'text-ink hover:bg-canvas active:bg-canvas-deep',
  onDark:
    'bg-white text-ink hover:bg-canvas active:bg-canvas-deep ' +
    'focus-visible:outline-white',
  onDarkGhost:
    'border border-line-dark text-white hover:border-line-dark-strong ' +
    'hover:bg-white/8 active:bg-white/12 focus-visible:outline-white',
  critical:
    'bg-[--color-critical] text-white hover:brightness-110 active:brightness-95',
};

const sizes: Record<Size, string> = {
  sm: 'h-9 px-3.5 text-[0.8125rem]',
  md: 'h-11 px-5 text-sm',
  lg: 'h-13 px-6 text-[0.9375rem]',
};

interface CommonProps {
  readonly variant?: Variant;
  readonly size?: Size;
  readonly className?: string;
  readonly children: React.ReactNode;
  /** Stretch to the width of the container. */
  readonly block?: boolean;
}

export function buttonClasses({
  variant = 'primary',
  size = 'md',
  block = false,
  className,
}: Omit<CommonProps, 'children'> = {}): string {
  return cn(base, variants[variant], sizes[size], block && 'w-full', className);
}

type ButtonProps = CommonProps &
  Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'className' | 'children'> & {
    readonly loading?: boolean;
    /** Announced to screen readers while loading. */
    readonly loadingLabel?: string;
  };

export function Button({
  variant,
  size,
  block,
  className,
  children,
  loading = false,
  loadingLabel = 'Working',
  disabled,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={buttonClasses({ variant, size, block, className })}
      {...props}
    >
      {loading && (
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
      )}
      {/* The label stays in the DOM while loading, so the button does not
          change width and the accessible name does not disappear. */}
      <span className={loading ? 'sr-only' : undefined}>{children}</span>
      {loading && <span aria-hidden="true">{loadingLabel}</span>}
    </button>
  );
}

type ButtonLinkProps = CommonProps &
  Omit<React.ComponentProps<typeof Link>, 'className' | 'children'>;

export function ButtonLink({
  variant,
  size,
  block,
  className,
  children,
  ...props
}: ButtonLinkProps) {
  return (
    <Link
      className={buttonClasses({ variant, size, block, className })}
      {...props}
    >
      {children}
    </Link>
  );
}

/** For tel:, mailto: and wa.me links, which Next's Link should not handle. */
export function ButtonAnchor({
  variant,
  size,
  block,
  className,
  children,
  ...props
}: CommonProps & React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  return (
    <a
      className={buttonClasses({ variant, size, block, className })}
      {...props}
    >
      {children}
    </a>
  );
}
