import 'server-only';

import { prisma, type PrismaTransaction } from '@/lib/db';
import { computeSlots } from '@/lib/availability/compute';
import { loadAvailabilityInputs, loadService } from '@/lib/availability/loader';
import { findNextAvailable } from '@/lib/availability/service';
import {
  formatLocalDateLong,
  formatLocalMinutes,
  toInstant,
  todayLocalDate,
} from '@/lib/availability/tz';
import type { LocalDate, LocalMinutes } from '@/lib/availability/types';
import {
  ACTIVE_APPOINTMENT_STATUSES,
  APPOINTMENT_TRANSITIONS,
  PATIENT_CANCELLABLE_STATUSES,
  PATIENT_RESCHEDULABLE_STATUSES,
  type AppointmentStatus,
  type BookingSource,
  type DepositStatus,
  type DepositType,
} from '@/lib/domain/enums';
import { clinic } from '@/data/clinic';
import type { BookingConfirmationDto, SlotDto } from '@/types';
import {
  BookingNotFoundError,
  CancellationWindowClosedError,
  InvalidTransitionError,
  SlotInvalidError,
  SlotTakenError,
  BookingError,
} from './errors';
import { generateAppointmentReference, normalizeReference } from './reference';
import { assertManageToken, createManageToken } from './token';
import { normalizeEmail, toE164ZA } from '@/lib/validation/primitives';
import { invalidateAvailability } from '@/lib/cache/tags';

/**
 * Booking write operations.
 *
 * ---------------------------------------------------------------------------
 * How double booking is prevented
 * ---------------------------------------------------------------------------
 *
 * Availability is validated twice, and the second check is the one that counts:
 *
 *   1. When slots are listed, so the patient is only ever shown real options.
 *   2. Again inside an interactive transaction, immediately before the row is
 *      inserted. The client's chosen slot is treated as a hint with no
 *      authority whatsoever: the server recomputes availability from the live
 *      diary and rejects anything that does not appear in it.
 *
 * The final check runs the same pure engine as step one, then performs a direct
 * overlap probe against the database. If the slot has gone, a SlotTakenError is
 * thrown carrying freshly computed alternatives, so the interface can offer
 * other times instead of a dead end.
 *
 * SQLite serialises writes, so on the development database the transactional
 * re-check is genuinely sufficient: two concurrent bookings cannot interleave
 * between the probe and the insert. A multi-connection PostgreSQL deployment
 * needs a database-level guarantee as well, because there the two transactions
 * can run truly concurrently. See "Moving to PostgreSQL" in README.md for the
 * exclusion constraint that closes that window.
 */

/* ------------------------------------------------------------------ */
/* Shared helpers                                                      */
/* ------------------------------------------------------------------ */

type Db = typeof prisma | PrismaTransaction;

/**
 * A direct overlap probe against the diary.
 *
 * Half-open interval logic, identical to lib/availability/overlap.ts:
 * an existing appointment conflicts when it starts before our end AND ends
 * after our start. Back-to-back appointments therefore do not collide.
 */
async function findConflictingAppointment(
  db: Db,
  args: {
    dentistId: string;
    start: Date;
    end: Date;
    excludeAppointmentId?: string;
  },
): Promise<{ id: string } | null> {
  return db.appointment.findFirst({
    where: {
      dentistId: args.dentistId,
      status: { in: [...ACTIVE_APPOINTMENT_STATUSES] },
      startTime: { lt: args.end },
      endTime: { gt: args.start },
      ...(args.excludeAppointmentId
        ? { id: { not: args.excludeAppointmentId } }
        : {}),
    },
    select: { id: true },
  });
}

/** Also probe blocked periods, which the admin diary can add at any moment. */
async function findConflictingBlock(
  db: Db,
  args: { dentistId: string; start: Date; end: Date },
): Promise<{ id: string } | null> {
  return db.blockedTime.findFirst({
    where: {
      OR: [{ dentistId: args.dentistId }, { dentistId: null }],
      startTime: { lt: args.end },
      endTime: { gt: args.start },
    },
    select: { id: true },
  });
}

