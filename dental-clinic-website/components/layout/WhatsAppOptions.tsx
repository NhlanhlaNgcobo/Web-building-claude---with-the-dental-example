'use client';

import { ArrowUpRight, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/cn';
import { clinic, whatsappIntents, whatsappLink } from '@/data/clinic';
import { track } from '@/lib/analytics';

/**
 * WhatsApp entry points.
 *
 * WhatsApp is how a great many South Africans would rather contact a business,
 * so it is a proper option rather than an afterthought. It is also not a
 * floating bubble following the reader down the page: it lives on the contact
 * page, in the footer area of the mobile action bar, and nowhere else.
 *
 * Each option prefills a different opening message, so reception can see what
 * the conversation is about before reading it. These are plain wa.me links,
 * which need no WhatsApp Business API account to work.
 */
const options = [
  {
    intent: 'reception' as const,
    label: 'Message reception',
    detail: 'General questions, directions, anything administrative.',
  },
  {
    intent: 'appointment' as const,
    label: 'Appointment enquiry',
    detail: 'Moving something, or a time you cannot find online.',
  },
  {
    intent: 'question' as const,
    label: 'Ask a question',
    detail: 'About a treatment, or whether we can help with something.',
  },
];

export function WhatsAppOptions({ className }: { readonly className?: string }) {
  return (
    <ul className={cn('flex flex-col gap-2.5', className)}>
      {options.map((option) => (
        <li key={option.intent}>
          <a
            href={whatsappLink(whatsappIntents[option.intent])}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() =>
              track({ name: 'whatsapp_clicked', intent: option.intent })
            }
            className={cn(
              'group flex items-center gap-4 rounded-card border border-line bg-white p-4',
              'transition-[border-color,background-color] duration-[--duration-feedback] ease-out',
              'hover:border-blue hover:bg-blue-tint',
              'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue',
            )}
          >
            <span className="flex size-10 shrink-0 items-center justify-center rounded-panel bg-blue-soft text-blue-deep">
              <MessageCircle className="size-5" aria-hidden="true" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[0.9375rem] font-medium text-ink">
                {option.label}
              </span>
              <span className="mt-0.5 block text-[0.8125rem] text-grey-strong">
                {option.detail}
              </span>
            </span>
            <ArrowUpRight
              className="size-4 shrink-0 text-grey transition-transform duration-[--duration-feedback] ease-out group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
              aria-hidden="true"
            />
            <span className="sr-only">, opens WhatsApp in a new tab</span>
          </a>
        </li>
      ))}
      <li className="mt-1 text-xs text-grey-strong">
        WhatsApp number{' '}
        <span className="tabular-nums">{clinic.whatsapp.display}</span>. Replies
        during opening hours.
      </li>
    </ul>
  );
}
