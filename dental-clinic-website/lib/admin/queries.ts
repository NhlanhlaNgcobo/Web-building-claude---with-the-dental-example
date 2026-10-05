import 'server-only';

import { prisma } from '@/lib/db';
import { ACTIVE_APPOINTMENT_STATUSES } from '@/lib/domain/enums';
import type { AppointmentStatus, DepositStatus } from '@/lib/domain/enums';
import {
  addLocalDays,
  dayOfWeekFor,
  endOfLocalDay,
  formatLocalMinutes,
  startOfLocalDay,
  todayLocalDate,
} from '@/lib/availability/tz';
import type { LocalDate } from '@/lib/availability/types';

/**
 * Read queries for the staff diary.
 *
 * All day boundaries go through the timezone helpers rather than being
 * computed from UTC, so "today" means the practice's today rather than the
 * server's.
 */

/* ------------------------------------------------------------------ */
/* Dashboard metrics                                                   */
/* ------------------------------------------------------------------ */

export interface DashboardMetrics {
  readonly appointmentsToday: number;
  readonly appointmentsThisWeek: number;
  readonly newPatientsThisMonth: number;
  readonly cancellationsThisWeek: number;
  readonly depositsReceivedCents: number;
  readonly depositsOutstandingCents: number;
  readonly pendingOrders: number;
  readonly noShowsThisMonth: number;
}

/** The Monday of the week containing `date`, in the practice's local calendar. */
function startOfLocalWeek(date: LocalDate): LocalDate {
  const dow = dayOfWeekFor(date);
  // Treat Monday as the first day, matching how the practice week runs.
  const offset = dow === 0 ? -6 : 1 - dow;
  return addLocalDays(date, offset);
}

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const today = todayLocalDate();
  const weekStart = startOfLocalWeek(today);
  const weekEnd = addLocalDays(weekStart, 7);
  const monthStart = `${today.slice(0, 7)}-01`;

  const todayStart = startOfLocalDay(today);
  const todayEnd = endOfLocalDay(today);
  const weekStartInstant = startOfLocalDay(weekStart);
  const weekEndInstant = startOfLocalDay(weekEnd);
  const monthStartInstant = startOfLocalDay(monthStart);

  const [
    appointmentsToday,
    appointmentsThisWeek,
    newPatientsThisMonth,
    cancellationsThisWeek,
    depositsPaid,
    depositsUnpaid,
    pendingOrders,
    noShowsThisMonth,
  ] = await Promise.all([
    prisma.appointment.count({
      where: {
        status: { in: [...ACTIVE_APPOINTMENT_STATUSES] },
        startTime: { gte: todayStart, lt: todayEnd },
      },
    }),
    prisma.appointment.count({
      where: {
        status: { in: [...ACTIVE_APPOINTMENT_STATUSES] },
        startTime: { gte: weekStartInstant, lt: weekEndInstant },
      },
    }),
    prisma.patient.count({
      where: { createdAt: { gte: monthStartInstant } },
    }),
    prisma.appointment.count({
      where: {
        status: 'cancelled',
        cancelledAt: { gte: weekStartInstant, lt: weekEndInstant },
      },
    }),
    prisma.appointment.aggregate({
      _sum: { depositAmountCents: true },
      where: {
        depositStatus: 'paid',
        startTime: { gte: monthStartInstant },
      },
    }),
    prisma.appointment.aggregate({
      _sum: { depositAmountCents: true },
      where: {
        depositStatus: 'unpaid',
        status: { in: [...ACTIVE_APPOINTMENT_STATUSES] },
      },
    }),
    prisma.order.count({ where: { status: 'pending' } }),
    prisma.appointment.count({
      where: { status: 'no_show', startTime: { gte: monthStartInstant } },
    }),
  ]);

  return {
    appointmentsToday,
    appointmentsThisWeek,
    newPatientsThisMonth,
    cancellationsThisWeek,
    depositsReceivedCents: depositsPaid._sum.depositAmountCents ?? 0,
    depositsOutstandingCents: depositsUnpaid._sum.depositAmountCents ?? 0,
    pendingOrders,
    noShowsThisMonth,
  };
}

