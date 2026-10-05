'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useMemo, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useBookingState, type BookingStep } from '@/hooks/useBookingState';
import { track } from '@/lib/analytics';
import type {
  BookingConfirmationDto,
  ServiceSummaryDto,
  SlotDto,
} from '@/types';
import type { DentistCardData } from '@/components/layout/DentistCard';
import { DateTimeStep } from './DateTimeStep';
import { DentistStep } from './DentistStep';
import { DetailsStep, emptyDetails, type DetailsFormValues } from './DetailsStep';
import { PaymentStep } from './PaymentStep';
import { ServiceStep } from './ServiceStep';
import { SlotTakenNotice } from './SlotTakenNotice';
import { StepIndicator } from './StepIndicator';

/**
 * The booking journey.
 *
 * Step position and every selection live in the URL via useBookingState, so
 * going back never loses the patient's progress and a half-finished booking
 * survives a reload. Only the details form and the submission state are held
 * in component state, because neither belongs in a shareable URL.
 */

interface ApiError {
  readonly error: { readonly code: string; readonly message: string };
  readonly alternatives?: readonly SlotDto[];
}

export function BookingWizard({
  services,
  dentists,
  canTakePaymentOnline,
}: {
  readonly services: readonly ServiceSummaryDto[];
  readonly dentists: readonly DentistCardData[];
  readonly canTakePaymentOnline: boolean;
}) {
  const router = useRouter();
  const { state, update, goToStep } = useBookingState();

  const [details, setDetails] = useState<DetailsFormValues>(emptyDetails);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [takenAlternatives, setTakenAlternatives] = useState<
    readonly SlotDto[] | null
  >(null);

  const service = useMemo(
    () => services.find((s) => s.slug === state.service) ?? null,
    [services, state.service],
  );

  /** Dentists who can actually perform the chosen appointment type. */
  const eligibleDentists = useMemo(() => {
    if (!service) return dentists;
    return dentists.filter((d) =>
      (service as ServiceSummaryDto & { eligibleDentistIds?: string[] })
        .eligibleDentistIds?.includes(d.id) ?? true,
    );
  }, [dentists, service]);

  const furthestReached: BookingStep = !state.service
    ? 'service'
    : state.date === null || state.time === null
      ? 'time'
      : 'payment';

  /* ---------------- Validation ---------------- */

  const validateDetails = useCallback((): boolean => {
    const next: Record<string, string> = {};
    if (details.firstName.trim().length === 0) {
      next.firstName = 'Enter your first name';
    }
    if (details.lastName.trim().length === 0) {
      next.lastName = 'Enter your surname';
    }
    // Mirrors the server rule in lib/validation/primitives.ts. The server is
    // still the authority; this exists so the patient gets the message without
    // a round trip.
    const mobileDigits = details.mobile.replace(/[^\d+]/g, '');
    const normalised = mobileDigits.startsWith('+27')
      ? mobileDigits
      : mobileDigits.startsWith('0')
        ? `+27${mobileDigits.slice(1)}`
        : mobileDigits.startsWith('27')
          ? `+${mobileDigits}`
          : mobileDigits;
    if (!/^\+27[6-8]\d{8}$/.test(normalised)) {
      next.mobile =
        'Enter a valid South African mobile number, for example 082 123 4567';
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(details.email.trim())) {
      next.email = 'Enter a valid email address';
    }
    if (!details.consentToContact) {
      next.consentToContact =
        'Please confirm we may contact you about this appointment';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }, [details]);

  /* ---------------- Submit ---------------- */

  const confirm = useCallback(async () => {
    if (!service || state.date === null || state.time === null) return;

    setSubmitting(true);
    setSubmitError(null);
    setTakenAlternatives(null);

    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service: service.slug,
          dentist: state.dentist,
          date: state.date,
          startMinutes: state.time,
          patient: {
            firstName: details.firstName.trim(),
            lastName: details.lastName.trim(),
            email: details.email.trim(),
            mobile: details.mobile.trim(),
            isExistingPatient: details.isExistingPatient,
            notes: details.notes.trim() || undefined,
            consentToContact: true,
          },
        }),
      });

      if (response.ok) {
        const confirmation = (await response.json()) as BookingConfirmationDto;
        track({
          name: 'booking_completed',
          serviceId: service.id,
          dentistId: state.dentist,
          depositType: service.depositType,
          isEmergency: service.isEmergency,
        });
        // Replace, so the back button does not return to a submitted form.
        router.replace(
          `/book/confirmed/${confirmation.reference}?token=${encodeURIComponent(confirmation.manageToken)}`,
        );
        return;
      }

      const body = (await response.json()) as ApiError;
      track({ name: 'booking_failed', reason: body.error?.code ?? 'unknown' });

      // A slot conflict is recoverable, so it gets its own treatment with
      // alternatives rather than a generic error message.
      if (
        response.status === 409 &&
        body.alternatives &&
        body.alternatives.length > 0
      ) {
        setTakenAlternatives(body.alternatives);
        setSubmitError(body.error.message);
      } else {
        setSubmitError(
          body.error?.message ??
            'We could not complete your booking. Please try again.',
        );
      }
    } catch {
      setSubmitError(
        'We could not reach the practice diary. Please check your connection and try again.',
      );
    } finally {
      setSubmitting(false);
    }
  }, [service, state.date, state.time, state.dentist, details, router]);

  /* ---------------- Render ---------------- */

  const selectedSlotLabel = useMemo(() => {
    if (state.time === null) return null;
    const hours = Math.floor(state.time / 60);
    const minutes = state.time % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  }, [state.time]);

  return (
    <div>
      <div className="border-b border-line pb-6">
        <StepIndicator
          current={state.step}
          furthestReached={furthestReached}
          onStepClick={goToStep}
        />
      </div>

      <div className="pt-8">
        {state.step === 'service' && (
          <ServiceStep
            services={services}
            selected={state.service}
            onSelect={(slug) =>
              update({ service: slug, step: 'dentist' }, { push: true })
            }
          />
        )}

        {state.step === 'dentist' && (
          <DentistStep
            dentists={eligibleDentists}
            selected={state.dentist}
            onSelect={(dentistId) =>
              // Changing dentist invalidates the chosen time, since
              // availability differs per dentist.
              update({ dentist: dentistId, time: null })
            }
            onContinue={() => goToStep('time')}
          />
        )}

        {state.step === 'time' && service && (
          <DateTimeStep
            serviceSlug={service.slug}
            dentistId={state.dentist}
            date={state.date}
            time={state.time}
            onSelectDate={(date) => update({ date, time: null })}
            onSelectTime={(minutes) => update({ time: String(minutes) })}
            onContinue={() => goToStep('details')}
          />
        )}

        {state.step === 'details' && (
          <DetailsStep
            values={details}
            errors={errors}
            onChange={(patch) => {
              setDetails((current) => ({ ...current, ...patch }));
              // Clear the error for a field as soon as it is edited.
              const touched = Object.keys(patch);
              setErrors((current) => {
                const next = { ...current };
                for (const key of touched) delete next[key];
                return next;
              });
            }}
            onContinue={() => {
              if (validateDetails()) {
                track({ name: 'booking_details_completed' });
                goToStep('payment');
              }
            }}
          />
        )}

        {state.step === 'payment' &&
          service &&
          state.date &&
          selectedSlotLabel && (
            <>
              {takenAlternatives && (
                <SlotTakenNotice
                  message={
                    submitError ??
                    'That appointment has just been booked. Please choose another available time.'
                  }
                  alternatives={takenAlternatives}
                  onChoose={(slot) => {
                    update({
                      date: slot.date,
                      time: String(slot.startMinutes),
                      dentist: slot.dentistId,
                    });
                    setTakenAlternatives(null);
                    setSubmitError(null);
                  }}
                  onPickAnother={() => {
                    setTakenAlternatives(null);
                    setSubmitError(null);
                    goToStep('time');
                  }}
                  className="mb-8"
                />
              )}

              <PaymentStep
                summary={{
                  service,
                  dateLabel: new Date(
                    `${state.date}T12:00:00`,
                  ).toLocaleDateString('en-ZA', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  }),
                  slot: {
                    date: state.date,
                    startMinutes: state.time!,
                    endMinutes: state.time! + service.durationMinutes,
                    startLabel: selectedSlotLabel,
                    endLabel: minutesToLabel(
                      state.time! + service.durationMinutes,
                    ),
                    startTime: '',
                    dentistId: state.dentist,
                    dentistName:
                      dentists.find((d) => d.id === state.dentist)
                        ? `${dentists.find((d) => d.id === state.dentist)!.title} ${dentists.find((d) => d.id === state.dentist)!.lastName}`
                        : 'First available dentist',
                    alternateDentistIds: [],
                  },
                }}
                canTakePaymentOnline={canTakePaymentOnline}
                submitting={submitting}
                error={takenAlternatives ? null : submitError}
                onConfirm={() => void confirm()}
              />
            </>
          )}
      </div>

      {state.step !== 'service' && (
        <div className="mt-10 border-t border-line pt-6">
          <Button
            variant="ghost"
            onClick={() => {
              const order: BookingStep[] = [
                'service',
                'dentist',
                'time',
                'details',
                'payment',
              ];
              const index = order.indexOf(state.step);
              goToStep(order[Math.max(index - 1, 0)]!);
            }}
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Back
          </Button>
        </div>
      )}
    </div>
  );
}

function minutesToLabel(minutes: number): string {
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
}