/** Freshly computed alternatives, used to make a failure recoverable. */
async function alternativesFor(args: {
  serviceId: string;
  dentistId: string | 'any';
  fromDate: LocalDate;
  excludeAppointmentId?: string;
}): Promise<readonly SlotDto[]> {
  try {
    const result = await findNextAvailable({
      serviceId: args.serviceId,
      dentistId: args.dentistId,
      fromDate: args.fromDate,
      count: 4,
      excludeAppointmentId: args.excludeAppointmentId,
    });
    return result.slots;
  } catch {
    // A failure to suggest alternatives must never mask the original error.
    return [];
  }
}

/** Derive the deposit state implied by a service's policy. */
function depositStateFor(service: {
  depositType: string;
  depositAmountCents: number | null;
}): { depositType: DepositType; depositAmountCents: number | null; depositStatus: DepositStatus } {
  const depositType = service.depositType as DepositType;
  if (depositType === 'none') {
    return { depositType, depositAmountCents: null, depositStatus: 'not_required' };
  }
  return {
    depositType,
    depositAmountCents: service.depositAmountCents,
    depositStatus: 'unpaid',
  };
}

/* ------------------------------------------------------------------ */
/* Create                                                             */
/* ------------------------------------------------------------------ */

export interface CreateBookingInput {
  readonly serviceId: string;
  readonly dentistId: string | 'any';
  readonly date: LocalDate;
  readonly startMinutes: LocalMinutes;
  readonly patient: {
    readonly firstName: string;
    readonly lastName: string;
    readonly email: string;
    readonly mobile: string;
    readonly isExistingPatient: boolean;
  };
  readonly notes?: string;
  readonly source?: BookingSource;
  /**
   * Staff only. Bypasses policy rules such as opening hours, lunch and lead
   * time so reception can fit someone in, but never bypasses the overlap
   * check. Policy is negotiable; two patients in one chair is not.
   */
  readonly overrideAvailability?: boolean;
  readonly now?: Date;
}