/* ------------------------------------------------------------------ */
/* Diary                                                              */
/* ------------------------------------------------------------------ */

export interface DiaryAppointment {
  readonly id: string;
  readonly reference: string;
  readonly date: LocalDate;
  readonly startMinutes: number;
  readonly endMinutes: number;
  readonly startLabel: string;
  readonly endLabel: string;
  readonly durationMinutes: number;
  readonly status: AppointmentStatus;
  readonly depositStatus: DepositStatus;
  readonly depositAmountCents: number | null;
  readonly isEmergency: boolean;
  readonly notes: string | null;
  readonly internalNotes: string | null;
  readonly source: string;
  readonly patient: {
    readonly id: string;
    readonly name: string;
    readonly mobile: string;
    readonly email: string;
    readonly isExistingPatient: boolean;
  };
  readonly dentist: { readonly id: string; readonly name: string };
  readonly service: {
    readonly id: string;
    readonly name: string;
    readonly slug: string;
  };
}

export interface DiaryBlock {
  readonly id: string;
  readonly dentistId: string | null;
  readonly date: LocalDate;
  readonly startMinutes: number;
  readonly endMinutes: number;
  readonly reason: string;
  readonly note: string | null;
}

export interface DiaryDay {
  readonly date: LocalDate;
  readonly weekday: string;
  readonly isClosed: boolean;
  readonly openMinutes: number;
  readonly closeMinutes: number;
  readonly appointments: readonly DiaryAppointment[];
  readonly blocks: readonly DiaryBlock[];
}

/** Minutes from local midnight for an instant, on a given local date. */
function localMinutes(instant: Date, date: LocalDate): number {
  return Math.round(
    (instant.getTime() - startOfLocalDay(date).getTime()) / 60_000,
  );
}

export interface DiaryFilters {
  readonly dentistId?: string;
  readonly serviceId?: string;
  readonly statuses?: readonly AppointmentStatus[];
}

/**
 * Load the diary for a run of days.
 *
 * Returns everything in local minutes so the calendar can position blocks by
 * arithmetic rather than by date maths in the component.
 *
 * Cancelled appointments are included by default here, unlike in availability,
 * because staff need to see that something was cancelled. They are rendered
 * differently rather than hidden.
 */
