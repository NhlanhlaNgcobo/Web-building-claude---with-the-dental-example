'use client';

import { useCallback, useState } from 'react';
import { cn } from '@/lib/cn';

/**
 * One-shot reveal on first scroll into view.
 *
 * Driven by IntersectionObserver rather than a scroll listener, and the
 * observer disconnects as soon as the element has been revealed, so there is
 * no ongoing work for the lifetime of the page. The transition itself moves
 * only opacity and transform, both compositor properties.
 *
 * Anyone who has asked for reduced motion gets the content immediately with no
 * transition, which is handled once in globals.css rather than branched here.
 *
 * The observer is attached from a callback ref rather than an effect. That is
 * not a stylistic choice: a callback ref typed to HTMLElement can be passed to
 * any element, whereas a RefObject pinned to one element type cannot be shared
 * across the div, section, li and article this component renders. React 19
 * runs the returned function as the ref's cleanup.
 */
export function useRevealOnce() {
  const [revealed, setRevealed] = useState(false);

  const ref = useCallback((node: HTMLElement | null) => {
    if (!node) return;

    // Without IntersectionObserver, show the content rather than hide it.
    if (typeof IntersectionObserver === 'undefined') {
      setRevealed(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setRevealed(true);
          observer.disconnect();
        }
      },
      // Fires slightly before the element reaches the viewport, so the
      // transition has finished by the time it is properly in view.
      { rootMargin: '0px 0px -10% 0px', threshold: 0.01 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return { ref, revealed } as const;
}

interface RevealProps {
  readonly children: React.ReactNode;
  readonly className?: string;
  /** Stagger in milliseconds, for a short sequence of sibling reveals. */
  readonly delay?: number;
  readonly as?: 'div' | 'section' | 'li' | 'article';
}

export function Reveal({
  children,
  className,
  delay = 0,
  as: Tag = 'div',
}: RevealProps) {
  const { ref, revealed } = useRevealOnce();

  return (
    <Tag
      ref={ref}
      data-reveal=""
      data-revealed={revealed ? 'true' : 'false'}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
      className={cn(className)}
    >
      {children}
    </Tag>
  );
}
