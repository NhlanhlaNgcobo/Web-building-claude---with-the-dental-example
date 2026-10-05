'use client';

import Image from 'next/image';
import { ArrowRight, Users } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Button } from '@/components/ui/Button';
import { BLUR_PLACEHOLDER } from '@/data/images';
import { track } from '@/lib/analytics';
import type { DentistCardData } from '@/components/layout/DentistCard';

/**
 * Step two: who with.
 *
 * "First available" is offered first and is the honest default, because for a
 * routine appointment it genuinely gets most people seen sooner. Choosing a
 * named dentist narrows availability, and the copy says so rather than letting
 * the patient discover it at the calendar.
 *
 * The dentist is only provisionally chosen here. When "first available" is
 * selected, the server assigns a specific dentist at the moment the booking is
 * confirmed, which is what lets it fall through to a colleague if the first
 * choice is taken in the meantime.
 */
export function DentistStep({
  dentists,
  selected,
  onSelect,
  onContinue,
}: {
  readonly dentists: readonly DentistCardData[];
  readonly selected: string;
  readonly onSelect: (dentistId: string) => void;
  readonly onContinue: () => void;
}) {
  return (
    <div>
      <h2 className="text-[1.0625rem] font-semibold text-ink">
        Who would you like to see?
      </h2>
      <p className="mt-1 text-sm text-grey-strong">
        Choosing a specific dentist usually means waiting a little longer.
      </p>

      <fieldset className="mt-6">
        <legend className="sr-only">Choose a dentist</legend>

        <div className="flex flex-col gap-3">
          {/* Any available dentist */}
          <label
            className={cn(
              'flex cursor-pointer items-center gap-4 rounded-card border p-4',
              'transition-[border-color,background-color] duration-[--duration-feedback] ease-out',
              'has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-blue',
              selected === 'any'
                ? 'border-blue bg-blue-tint'
                : 'border-line bg-white hover:border-blue/40',
            )}
          >
            <input
              type="radio"
              name="dentist"
              value="any"
              checked={selected === 'any'}
              onChange={() => {
                onSelect('any');
                track({ name: 'dentist_selected', dentistId: 'any' });
              }}
              className="size-4 shrink-0 accent-blue"
            />
            <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-blue-soft text-blue-deep">
              <Users className="size-5" aria-hidden="true" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[0.9375rem] font-semibold text-ink">
                First available dentist
              </span>
              <span className="mt-0.5 block text-[0.8125rem] text-grey-strong">
                Usually the soonest appointment. We confirm who you are seeing
                when you book.
              </span>
            </span>
          </label>

          {dentists.map((dentist) => {
            const active = selected === dentist.id;
            return (
              <label
                key={dentist.id}
                className={cn(
                  'flex cursor-pointer items-center gap-4 rounded-card border p-4',
                  'transition-[border-color,background-color] duration-[--duration-feedback] ease-out',
                  'has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-blue',
                  active
                    ? 'border-blue bg-blue-tint'
                    : 'border-line bg-white hover:border-blue/40',
                )}
              >
                <input
                  type="radio"
                  name="dentist"
                  value={dentist.id}
                  checked={active}
                  onChange={() => {
                    onSelect(dentist.id);
                    track({ name: 'dentist_selected', dentistId: dentist.id });
                  }}
                  className="size-4 shrink-0 accent-blue"
                />
                <span className="relative size-12 shrink-0 overflow-hidden rounded-full bg-canvas-deep">
                  <Image
                    src={dentist.photoUrl}
                    alt=""
                    fill
                    sizes="48px"
                    placeholder="blur"
                    blurDataURL={BLUR_PLACEHOLDER}
                    className="object-cover"
                  />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[0.9375rem] font-semibold text-ink">
                    {dentist.title} {dentist.firstName} {dentist.lastName}
                  </span>
                  <span className="mt-0.5 block text-[0.8125rem] text-grey-strong">
                    {dentist.role}
                  </span>
                  <span className="mt-1.5 block truncate text-xs text-grey">
                    {dentist.focusAreas.slice(0, 3).join(', ')}
                  </span>
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>

      <div className="mt-6">
        <Button onClick={onContinue}>
          Continue
          <ArrowRight className="size-4" aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}