export async function getDiary(
  fromDate: LocalDate,
  days: number,
  filters: DiaryFilters = {},
): Promise<DiaryDay[]> {
  const dates = Array.from({ length: days }, (_, i) =>
    addLocalDays(fromDate, i),
  );
  const windowStart = startOfLocalDay(dates[0]!);
  const windowEnd = endOfLocalDay(dates[dates.length - 1]!);

  const [appointments, blocks, clinicHours] = await Promise.all([
    prisma.appointment.findMany({
      where: {
        startTime: { lt: windowEnd },
        endTime: { gt: windowStart },
        ...(filters.dentistId ? { dentistId: filters.dentistId } : {}),
        ...(filters.serviceId ? { serviceId: filters.serviceId } : {}),
        ...(filters.statuses && filters.statuses.length > 0
          ? { status: { in: [...filters.statuses] } }
          : {}),
      },
      include: { patient: true, dentist: true, service: true },
      orderBy: { startTime: 'asc' },
    }),
    prisma.blockedTime.findMany({
      where: {
        startTime: { lt: windowEnd },
        endTime: { gt: windowStart },
        ...(filters.dentistId
          ? { OR: [{ dentistId: filters.dentistId }, { dentistId: null }] }
          : {}),
      },
      orderBy: { startTime: 'asc' },
    }),
    prisma.clinicHours.findMany(),
  ]);

  const hoursByDay = new Map(clinicHours.map((h) => [h.dayOfWeek, h]));

  return dates.map((date) => {
    const dow = dayOfWeekFor(date);
    const hours = hoursByDay.get(dow);

    const dayStart = startOfLocalDay(date).getTime();
    const dayEnd = endOfLocalDay(date).getTime();

    const dayAppointments: DiaryAppointment[] = appointments
      .filter(
        (a) =>
          a.startTime.getTime() < dayEnd && a.endTime.getTime() > dayStart,
      )
      .map((a) => {
        const startMinutes = localMinutes(a.startTime, date);
        const endMinutes = localMinutes(a.serviceEndTime, date);
        return {
          id: a.id,
          reference: a.reference,
          date,
          startMinutes,
          endMinutes,
          startLabel: formatLocalMinutes(Math.max(startMinutes, 0)),
          endLabel: formatLocalMinutes(Math.min(endMinutes, 1440)),
          durationMinutes: a.service.durationMinutes,
          status: a.status as AppointmentStatus,
          depositStatus: a.depositStatus as DepositStatus,
          depositAmountCents: a.depositAmountCents,
          isEmergency: a.isEmergency,
          notes: a.notes,
          internalNotes: a.internalNotes,
          source: a.source,
          patient: {
            id: a.patient.id,
            name: `${a.patient.firstName} ${a.patient.lastName}`,
            mobile: a.patient.mobile,
            email: a.patient.email,
            isExistingPatient: a.patient.isExistingPatient,
          },
          dentist: {
            id: a.dentist.id,
            name: `${a.dentist.title} ${a.dentist.lastName}`,
          },
          service: {
            id: a.service.id,
            name: a.service.name,
            slug: a.service.slug,
          },
        };
      });

    const dayBlocks: DiaryBlock[] = blocks
      .filter(
        (b) =>
          b.startTime.getTime() < dayEnd && b.endTime.getTime() > dayStart,
      )
      .map((b) => ({
        id: b.id,
        dentistId: b.dentistId,
        date,
        // Clipped to the day, so a multi-day leave block renders correctly on
        // each day it covers.
        startMinutes: Math.max(localMinutes(b.startTime, date), 0),
        endMinutes: Math.min(localMinutes(b.endTime, date), 1440),
        reason: b.reason,
        note: b.note,
      }));

    return {
      date,
      weekday: new Date(`${date}T12:00:00`).toLocaleDateString('en-ZA', {
        weekday: 'short',
      }),
      isClosed: hours?.isClosed ?? true,
      openMinutes: hours?.openMinutes ?? 480,
      closeMinutes: hours?.closeMinutes ?? 1020,
      appointments: dayAppointments,
      blocks: dayBlocks,
    };
  });
}

/* ------------------------------------------------------------------ */
/* Upcoming list and orders                                            */
/* ------------------------------------------------------------------ */

export async function getUpcomingAppointments(limit = 8) {
  const rows = await prisma.appointment.findMany({
    where: {
      status: { in: ['pending', 'confirmed'] },
      startTime: { gte: new Date() },
    },
    include: { patient: true, dentist: true, service: true },
    orderBy: { startTime: 'asc' },
    take: limit,
  });

  return rows.map((a) => {
    const date = todayLocalDate(a.startTime);
    return {
      id: a.id,
      reference: a.reference,
      date,
      startLabel: formatLocalMinutes(localMinutes(a.startTime, date)),
      patientName: `${a.patient.firstName} ${a.patient.lastName}`,
      patientMobile: a.patient.mobile,
      serviceName: a.service.name,
      dentistName: `${a.dentist.title} ${a.dentist.lastName}`,
      status: a.status as AppointmentStatus,
      depositStatus: a.depositStatus as DepositStatus,
      depositAmountCents: a.depositAmountCents,
      isEmergency: a.isEmergency,
    };
  });
}

export async function getOrders(limit = 50) {
  return prisma.order.findMany({
    include: { items: true, appointment: { select: { reference: true, startTime: true } } },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
}

export async function getDentistsForFilter() {
  return prisma.dentist.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
    select: { id: true, title: true, firstName: true, lastName: true },
  });
}

export async function getServicesForFilter() {
  return prisma.service.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
    select: { id: true, name: true, durationMinutes: true, slug: true },
  });
}

export async function getDentistSchedules() {
  return prisma.dentist.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
    include: {
      schedules: { where: { isActive: true }, orderBy: { dayOfWeek: 'asc' } },
      blockedTimes: {
        where: { endTime: { gte: new Date() } },
        orderBy: { startTime: 'asc' },
      },
    },
  });
}