export async function createBooking(
  input: CreateBookingInput,
): Promise<BookingConfirmationDto> {
  const now = input.now ?? new Date();

  const service = await loadService(input.serviceId);
  if (!service) {
    throw new BookingError('SERVICE_UNAVAILABLE', 'That appointment type is not available.', {
      status: 400,
    });
  }
  if (!service.isBookableOnline && !input.overrideAvailability) {
    throw new BookingError(
      'SERVICE_UNAVAILABLE',
      'That appointment type cannot be booked online. Please phone the practice.',
      { status: 400 },
    );
  }

  const result = await prisma.$transaction(
    async (tx) => {
      // Re-derive availability from the live diary inside the transaction.
      // Whatever the client sent is only a hint.
      const [liveInput] = await loadAvailabilityInputs({
        dates: [input.date],
        serviceId: input.serviceId,
        dentistId: input.dentistId,
        now,
        db: tx,
      });
      if (!liveInput) throw new SlotInvalidError();

      const day = computeSlots(liveInput);

      // Candidate dentists at the requested time, in deterministic preference
      // order. For an 'any dentist' request this is the slot's own resolved
      // dentist followed by its recorded alternates, which lets us fall
      // through if the first choice was taken moments ago.
      let candidateDentistIds: string[];
      const offered = day.slots.find((s) => s.startMinutes === input.startMinutes);

      if (input.overrideAvailability) {
        // Staff override: skip the policy rules but still require a real,
        // eligible dentist to be named.
        candidateDentistIds =
          input.dentistId === 'any'
            ? liveInput.dentists.map((d) => d.dentistId)
            : [input.dentistId];
      } else if (!offered) {
        throw new SlotInvalidError(
          `That time is no longer available on ${formatLocalDateLong(input.date)}. Please choose another available time.`,
          await alternativesFor({
            serviceId: input.serviceId,
            dentistId: input.dentistId,
            fromDate: input.date,
          }),
        );
      } else if (input.dentistId === 'any') {
        candidateDentistIds = [offered.dentistId, ...offered.alternateDentistIds];
      } else {
        candidateDentistIds = [input.dentistId];
      }

      if (candidateDentistIds.length === 0) {
        throw new BookingError(
          'DENTIST_INELIGIBLE',
          'No dentist at the practice offers that appointment type.',
          { status: 400 },
        );
      }

      const start = toInstant(input.date, input.startMinutes);
      const serviceEnd = toInstant(
        input.date,
        input.startMinutes + service.durationMinutes,
      );
      const end = toInstant(
        input.date,
        input.startMinutes + service.durationMinutes + service.bufferAfterMinutes,
      );

      // The decisive check. Walk the candidates and take the first whose diary
      // is genuinely clear right now.
      let assignedDentistId: string | null = null;
      for (const dentistId of candidateDentistIds) {
        const [conflict, block] = await Promise.all([
          findConflictingAppointment(tx, { dentistId, start, end }),
          findConflictingBlock(tx, { dentistId, start, end }),
        ]);
        if (!conflict && !block) {
          assignedDentistId = dentistId;
          break;
        }
      }

      if (assignedDentistId === null) {
        throw new SlotTakenError(
          await alternativesFor({
            serviceId: input.serviceId,
            dentistId: input.dentistId,
            fromDate: input.date,
          }),
        );
      }

      // Find or create the patient. Matching is conservative on purpose: a
      // duplicate patient record is recoverable, a wrongly merged clinical
      // history is not. Families legitimately share an email and a mobile.
      const emailNormalized = normalizeEmail(input.patient.email);
      const mobileNormalized = toE164ZA(input.patient.mobile);

      const existingPatient = await tx.patient.findFirst({
        where: {
          emailNormalized,
          mobileNormalized,
          firstName: input.patient.firstName,
          lastName: input.patient.lastName,
        },
        select: { id: true },
      });

      const patientId =
        existingPatient?.id ??
        (
          await tx.patient.create({
            data: {
              firstName: input.patient.firstName,
              lastName: input.patient.lastName,
              email: input.patient.email,
              emailNormalized,
              mobile: input.patient.mobile,
              mobileNormalized,
              isExistingPatient: input.patient.isExistingPatient,
            },
            select: { id: true },
          })
        ).id;

      const deposit = depositStateFor(service);

      // A required deposit leaves the appointment pending, which still holds
      // the slot because pending is an occupying status. Anything else is
      // confirmed immediately.
      const status: AppointmentStatus =
        deposit.depositType === 'required' ? 'pending' : 'confirmed';

      // Retry on the unique reference constraint. At six characters from a
      // thirty character alphabet a collision is vanishingly unlikely, but the
      // cost of handling it is one loop.
      let appointment: Awaited<ReturnType<typeof tx.appointment.create>> | null = null;
      for (let attempt = 0; attempt < 5; attempt += 1) {
        try {
          appointment = await tx.appointment.create({
            data: {
              reference: generateAppointmentReference(),
              patientId,
              dentistId: assignedDentistId,
              serviceId: service.id,
              startTime: start,
              serviceEndTime: serviceEnd,
              endTime: end,
              status,
              depositType: deposit.depositType,
              depositAmountCents: deposit.depositAmountCents,
              depositStatus: deposit.depositStatus,
              notes: input.notes ?? null,
              source: input.source ?? 'web',
              isEmergency: service.isEmergency,
            },
          });
          break;
        } catch (error) {
          if (!isUniqueConstraintError(error)) throw error;
        }
      }

      if (!appointment) {
        throw new BookingError(
          'REFERENCE_GENERATION_FAILED',
          'We could not complete your booking. Please try again.',
          { status: 500 },
        );
      }

      await tx.appointmentEvent.create({
        data: {
          appointmentId: appointment.id,
          type: 'created',
          actor: input.source === 'admin' ? 'admin' : 'patient',
          payloadJson: JSON.stringify({
            requestedDentistId: input.dentistId,
            assignedDentistId,
            overrideAvailability: input.overrideAvailability ?? false,
          }),
        },
      });

      const dentist = await tx.dentist.findUniqueOrThrow({
        where: { id: assignedDentistId },
        select: { title: true, firstName: true, lastName: true },
      });

      return { appointment, service, dentist, deposit };
    },
    { timeout: 15_000 },
  );

  // Cache invalidation happens after the transaction commits, never inside it.
  invalidateAvailability({
    dentistIds: [result.appointment.dentistId],
    dates: [input.date],
  });

  return toConfirmationDto({
    appointment: result.appointment,
    serviceName: result.service.name,
    durationMinutes: result.service.durationMinutes,
    priceFromCents: result.service.priceFromCents,
    dentistName: `${result.dentist.title} ${result.dentist.firstName} ${result.dentist.lastName}`,
    patientFirstName: input.patient.firstName,
  });
}

