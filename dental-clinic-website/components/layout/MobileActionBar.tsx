'use client';

import Link from 'next/link';
import { CalendarPlus, MessageCircle, Phone } from 'lucide-react';
import { clinic, whatsappIntents, whatsappLink } from '@/data/clinic';
import { track } from '@/lib/analytics';

/**
 * Fixed action bar on small screens: call, WhatsApp, book.
 *
 * Three equal targets, each at least 44 pixels tall, sitting above the home
 * indicator via the safe area inset. Deliberately restrained: a thin bar with a
 * single hairline border rather than a floating pill, so it reads as part of
 * the interface rather than an advert stuck to the screen.
 */
export function MobileActionBar() {
  return (
    <>
      <div
        className="safe-bottom fixed inset-x-0 bottom-0 z-mobilebar border-t border-line bg-white/92 backdrop-blur-[18px] lg:hidden"
        role="group"
        aria-label="Contact and booking"
      >
        <div className="grid grid-cols-3">
          <a
            href={`tel:${clinic.telephone.e164}`}
            onClick={() => track({ name: 'contact_clicked', channel: 'telephone' })}
            className="flex min-h-14 flex-col items-center justify-center gap-1 text-[0.6875rem] font-medium text-charcoal transition-colors duration-[--duration-feedback] active:bg-canvas focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-blue"
          >
            <Phone className="size-[1.125rem]" aria-hidden="true" />
            Call
          </a>

          <a
            href={whatsappLink(whatsappIntents.appointment)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => track({ name: 'whatsapp_clicked', intent: 'appointment' })}
            className="flex min-h-14 flex-col items-center justify-center gap-1 border-x border-line text-[0.6875rem] font-medium text-charcoal transition-colors duration-[--duration-feedback] active:bg-canvas focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-blue"
          >
            <MessageCircle className="size-[1.125rem]" aria-hidden="true" />
            WhatsApp
          </a>

          <Link
            href="/book"
            className="flex min-h-14 flex-col items-center justify-center gap-1 bg-blue text-[0.6875rem] font-semibold text-white transition-colors duration-[--duration-feedback] active:bg-blue-deep focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-white"
          >
            <CalendarPlus className="size-[1.125rem]" aria-hidden="true" />
            Book
          </Link>
        </div>
      </div>

      {/* Reserve the bar's height so fixed positioning never covers the end of
          the page content. */}
      <div className="safe-bottom h-14 lg:hidden" aria-hidden="true" />
    </>
  );
}
