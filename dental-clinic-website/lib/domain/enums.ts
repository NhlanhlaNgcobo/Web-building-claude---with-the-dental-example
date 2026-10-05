/**
 * Single source of truth for every status value in the system.
 *
 * SQLite has no native enum type, so every status is stored as a `String`
 * column. To stop that becoming a correctness hole (SQLite will happily store
 * `"pendng"`), each union is declared once here as a `const` tuple and derives
 * three things from it: the runtime array, the TypeScript union, and the Zod
 * schema used at every trust boundary.
 *
 * Switching to PostgreSQL does not require changing any of this. See README.
 */
import { z } from 'zod';

function stringUnion<const T extends readonly [string, ...string[]]>(values: T) {
  return { values, schema: z.enum(values) } as const;
}

/* ------------------------------------------------------------------ */
/* Appointments                                                        */
/* ------------------------------------------------------------------ */

export const AppointmentStatus = stringUnion([
  'pending',
  'confirmed',
  'cancelled',
  'completed',
  'no_show',
]);
export type AppointmentStatus = (typeof AppointmentStatus.values)[number];

/**
 * Statuses that OCCUPY a slot, i.e. everything except `cancelled`.
 *
 * `completed` and `no_show` are deliberately included: the chair time was
 * consumed either way, and keeping them blocking preserves an honest history.
 * You should not be able to retroactively double-book a past slot because a
 * patient failed to arrive.
 *
 * Cancelling is therefore the ONLY thing that returns a slot to availability.
 */
export const ACTIVE_APPOINTMENT_STATUSES = [
  'pending',
  'confirmed',
  'completed',
  'no_show',
] as const satisfies readonly AppointmentStatus[];

/** Statuses a patient may cancel from without phoning the practice. */
export const PATIENT_CANCELLABLE_STATUSES = ['pending', 'confirmed'] as const;

/** Statuses a patient may reschedule from. */
export const PATIENT_RESCHEDULABLE_STATUSES = ['pending', 'confirmed'] as const;

/**
 * Legal status transitions, enforced in the service layer.
 * `cancelled` and `completed` are terminal; re-booking creates a new appointment
 * so the original reference and its audit trail stay intact.
 */
export const APPOINTMENT_TRANSITIONS: Record<
  AppointmentStatus,
  readonly AppointmentStatus[]
> = {
  pending: ['confirmed', 'cancelled', 'completed', 'no_show'],
  confirmed: ['completed', 'cancelled', 'no_show'],
  cancelled: [],
  completed: [],
  // Allows correcting a premature no-show when the patient did in fact arrive.
  no_show: ['completed'],
};

export const AppointmentEventType = stringUnion([
  'created',
  'confirmed',
  'rescheduled',
  'cancelled',
  'completed',
  'marked_no_show',
  'deposit_paid',
  'deposit_refunded',
  'reminder_sent',
  'note_added',
]);
export type AppointmentEventType = (typeof AppointmentEventType.values)[number];

export const BookingSource = stringUnion(['web', 'phone', 'walk_in', 'admin']);
export type BookingSource = (typeof BookingSource.values)[number];

/* ------------------------------------------------------------------ */
/* Deposits and payments                                               */
/* ------------------------------------------------------------------ */

export const DepositType = stringUnion(['none', 'optional', 'required']);
export type DepositType = (typeof DepositType.values)[number];

export const DepositStatus = stringUnion([
  'not_required',
  'unpaid',
  'paid',
  'refunded',
]);
export type DepositStatus = (typeof DepositStatus.values)[number];

export const PaymentKind = stringUnion(['deposit', 'order']);
export type PaymentKind = (typeof PaymentKind.values)[number];

export const PaymentStatus = stringUnion([
  'pending',
  'paid',
  'failed',
  'cancelled',
  'refunded',
]);
export type PaymentStatus = (typeof PaymentStatus.values)[number];

/* ------------------------------------------------------------------ */
/* Scheduling                                                          */
/* ------------------------------------------------------------------ */

export const BlockReason = stringUnion([
  'leave',
  'public_holiday',
  'training',
  'maintenance',
  'admin_time',
  'other',
]);
export type BlockReason = (typeof BlockReason.values)[number];

export const BLOCK_REASON_LABELS: Record<BlockReason, string> = {
  leave: 'Leave',
  public_holiday: 'Public holiday',
  training: 'Training',
  maintenance: 'Equipment maintenance',
  admin_time: 'Admin time',
  other: 'Other',
};

/* ------------------------------------------------------------------ */
/* Catalogue                                                           */
/* ------------------------------------------------------------------ */

export const ServiceCategory = stringUnion([
  'general',
  'hygiene',
  'cosmetic',
  'restorative',
  'surgical',
  'emergency',
]);
export type ServiceCategory = (typeof ServiceCategory.values)[number];

export const ProductCategory = stringUnion([
  'oral_care',
  'whitening',
  'aftercare',
  'accessories',
]);
export type ProductCategory = (typeof ProductCategory.values)[number];

export const OrderStatus = stringUnion([
  'pending',
  'paid',
  'ready_for_collection',
  'fulfilled',
  'cancelled',
]);
export type OrderStatus = (typeof OrderStatus.values)[number];

export const FulfilmentMethod = stringUnion(['collect', 'collect_at_appointment']);
export type FulfilmentMethod = (typeof FulfilmentMethod.values)[number];

/* ------------------------------------------------------------------ */
/* Display labels                                                      */
/* ------------------------------------------------------------------ */

export const APPOINTMENT_STATUS_LABELS: Record<AppointmentStatus, string> = {
  pending: 'Awaiting deposit',
  confirmed: 'Confirmed',
  cancelled: 'Cancelled',
  completed: 'Completed',
  no_show: 'Did not attend',
};