/* ------------------------------------------------------------------ */
/* Lookup                                                             */
/* ------------------------------------------------------------------ */

export interface LookupInput {
  readonly reference: string;
  readonly verification:
    | { readonly kind: 'email'; readonly value: string }
    | { readonly kind: 'mobile'; readonly value: string };
}

/**
 * Find an appointment by reference, having verified the enquirer holds it.
 *
 * Returns the identical error whether the reference does not exist or the
 * verification value does not match, so this cannot be used to work out which
 * references are real.
 */
export async function lookupBooking(
  input: LookupInput,
): Promise<BookingConfirmationDto> {
  const reference = normalizeReference(input.reference);

  const appointment = await prisma.appointment.findUnique({
    where: { reference },
    include: {
      patient: true,
      service: true,
      dentist: true,
    },
  });

  if (!appointment) throw new BookingNotFoundError();

  const expected =
    input.verification.kind === 'email'
      ? appointment.patient.emailNormalized
      : appointment.patient.mobileNormalized;
  const supplied =
    input.verification.kind === 'email'
      ? normalizeEmail(input.verification.value)
      : toE164ZA(input.verification.value);

  if (!constantTimeEquals(expected, supplied)) throw new BookingNotFoundError();

  return toConfirmationDto({
    appointment,
    serviceName: appointment.service.name,
    durationMinutes: appointment.service.durationMinutes,
    priceFromCents: appointment.service.priceFromCents,
    dentistName: `${appointment.dentist.title} ${appointment.dentist.firstName} ${appointment.dentist.lastName}`,
    patientFirstName: appointment.patient.firstName,
  });
}

/**
 * Load a booking using a management token rather than contact details.
 *
 * Used by the confirmation page and the manage-appointment screen after a
 * successful lookup, so the patient does not have to re-verify on every
 * action. The token is bound to one appointment id, so it cannot be replayed
 * against a different booking.
 */
export async function getBookingByToken(
  reference: string,
  token: string,
): Promise<BookingConfirmationDto | null> {
  const appointment = await prisma.appointment.findUnique({
    where: { reference: normalizeReference(reference) },
    include: { patient: true, service: true, dentist: true },
  });
  if (!appointment) return null;

  if (!(await assertManageToken(token, appointment.id))) return null;

  return toConfirmationDto({
    appointment,
    serviceName: appointment.service.name,
    durationMinutes: appointment.service.durationMinutes,
    priceFromCents: appointment.service.priceFromCents,
    dentistName: `${appointment.dentist.title} ${appointment.dentist.firstName} ${appointment.dentist.lastName}`,
    patientFirstName: appointment.patient.firstName,
  });
}

/** Resolve the appointment id a management token is valid for. */
export async function appointmentIdForToken(
  reference: string,
  token: string,
): Promise<string | null> {
  const appointment = await prisma.appointment.findUnique({
    where: { reference: normalizeReference(reference) },
    select: { id: true },
  });
  if (!appointment) return null;
  return (await assertManageToken(token, appointment.id))
    ? appointment.id
    : null;
}

/** The service a booking is for, used to drive contextual recommendations. */
export async function serviceIdForReference(
  reference: string,
): Promise<string | null> {
  const appointment = await prisma.appointment.findUnique({
    where: { reference: normalizeReference(reference) },
    select: { serviceId: true },
  });
  return appointment?.serviceId ?? null;
}

/* ------------------------------------------------------------------ */
/* Cancel                                                             */
/* ------------------------------------------------------------------ */

export interface CancelBookingInput {
  readonly appointmentId: string;
  readonly actor: 'patient' | 'admin';
  readonly reason?: string;
  readonly now?: Date;
}

/**
 * Cancel an appointment, which returns its slot to availability.
 *
 * The row is never deleted. Setting the status to cancelled is what frees the
 * time, because every availability query filters on the occupying statuses.
 * Keeping the row preserves the audit trail and lets staff answer "we did
 * cancel that, here is when".
 */
