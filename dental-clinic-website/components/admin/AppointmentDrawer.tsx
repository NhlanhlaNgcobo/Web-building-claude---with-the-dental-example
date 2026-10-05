'use client';

import { useState } from 'react';
import { AlertDialog } from '@base-ui/react/alert-dialog';
import { Dialog } from '@base-ui/react/dialog';
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Clock,
  Mail,
  Phone,
  Siren,
  UserX,
  Wallet,
  X,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { formatPrice } from '@/lib/currency';
import { APPOINTMENT_STATUS_LABELS } from '@/lib/domain/enums';
import type { DiaryAppointment } from '@/lib/admin/queries';

/**
 * Appointment detail and actions.
 *
 * Opened from the diary. Every action goes through the booking service rather
 * than writing to the database directly, so the status transition table and
 * the overlap rules apply identically to staff and to patients.
 *
 * Marking a patient as not having attended is destructive in the sense that it
 * goes on their record, so it is confirmed. Completing an appointment is not,
 * so it is one click.
 */
export function AppointmentDrawer({
  appointment,
  onClose,
  onChanged,
}: {
  readonly appointment: DiaryAppointment | null;
  readonly onClose: () => void;
  readonly onChanged: () => void;
}) {
  if (!appointment) return null;

  /**
   * Keyed on the appointment id, so selecting a different appointment
   * remounts the panel with fresh initial state. That replaces an effect that
   * copied the new appointment into state on every change, which caused a
   * cascading render and had to re-derive the form values anyway.
   */
  return (
    <DrawerBody
      key={appointment.id}
      appointment={appointment}
      onClose={onClose}
      onChanged={onChanged}
    />
  );
}

