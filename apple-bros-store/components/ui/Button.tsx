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
 * The primary action is near-black rather than red. Red is the brand accent
 * and is used for the mark, for focus and for emphasis; making every button
 * red would put six of them on a product page and leave nothing to draw the
 * eye. The one place red does take a button is the add-to-basket action,
 * which uses the `critical` variant for its weight rather than its meaning.
 *
 * Interaction feedback is capped at the feedback token. Only colour and
 * shadow move: buttons do not scale or lift, because at this size a transform
 * reads as wobble.
 */
const base =
  'relative inline-flex items-center justify-center gap-2 rounded-panel font-semibold ' +
  'whitespace-nowrap select-none ' +
  'transition-[background-color,border-color,color,box-shadow] ' +
  'duration-[--duration-feedback] ease-out ' +
  'disabled:pointer-events-none disabled:opacity-50 ' +
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red';

const variants: Record<Variant, string> = {
  primary:
    'bg-ink text-white shadow-[0_1px_2px_rgb(13_17_23/0.2)] ' +
    'hover:bg-graphite active:bg-graphite-soft',
  secondary:
    'border border-line-strong bg-white text-ink ' +
    'hover:border-ink hover:bg-canvas active:bg-canvas-deep',
  ghost: 'text-ink hover:bg-canvas active:bg-canvas-deep',
  onDark:
    'bg-white text-ink hover:bg-paper active:bg-canvas ' +
    'focus-visible:outline-white',
  onDarkGhost:
    'border border-line-dark text-white hover:border-line-dark-strong ' +
    'hover:bg-white/8 active:bg-white/12 focus-visible:outline-white',
  critical:
    'bg-red text-white shadow-[0_1px_2px_rgb(176_18_34/0.3)] ' +
    'hover:bg-red-deep active:bg-red-dark',
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
      {loading && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
      {/* The label stays in the DOM while loading, so the button keeps its
          width and its accessible name does not disappear. */}
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
    <a className={buttonClasses({ variant, size, block, className })} {...props}>
      {children}
    </a>
  );
}