export async function cancelBooking(input: CancelBookingInput): Promise<void> {
  const now = input.now ?? new Date();

  const result = await prisma.$transaction(async (tx) => {
    const appointment = await tx.appointment.findUnique({
      where: { id: input.appointmentId },
      select: {
        id: true,
        status: true,
        startTime: true,
        dentistId: true,
        depositStatus: true,
      },
    });
    if (!appointment) throw new BookingNotFoundError();

    // Cancelling twice is a no-op rather than an error.
    if (appointment.status === 'cancelled') return appointment;

    if (input.actor === 'patient') {
      if (!PATIENT_CANCELLABLE_STATUSES.includes(appointment.status as 'pending')) {
        throw new InvalidTransitionError(appointment.status, 'cancelled');
      }
      const hoursUntil =
        (appointment.startTime.getTime() - now.getTime()) / 3_600_000;
      if (hoursUntil < clinic.cancellationNoticeHours) {
        throw new CancellationWindowClosedError(clinic.cancellationNoticeHours);
      }
    } else if (!APPOINTMENT_TRANSITIONS[appointment.status as AppointmentStatus].includes('cancelled')) {
      throw new InvalidTransitionError(appointment.status, 'cancelled');
    }

    await tx.appointment.update({
      where: { id: appointment.id },
      data: {
        status: 'cancelled',
        cancelledAt: now,
        cancelledBy: input.actor,
        cancelReason: input.reason ?? null,
        // A paid deposit becomes a refund task for reception. It is marked
        // rather than silently kept, so it cannot be quietly forgotten.
        ...(appointment.depositStatus === 'paid'
          ? { depositStatus: 'refunded' as DepositStatus }
          : {}),
      },
    });

    await tx.appointmentEvent.create({
      data: {
        appointmentId: appointment.id,
        type: 'cancelled',
        actor: input.actor,
        payloadJson: JSON.stringify({ reason: input.reason ?? null }),
      },
    });

    return appointment;
  });

  invalidateAvailability({
    dentistIds: [result.dentistId],
    dates: [todayLocalDate(result.startTime)],
  });
}

/* ------------------------------------------------------------------ */
/* Reschedule                                                         */
/* ------------------------------------------------------------------ */

export interface RescheduleBookingInput {
  readonly appointmentId: string;
  readonly date: LocalDate;
  readonly startMinutes: LocalMinutes;
  /** Staff may move an appointment to a different dentist; patients may not. */
  readonly dentistId?: string;
  readonly actor: 'patient' | 'admin';
  readonly overrideAvailability?: boolean;
  readonly now?: Date;
}

/**
 * Move an appointment to a new time.
 *
 * Done as a single in-place update, so the original interval is released and
 * the new one claimed in the same statement. There is no instant at which the
 * appointment holds both slots or neither, and the booking reference does not
 * change, which matters because the patient's confirmation quotes it.
 *
 * Note the self-exclusion in three places below. Without it an appointment can
 * never be moved within its own footprint, for example 10:00 to 10:15, because
 * it would collide with itself. That is the most common reschedule there is.
 */