function DrawerBody({
  appointment,
  onClose,
  onChanged,
}: {
  readonly appointment: DiaryAppointment;
  readonly onClose: () => void;
  readonly onChanged: () => void;
}) {
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [internalNotes, setInternalNotes] = useState(
    appointment.internalNotes ?? '',
  );

  async function patch(body: unknown) {
    setWorking(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/admin/appointments/${appointment.id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        },
      );
      if (!response.ok) {
        const payload = (await response.json()) as {
          error?: { message?: string };
        };
        setError(payload.error?.message ?? 'That change could not be saved.');
        return false;
      }
      onChanged();
      return true;
    } catch {
      setError('Could not reach the server. Please try again.');
      return false;
    } finally {
      setWorking(false);
    }
  }

  const terminal =
    appointment.status === 'cancelled' ||
    appointment.status === 'completed' ||
    appointment.status === 'no_show';

  return (
    <Dialog.Root open onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-overlay min-h-dvh bg-black/55 transition-opacity duration-[--duration-feedback] data-starting-style:opacity-0 data-ending-style:opacity-0" />
        <Dialog.Popup className="fixed inset-y-0 right-0 z-modal flex w-[min(28rem,100vw)] flex-col border-l border-line-dark bg-charcoal transition-transform duration-200 ease-out data-starting-style:translate-x-full data-ending-style:translate-x-full">
          {/* Header */}
          <div className="flex items-start justify-between gap-4 border-b border-line-dark p-5">
            <div className="min-w-0">
              <Dialog.Title className="flex items-center gap-2 text-[1.0625rem] font-semibold text-white">
                {appointment.isEmergency && (
                  <Siren className="size-4 shrink-0 text-[#ff9c93]" aria-label="Urgent" />
                )}
                <span className="truncate">{appointment.patient.name}</span>
              </Dialog.Title>
              <Dialog.Description className="mt-1 text-[0.8125rem] text-white/55">
                {appointment.service.name} with {appointment.dentist.name}
              </Dialog.Description>
            </div>
            <Dialog.Close
              aria-label="Close"
              className="flex size-9 shrink-0 items-center justify-center rounded-panel text-white/60 transition-colors duration-[--duration-feedback] hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              <X className="size-4" aria-hidden="true" />
            </Dialog.Close>
          </div>

          <div className="flex-1 overflow-y-auto p-5">
            {/* Status */}
            <span
              className={cn(
                'inline-flex items-center rounded-panel px-2.5 py-1 text-[0.6875rem] font-semibold uppercase',
                appointment.status === 'confirmed' &&
                  'bg-[--color-positive]/20 text-[#75e0a7]',
                appointment.status === 'pending' &&
                  'bg-[--color-caution]/20 text-[#fdb022]',
                appointment.status === 'completed' && 'bg-white/10 text-white/70',
                (appointment.status === 'cancelled' ||
                  appointment.status === 'no_show') &&
                  'bg-[--color-critical]/20 text-[#ff9c93]',
              )}
              style={{ letterSpacing: '0.05em' }}
            >
              {APPOINTMENT_STATUS_LABELS[appointment.status]}
            </span>

            {/* Detail */}
            <dl className="mt-5 flex flex-col gap-px overflow-hidden rounded-panel">
              {[
                {
                  label: 'Time',
                  value: `${appointment.startLabel} to ${appointment.endLabel}`,
                },
                {
                  label: 'Duration',
                  value: `${appointment.durationMinutes} minutes`,
                },
                { label: 'Reference', value: appointment.reference },
                {
                  label: 'Booked via',
                  value:
                    appointment.source === 'web'
                      ? 'Online'
                      : appointment.source === 'phone'
                        ? 'Telephone'
                        : appointment.source === 'walk_in'
                          ? 'Walk in'
                          : 'Staff',
                },
                {
                  label: 'Patient',
                  value: appointment.patient.isExistingPatient
                    ? 'Existing'
                    : 'New',
                },
              ].map((row) => (
                <div
                  key={row.label}
                  className="flex items-baseline justify-between gap-4 bg-white/[0.05] px-3.5 py-2.5"
                >
                  <dt className="text-[0.75rem] text-white/50">{row.label}</dt>
                  <dd className="text-right text-[0.8125rem] font-medium tabular-nums text-white">
                    {row.value}
                  </dd>
                </div>
              ))}
            </dl>

            {/* Contact */}
            <div className="mt-5 flex flex-col gap-2">
              <a
                href={`tel:${appointment.patient.mobile}`}
                className="flex items-center gap-2.5 rounded-panel bg-white/[0.05] px-3.5 py-2.5 text-[0.8125rem] text-white transition-colors duration-[--duration-feedback] hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                <Phone className="size-3.5 shrink-0 text-blue-soft" aria-hidden="true" />
                <span className="tabular-nums">{appointment.patient.mobile}</span>
              </a>
              <a
                href={`mailto:${appointment.patient.email}`}
                className="flex items-center gap-2.5 rounded-panel bg-white/[0.05] px-3.5 py-2.5 text-[0.8125rem] text-white transition-colors duration-[--duration-feedback] hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                <Mail className="size-3.5 shrink-0 text-blue-soft" aria-hidden="true" />
                <span className="truncate">{appointment.patient.email}</span>
              </a>
            </div>

            {/* Deposit */}
            {appointment.depositAmountCents !== null && (
              <div className="mt-5 rounded-panel border border-line-dark p-3.5">
                <p className="flex items-center gap-2 text-[0.8125rem] font-medium text-white">
                  <Wallet className="size-3.5 text-blue-soft" aria-hidden="true" />
                  Deposit {formatPrice(appointment.depositAmountCents)}
                  <span className="text-white/50">
                    ({appointment.depositStatus.replace('_', ' ')})
                  </span>
                </p>
                {appointment.depositStatus === 'unpaid' && (
                  <button
                    type="button"
                    disabled={working}
                    onClick={() => void patch({ action: 'deposit_paid' })}
                    className="mt-3 flex h-9 items-center gap-2 rounded-panel bg-white px-3 text-[0.8125rem] font-semibold text-ink transition-colors duration-[--duration-feedback] hover:bg-canvas disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                  >
                    <Check className="size-3.5" aria-hidden="true" />
                    Mark deposit received
                  </button>
                )}
              </div>
            )}

            {/* Patient note */}
            {appointment.notes && (
              <div className="mt-5 rounded-panel bg-blue/10 p-3.5">
                <p className="text-[0.6875rem] uppercase text-white/45">
                  From the patient
                </p>
                <p className="mt-1.5 text-[0.8125rem] leading-relaxed text-white/85">
                  {appointment.notes}
                </p>
              </div>
            )}

            {/* Staff notes */}
            <div className="mt-5">
              <label
                htmlFor="internal-notes"
                className="block text-[0.8125rem] font-medium text-white/80"
              >
                Staff notes
              </label>
              <textarea
                id="internal-notes"
                rows={3}
                value={internalNotes}
                onChange={(event) => setInternalNotes(event.target.value)}
                className="mt-2 w-full rounded-panel border border-line-dark-strong bg-white/[0.06] px-3 py-2.5 text-[0.8125rem] leading-relaxed text-white placeholder:text-white/30 focus:border-blue focus:outline-none"
                placeholder="Not visible to the patient."
              />
              <button
                type="button"
                disabled={working || internalNotes === (appointment.internalNotes ?? '')}
                onClick={() =>
                  void patch({ action: 'notes', internalNotes })
                }
                className="mt-2 flex h-9 items-center rounded-panel border border-line-dark-strong px-3 text-[0.8125rem] font-medium text-white transition-colors duration-[--duration-feedback] hover:bg-white/10 disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                Save note
              </button>
            </div>

            {error && (
              <div
                role="alert"
                className="mt-5 flex items-start gap-2.5 rounded-panel border border-[--color-critical] bg-[--color-critical]/10 p-3.5"
              >
                <AlertCircle
                  className="mt-0.5 size-4 shrink-0 text-[#ff9c93]"
                  aria-hidden="true"
                />
                <p className="text-[0.8125rem] leading-relaxed text-[#ff9c93]">
                  {error}
                </p>
              </div>
            )}
          </div>

          {/* Actions */}
          {!terminal && (
            <div className="border-t border-line-dark p-5">
              <div className="flex flex-col gap-2">
                {appointment.status === 'pending' && (
                  <ActionButton
                    onClick={() =>
                      void patch({ action: 'status', status: 'confirmed' })
                    }
                    disabled={working}
                    icon={<CheckCircle2 className="size-4" aria-hidden="true" />}
                    label="Confirm appointment"
                    tone="primary"
                  />
                )}

                <ActionButton
                  onClick={() =>
                    void patch({ action: 'status', status: 'completed' })
                  }
                  disabled={working}
                  icon={<Check className="size-4" aria-hidden="true" />}
                  label="Mark completed"
                  tone="primary"
                />

                <div className="grid grid-cols-2 gap-2">
                  <ConfirmAction
                    disabled={working}
                    icon={<UserX className="size-4" aria-hidden="true" />}
                    label="Did not attend"
                    title="Mark as not attended?"
                    description={`This records that ${appointment.patient.name} did not attend their ${appointment.startLabel} appointment. It stays on their record and the time is not returned to availability, because the chair time was held.`}
                    confirmLabel="Mark as not attended"
                    onConfirm={() =>
                      void patch({ action: 'status', status: 'no_show' })
                    }
                  />
                  <ConfirmAction
                    disabled={working}
                    icon={<Clock className="size-4" aria-hidden="true" />}
                    label="Cancel"
                    title="Cancel this appointment?"
                    description={`The ${appointment.startLabel} slot will be returned to availability immediately and may be taken by another patient. Contact ${appointment.patient.name} on ${appointment.patient.mobile} if they do not know yet.`}
                    confirmLabel="Cancel appointment"
                    onConfirm={() =>
                      void patch({ action: 'status', status: 'cancelled' })
                    }
                  />
                </div>
              </div>
            </div>
          )}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function ActionButton({
  onClick,
  disabled,
  icon,
  label,
  tone,
}: {
  readonly onClick: () => void;
  readonly disabled: boolean;
  readonly icon: React.ReactNode;
  readonly label: string;
  readonly tone: 'primary' | 'ghost';
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'flex h-11 items-center justify-center gap-2 rounded-panel text-sm font-semibold',
        'transition-colors duration-[--duration-feedback] ease-out',
        'disabled:opacity-50',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white',
        tone === 'primary'
          ? 'bg-white text-ink hover:bg-canvas'
          : 'border border-line-dark-strong text-white hover:bg-white/10',
      )}
    >
      {icon}
      {label}
    </button>
  );
}

