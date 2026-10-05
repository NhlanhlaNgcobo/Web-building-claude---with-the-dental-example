import { cn } from '@/lib/cn';

/* ------------------------------------------------------------------ */
/* Badge                                                               */
/* ------------------------------------------------------------------ */

type BadgeTone = 'neutral' | 'blue' | 'positive' | 'caution' | 'critical' | 'onDark';

const badgeTones: Record<BadgeTone, string> = {
  neutral: 'bg-canvas-deep text-grey-strong',
  blue: 'bg-blue-soft text-blue-deep',
  positive: 'bg-[--color-positive-soft] text-[--color-positive]',
  caution: 'bg-[--color-caution-soft] text-[--color-caution]',
  critical: 'bg-[--color-critical-soft] text-[--color-critical]',
  onDark: 'bg-white/10 text-white',
};

export function Badge({
  children,
  tone = 'neutral',
  className,
  icon,
}: {
  readonly children: React.ReactNode;
  readonly tone?: BadgeTone;
  readonly className?: string;
  readonly icon?: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-panel px-2.5 py-1',
        'text-[0.6875rem] font-semibold uppercase',
        badgeTones[tone],
        className,
      )}
      style={{ letterSpacing: '0.06em' }}
    >
      {icon}
      {children}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Glass panel                                                         */
/* ------------------------------------------------------------------ */

export function GlassPanel({
  children,
  className,
  tone = 'light',
  as: Tag = 'div',
}: {
  readonly children: React.ReactNode;
  readonly className?: string;
  readonly tone?: 'light' | 'dark' | 'blue';
  readonly as?: 'div' | 'aside' | 'section' | 'article';
}) {
  return (
    <Tag
      className={cn(
        'rounded-card',
        tone === 'light' && 'glass-light',
        tone === 'dark' && 'glass-dark',
        tone === 'blue' && 'glass-blue',
        className,
      )}
    >
      {children}
    </Tag>
  );
}

/* ------------------------------------------------------------------ */
/* Skeleton                                                            */
/* ------------------------------------------------------------------ */

/**
 * Structural skeletons, shaped like the content they stand in for rather than
 * a generic spinner, so the layout does not jump when real data arrives.
 */
export function Skeleton({ className }: { readonly className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn('animate-pulse rounded-panel bg-canvas-deep', className)}
    />
  );
}

export function SlotGridSkeleton({ count = 12 }: { readonly count?: number }) {
  return (
    <div
      className="grid grid-cols-3 gap-2 sm:grid-cols-4"
      role="status"
      aria-busy="true"
      aria-label="Loading available times"
    >
      {Array.from({ length: count }, (_, i) => (
        <Skeleton key={i} className="h-11" />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Divider                                                             */
/* ------------------------------------------------------------------ */

export function Divider({
  className,
  tone = 'light',
}: {
  readonly className?: string;
  readonly tone?: 'light' | 'dark';
}) {
  return (
    <hr
      className={cn(
        'border-0 border-t',
        tone === 'dark' ? 'border-line-dark' : 'border-line',
        className,
      )}
    />
  );
}

/* ------------------------------------------------------------------ */
/* Definition list, used for appointment and clinic details            */
/* ------------------------------------------------------------------ */

export function DetailList({
  items,
  tone = 'light',
  className,
}: {
  readonly items: readonly { label: string; value: React.ReactNode }[];
  readonly tone?: 'light' | 'dark';
  readonly className?: string;
}) {
  return (
    <dl className={cn('grid gap-px overflow-hidden rounded-card', className)}>
      {items.map((item) => (
        <div
          key={item.label}
          className={cn(
            'flex items-baseline justify-between gap-4 px-4 py-3',
            tone === 'dark' ? 'bg-white/[0.04]' : 'bg-canvas',
          )}
        >
          <dt
            className={cn(
              'text-[0.8125rem]',
              tone === 'dark' ? 'text-white/55' : 'text-grey-strong',
            )}
          >
            {item.label}
          </dt>
          <dd
            className={cn(
              'text-right text-[0.9375rem] font-medium tabular-nums',
              tone === 'dark' ? 'text-white' : 'text-ink',
            )}
          >
            {item.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

/* ------------------------------------------------------------------ */
/* Empty state                                                         */
/* ------------------------------------------------------------------ */

/**
 * Every empty state gets one clear next action. An empty state with nothing to
 * do in it is a dead end.
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
  tone = 'light',
  className,
}: {
  readonly icon?: React.ReactNode;
  readonly title: string;
  readonly description?: string;
  readonly action: React.ReactNode;
  readonly tone?: 'light' | 'dark';
  readonly className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center gap-3 rounded-card border px-6 py-10 text-center',
        tone === 'dark'
          ? 'border-line-dark bg-white/[0.03]'
          : 'border-line bg-canvas',
        className,
      )}
    >
      {icon && (
        <span
          className={cn(
            'flex size-10 items-center justify-center rounded-full',
            tone === 'dark' ? 'bg-white/8 text-white/70' : 'bg-white text-grey-strong',
          )}
        >
          {icon}
        </span>
      )}
      <div>
        <p
          className={cn(
            'text-[0.9375rem] font-semibold',
            tone === 'dark' ? 'text-white' : 'text-ink',
          )}
        >
          {title}
        </p>
        {description && (
          <p
            className={cn(
              'mt-1 max-w-sm text-sm',
              tone === 'dark' ? 'text-white/60' : 'text-grey-strong',
            )}
          >
            {description}
          </p>
        )}
      </div>
      <div className="mt-1">{action}</div>
    </div>
  );
}