export async function rescheduleBooking(
  input: RescheduleBookingInput,
): Promise<BookingConfirmationDto> {
  const now = input.now ?? new Date();

  const result = await prisma.$transaction(
    async (tx) => {
      const appointment = await tx.appointment.findUnique({
        where: { id: input.appointmentId },
        include: { service: true, patient: true },
      });
      if (!appointment) throw new BookingNotFoundError();

      const allowed =
        input.actor === 'patient'
          ? PATIENT_RESCHEDULABLE_STATUSES.includes(appointment.status as 'pending')
          : ['pending', 'confirmed'].includes(appointment.status);
      if (!allowed) {
        throw new InvalidTransitionError(appointment.status, 'rescheduled');
      }

      // The same notice window as cancelling, and for the same reason: moving
      // an appointment releases the original slot, so doing it an hour
      // beforehand leaves the practice with time nobody can fill. The
      // published cancellation policy says patients may cancel or move online
      // up to this point, so enforcing it on only one of the two would make
      // the policy inaccurate. Staff are exempt, because somebody on the
      // telephone can see the diary and decide.
      if (input.actor === 'patient') {
        const hoursUntil =
          (appointment.startTime.getTime() - now.getTime()) / 3_600_000;
        if (hoursUntil < clinic.cancellationNoticeHours) {
          throw new CancellationWindowClosedError(
            clinic.cancellationNoticeHours,
          );
        }
      }

      const targetDentistId = input.dentistId ?? appointment.dentistId;

      const start = toInstant(input.date, input.startMinutes);
      const serviceEnd = toInstant(
        input.date,
        input.startMinutes + appointment.service.durationMinutes,
      );
      const end = toInstant(
        input.date,
        input.startMinutes +
          appointment.service.durationMinutes +
          appointment.service.bufferAfterMinutes,
      );

      if (!input.overrideAvailability) {
        // Self-exclusion, first occurrence: recompute availability as though
        // this appointment were not in the diary.
        const [liveInput] = await loadAvailabilityInputs({
          dates: [input.date],
          serviceId: appointment.serviceId,
          dentistId: targetDentistId,
          excludeAppointmentId: appointment.id,
          now,
          db: tx,
        });
        if (!liveInput) throw new SlotInvalidError();

        const day = computeSlots(liveInput);
        const offered = day.slots.some(
          (s) => s.startMinutes === input.startMinutes,
        );
        if (!offered) {
          throw new SlotInvalidError(
            'That time is not available. Please choose one of the available times.',
            // Self-exclusion, second occurrence.
            await alternativesFor({
              serviceId: appointment.serviceId,
              dentistId: targetDentistId,
              fromDate: input.date,
              excludeAppointmentId: appointment.id,
            }),
          );
        }
      }

      // Self-exclusion, third occurrence: the decisive overlap probe.
      const [conflict, block] = await Promise.all([
        findConflictingAppointment(tx, {
          dentistId: targetDentistId,
          start,
          end,
          excludeAppointmentId: appointment.id,
        }),
        findConflictingBlock(tx, { dentistId: targetDentistId, start, end }),
      ]);

      if (conflict || (block && !input.overrideAvailability)) {
        throw new SlotTakenError(
          await alternativesFor({
            serviceId: appointment.serviceId,
            dentistId: targetDentistId,
            fromDate: input.date,
            excludeAppointmentId: appointment.id,
          }),
        );
      }

      const previousStart = appointment.startTime;
      const previousDentistId = appointment.dentistId;

      const updated = await tx.appointment.update({
        where: { id: appointment.id },
        data: {
          dentistId: targetDentistId,
          startTime: start,
          serviceEndTime: serviceEnd,
          endTime: end,
        },
      });

      await tx.appointmentEvent.create({
        data: {
          appointmentId: appointment.id,
          type: 'rescheduled',
          actor: input.actor,
          payloadJson: JSON.stringify({
            from: {
              startTime: previousStart.toISOString(),
              dentistId: previousDentistId,
            },
            to: { startTime: start.toISOString(), dentistId: targetDentistId },
          }),
        },
      });

      const dentist = await tx.dentist.findUniqueOrThrow({
        where: { id: targetDentistId },
        select: { title: true, firstName: true, lastName: true },
      });

      return {
        appointment: updated,
        service: appointment.service,
        dentist,
        patient: appointment.patient,
        previousStart,
        previousDentistId,
      };
    },
    { timeout: 15_000 },
  );

  invalidateAvailability({
    dentistIds: [result.previousDentistId, result.appointment.dentistId],
    dates: [todayLocalDate(result.previousStart), input.date],
  });

  return toConfirmationDto({
    appointment: result.appointment,
    serviceName: result.service.name,
    durationMinutes: result.service.durationMinutes,
    priceFromCents: result.service.priceFromCents,
    dentistName: `${result.dentist.title} ${result.dentist.firstName} ${result.dentist.lastName}`,
    patientFirstName: result.patient.firstName,
  });
}

/* ------------------------------------------------------------------ */
/* Status changes                                                      */
/* ------------------------------------------------------------------ */