/** A destructive action behind an AlertDialog, as these cannot be undone. */
function ConfirmAction({
  disabled,
  icon,
  label,
  title,
  description,
  confirmLabel,
  onConfirm,
}: {
  readonly disabled: boolean;
  readonly icon: React.ReactNode;
  readonly label: string;
  readonly title: string;
  readonly description: string;
  readonly confirmLabel: string;
  readonly onConfirm: () => void;
}) {
  return (
    <AlertDialog.Root>
      <AlertDialog.Trigger
        disabled={disabled}
        className="flex h-11 items-center justify-center gap-2 rounded-panel border border-line-dark-strong text-[0.8125rem] font-medium text-white/80 transition-colors duration-[--duration-feedback] hover:border-[--color-critical] hover:bg-[--color-critical]/10 hover:text-[#ff9c93] disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
      >
        {icon}
        {label}
      </AlertDialog.Trigger>
      <AlertDialog.Portal>
        <AlertDialog.Backdrop className="fixed inset-0 z-overlay min-h-dvh bg-black/60 transition-opacity duration-[--duration-feedback] data-starting-style:opacity-0 data-ending-style:opacity-0" />
        <AlertDialog.Popup className="fixed left-1/2 top-1/2 z-modal w-[min(28rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 rounded-card border border-line-dark bg-charcoal p-6 transition-[opacity,transform] duration-[--duration-feedback] ease-out data-starting-style:scale-[0.98] data-starting-style:opacity-0 data-ending-style:scale-[0.98] data-ending-style:opacity-0">
          <AlertDialog.Title className="text-[1.0625rem] font-semibold text-white">
            {title}
          </AlertDialog.Title>
          <AlertDialog.Description className="mt-2 text-sm leading-relaxed text-white/65">
            {description}
          </AlertDialog.Description>
          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
            <AlertDialog.Close className="inline-flex h-11 items-center justify-center rounded-panel border border-line-dark-strong px-5 text-sm font-medium text-white transition-colors duration-[--duration-feedback] hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
              Keep as it is
            </AlertDialog.Close>
            <AlertDialog.Close
              onClick={onConfirm}
              className="inline-flex h-11 items-center justify-center rounded-panel bg-[--color-critical] px-5 text-sm font-semibold text-white transition-[filter] duration-[--duration-feedback] hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              {confirmLabel}
            </AlertDialog.Close>
          </div>
        </AlertDialog.Popup>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
