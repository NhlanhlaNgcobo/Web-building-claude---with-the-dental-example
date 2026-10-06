'use client';

import { Accordion } from '@base-ui/react/accordion';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/cn';
import type { Faq } from '@/types';

/**
 * FAQ list.
 *
 * Built on Base UI's Accordion so the keyboard behaviour, the heading
 * semantics and the aria-expanded wiring are the library's rather than
 * hand-rolled.
 *
 * The panel transitions its height, which is a layout property. That is a
 * deliberate exception: the surface is a single small, isolated panel, the
 * transition is one-shot in response to a click, and height is the mechanism
 * the component exposes through its own --accordion-panel-height variable.
 * Replacing it with a transform would mean reimplementing the open and close
 * behaviour, which is exactly the thing not worth hand-rolling. The icon moves
 * on transform only.
 */
export function FaqAccordion({
  faqs,
  className,
  tone = 'light',
}: {
  readonly faqs: readonly Faq[];
  readonly className?: string;
  readonly tone?: 'light' | 'dark';
}) {
  if (faqs.length === 0) return null;

  const dark = tone === 'dark';

  return (
    <Accordion.Root
      className={cn(
        'divide-y',
        dark ? 'divide-line-dark' : 'divide-line',
        className,
      )}
    >
      {faqs.map((faq) => (
        <Accordion.Item key={faq.question} className="group">
          <Accordion.Header>
            <Accordion.Trigger
              className={cn(
                'flex w-full items-start justify-between gap-6 py-5 text-left',
                'transition-colors duration-[--duration-feedback] ease-out',
                'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red',
                dark
                  ? 'text-white hover:text-white/75'
                  : 'text-ink hover:text-red',
              )}
            >
              <span className="text-[1.0625rem] font-medium leading-snug">
                {faq.question}
              </span>
              <Plus
                aria-hidden="true"
                className={cn(
                  'mt-0.5 size-5 shrink-0',
                  'transition-transform duration-[--duration-feedback] ease-out',
                  'group-data-[panel-open]:rotate-45',
                  dark ? 'text-white/50' : 'text-grey',
                )}
              />
            </Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Panel
            className={cn(
              'h-[var(--accordion-panel-height)] overflow-hidden',
              'transition-[height] duration-[--duration-feedback] ease-out',
              'data-starting-style:h-0 data-ending-style:h-0',
            )}
          >
            <p
              className={cn(
                'max-w-2xl pb-5 pr-10 text-[0.9375rem] leading-relaxed',
                dark ? 'text-white/70' : 'text-grey-strong',
              )}
            >
              {faq.answer}
            </p>
          </Accordion.Panel>
        </Accordion.Item>
      ))}
    </Accordion.Root>
  );
}