export async function setAppointmentStatus(args: {
  appointmentId: string;
  status: AppointmentStatus;
  internalNote?: string;
  now?: Date;
}): Promise<void> {
  const now = args.now ?? new Date();

  const result = await prisma.$transaction(async (tx) => {
    const appointment = await tx.appointment.findUnique({
      where: { id: args.appointmentId },
      select: { id: true, status: true, dentistId: true, startTime: true },
    });
    if (!appointment) throw new BookingNotFoundError();

    const current = appointment.status as AppointmentStatus;
    if (current === args.status) return appointment;

    if (!APPOINTMENT_TRANSITIONS[current].includes(args.status)) {
      throw new InvalidTransitionError(current, args.status);
    }

    await tx.appointment.update({
      where: { id: appointment.id },
      data: {
        status: args.status,
        ...(args.status === 'cancelled'
          ? { cancelledAt: now, cancelledBy: 'admin' }
          : {}),
        ...(args.internalNote ? { internalNotes: args.internalNote } : {}),
      },
    });

    await tx.appointmentEvent.create({
      data: {
        appointmentId: appointment.id,
        type:
          args.status === 'no_show'
            ? 'marked_no_show'
            : args.status === 'completed'
              ? 'completed'
              : args.status === 'cancelled'
                ? 'cancelled'
                : 'confirmed',
        actor: 'admin',
        payloadJson: JSON.stringify({ from: current, to: args.status }),
      },
    });

    return appointment;
  });

  invalidateAvailability({
    dentistIds: [result.dentistId],
    dates: [todayLocalDate(result.startTime)],
  });
}

/** Mark a deposit paid, confirming a pending appointment in the process. */
export async function markDepositPaid(appointmentId: string): Promise<void> {
  const appointment = await prisma.appointment.update({
    where: { id: appointmentId },
    data: {
      depositStatus: 'paid',
      status: 'confirmed',
    },
    select: { id: true, dentistId: true, startTime: true },
  });

  await prisma.appointmentEvent.create({
    data: {
      appointmentId: appointment.id,
      type: 'deposit_paid',
      actor: 'system',
    },
  });

  invalidateAvailability({
    dentistIds: [appointment.dentistId],
    dates: [todayLocalDate(appointment.startTime)],
  });
}

/* ------------------------------------------------------------------ */
/* Mapping                                                             */
/* ------------------------------------------------------------------ */

async function buildManageToken(appointmentId: string): Promise<string> {
  try {
    return await createManageToken(appointmentId);
  } catch {
    // Missing secret must not break a confirmation page; the manage actions
    // will simply require a fresh lookup.
    return '';
  }
}

interface ConfirmationSource {
  appointment: {
    id: string;
    reference: string;
    status: string;
    startTime: Date;
    endTime: Date;
    serviceEndTime: Date;
    depositType: string;
    depositAmountCents: number | null;
    depositStatus: string;
    isEmergency: boolean;
    notes: string | null;
  };
  serviceName: string;
  durationMinutes: number;
  priceFromCents: number | null;
  dentistName: string;
  patientFirstName: string;
}

async function toConfirmationDto(
  source: ConfirmationSource,
): Promise<BookingConfirmationDto> {
  const { appointment } = source;
  const date = todayLocalDate(appointment.startTime);
  const startMinutes = localMinutesOf(appointment.startTime, date);
  const endMinutes = localMinutesOf(appointment.serviceEndTime, date);

  return {
    reference: appointment.reference,
    status: appointment.status as AppointmentStatus,
    patientFirstName: source.patientFirstName,
    serviceName: source.serviceName,
    dentistName: source.dentistName,
    date,
    dateLabel: formatLocalDateLong(date),
    startLabel: formatLocalMinutes(startMinutes),
    endLabel: formatLocalMinutes(endMinutes),
    durationMinutes: source.durationMinutes,
    startTime: appointment.startTime.toISOString(),
    endTime: appointment.serviceEndTime.toISOString(),
    priceFromCents: source.priceFromCents,
    depositType: appointment.depositType as DepositType,
    depositAmountCents: appointment.depositAmountCents,
    depositStatus: appointment.depositStatus as DepositStatus,
    isEmergency: appointment.isEmergency,
    notes: appointment.notes,
    manageToken: await buildManageToken(appointment.id),
  };
}

function localMinutesOf(instant: Date, date: LocalDate): number {
  const dayStart = toInstant(date, 0).getTime();
  return Math.round((instant.getTime() - dayStart) / 60_000);
}

function constantTimeEquals(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i += 1) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

function isUniqueConstraintError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: string }).code === 'P2002'
  );
}
