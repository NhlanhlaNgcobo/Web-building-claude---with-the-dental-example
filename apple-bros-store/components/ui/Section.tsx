import { cn } from '@/lib/cn';
import { Reveal } from './Reveal';

/**
 * Section shells.
 *
 * White is the default and should stay the majority of the page. Paper is a
 * barely-there off-white used to separate two adjacent bands without turning
 * anything grey, and ink is reserved for one or two moments per page where a
 * full-bleed dark section earns its contrast.
 */

interface SectionProps {
  readonly children: React.ReactNode;
  readonly className?: string;
  readonly tone?: 'white' | 'paper' | 'canvas' | 'ink';
  readonly id?: string;
  readonly space?: 'tight' | 'normal' | 'loose';
  readonly as?: 'section' | 'div';
  readonly ariaLabelledBy?: string;
}

const tones = {
  white: 'bg-white text-ink',
  paper: 'bg-paper text-ink',
  canvas: 'bg-canvas text-ink',
  ink: 'bg-ink text-white',
} as const;

const spacing = {
  tight: 'py-12 sm:py-14',
  normal: 'py-16 sm:py-20 lg:py-24',
  loose: 'py-20 sm:py-28 lg:py-32',
} as const;

export function Section({
  children,
  className,
  tone = 'white',
  id,
  space = 'normal',
  as: Tag = 'section',
  ariaLabelledBy,
}: SectionProps) {
  return (
    <Tag
      id={id}
      aria-labelledby={ariaLabelledBy}
      className={cn(tones[tone], spacing[space], className)}
    >
      <div className="container-page">{children}</div>
    </Tag>
  );
}

interface SectionHeadingProps {
  readonly eyebrow?: string;
  readonly title: React.ReactNode;
  readonly lede?: React.ReactNode;
  readonly id?: string;
  readonly tone?: 'light' | 'dark';
  readonly align?: 'start' | 'center';
  readonly className?: string;
  /** Rendered to the right of the heading on wide screens. */
  readonly action?: React.ReactNode;
  readonly level?: 2 | 3;
}

export function SectionHeading({
  eyebrow,
  title,
  lede,
  id,
  tone = 'light',
  align = 'start',
  className,
  action,
  level = 2,
}: SectionHeadingProps) {
  const Heading = level === 2 ? 'h2' : 'h3';

  return (
    <Reveal
      className={cn(
        'flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between',
        align === 'center' && 'items-center text-center lg:flex-col',
        className,
      )}
    >
      <div className={cn('max-w-2xl', align === 'center' && 'mx-auto')}>
        {eyebrow && (
          <p className={cn('text-eyebrow mb-3', tone === 'dark' && 'text-white/55')}>
            {eyebrow}
          </p>
        )}
        <Heading
          id={id}
          className={cn(
            'text-display text-[1.75rem] sm:text-[2.125rem] lg:text-[2.5rem]',
            tone === 'dark' ? 'text-white' : 'text-ink',
          )}
        >
          {title}
        </Heading>
        {lede && (
          <p
            className={cn(
              'mt-4 text-[1.0625rem] leading-relaxed',
              tone === 'dark' ? 'text-white/70' : 'text-grey-strong',
            )}
          >
            {lede}
          </p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </Reveal>
  );
}
