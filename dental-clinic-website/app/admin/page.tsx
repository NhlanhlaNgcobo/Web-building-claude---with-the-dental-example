import Link from 'next/link';
import {
  AlertTriangle,
  ArrowRight,
  CalendarCheck,
  CalendarDays,
  CalendarX2,
  Package,
  Siren,
  UserPlus,
  Wallet,
} from 'lucide-react';
import { requireStaffPage } from '@/lib/admin/auth';
import {
  getDashboardMetrics,
  getUpcomingAppointments,
} from '@/lib/admin/queries';
import { formatPrice } from '@/lib/currency';
import { cn } from '@/lib/cn';
import { formatLocalDateShort, todayLocalDate } from '@/lib/availability/tz';

export const dynamic = 'force-dynamic';

/**
 * Staff dashboard.
 *
 * The numbers reception actually needs at a glance, then the next appointments
 * in order. Deposits outstanding is included because it is the one figure that
 * represents work for somebody: each one is a patient to chase or an
 * appointment to release.
 */
export default async function AdminDashboard() {
  await requireStaffPage('/admin');

  const [metrics, upcoming] = await Promise.all([
    getDashboardMetrics(),
    getUpcomingAppointments(8),
  ]);

  const today = todayLocalDate();

  const tiles = [
    {
      label: 'Appointments today',
      value: String(metrics.appointmentsToday),
      icon: CalendarCheck,
      href: '/admin/calendar',
    },
    {
      label: 'This week',
      value: String(metrics.appointmentsThisWeek),
      icon: CalendarDays,
      href: '/admin/calendar?view=week',
    },
    {
      label: 'New patients this month',
      value: String(metrics.newPatientsThisMonth),
      icon: UserPlus,
    },
    {
      label: 'Cancellations this week',
      value: String(metrics.cancellationsThisWeek),
      icon: CalendarX2,
    },
    {
      label: 'Deposits received this month',
      value: formatPrice(metrics.depositsReceivedCents),
      icon: Wallet,
    },
    {
      label: 'Deposits outstanding',
      value: formatPrice(metrics.depositsOutstandingCents),
      icon: AlertTriangle,
      emphasis: metrics.depositsOutstandingCents > 0,
    },
    {
      label: 'Orders to prepare',
      value: String(metrics.pendingOrders),
      icon: Package,
      href: '/admin/orders',
    },
    {
      label: 'Did not attend, this month',
      value: String(metrics.noShowsThisMonth),
      icon: AlertTriangle,
    },
  ];

  return (
    <div className="mx-auto max-w-[110rem] px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[1.5rem] font-semibold text-white">
            Today at the practice
          </h1>
          <p className="mt-1 text-sm text-white/55">
            {new Date(`${today}T12:00:00`).toLocaleDateString('en-ZA', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </p>
        </div>
        <Link
          href="/admin/calendar"
          className="inline-flex h-10 items-center gap-2 rounded-panel bg-white px-4 text-sm font-semibold text-ink transition-colors duration-[--duration-feedback] hover:bg-canvas focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          Open the diary
          <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </div>

      {/* Metrics */}
      <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {tiles.map((tile) => {
          const Icon = tile.icon;
          const body = (
            <>
              <div className="flex items-start justify-between gap-3">
                <span
                  className={cn(
                    'flex size-9 items-center justify-center rounded-panel',
                    tile.emphasis
                      ? 'bg-[--color-caution]/20 text-[#fdb022]'
                      : 'bg-blue/20 text-blue-soft',
                  )}
                >
                  <Icon className="size-4" aria-hidden="true" />
                </span>
                {tile.href && (
                  <ArrowRight
                    className="size-4 text-white/30"
                    aria-hidden="true"
                  />
                )}
              </div>
              <p className="mt-4 text-[1.75rem] font-semibold tabular-nums text-white">
                {tile.value}
              </p>
              <p className="mt-0.5 text-[0.8125rem] text-white/55">
                {tile.label}
              </p>
            </>
          );

          return (
            <li key={tile.label}>
              {tile.href ? (
                <Link
                  href={tile.href}
                  className="flex h-full flex-col rounded-card glass-dark p-5 transition-colors duration-[--duration-feedback] hover:bg-white/[0.1] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                >
                  {body}
                </Link>
              ) : (
                <div className="flex h-full flex-col rounded-card glass-dark p-5">
                  {body}
                </div>
              )}
            </li>
          );
        })}
      </ul>

      {/* Upcoming */}
      <section className="mt-10" aria-labelledby="upcoming-heading">
        <h2
          id="upcoming-heading"
          className="text-[1.0625rem] font-semibold text-white"
        >
          Next appointments
        </h2>

        {upcoming.length === 0 ? (
          <div className="mt-4 rounded-card border border-line-dark bg-white/[0.03] px-5 py-10 text-center">
            <p className="text-sm font-medium text-white">
              Nothing booked ahead
            </p>
            <p className="mt-1 text-sm text-white/55">
              The diary is clear. Appointments booked online appear here
              immediately.
            </p>
            <Link
              href="/admin/calendar"
              className="mt-4 inline-flex h-10 items-center rounded-panel bg-white px-4 text-sm font-semibold text-ink"
            >
              Add an appointment
            </Link>
          </div>
        ) : (
          <div className="mt-4 overflow-hidden rounded-card border border-line-dark">
            <div className="scroll-x">
              <table className="w-full min-w-[46rem] border-collapse text-left">
                <caption className="sr-only">
                  Upcoming appointments, soonest first
                </caption>
                <thead>
                  <tr className="bg-white/[0.06]">
                    {[
                      'When',
                      'Patient',
                      'Appointment',
                      'Dentist',
                      'Status',
                      'Reference',
                    ].map((heading) => (
                      <th
                        key={heading}
                        scope="col"
                        className="px-4 py-3 text-[0.6875rem] font-semibold uppercase text-white/50"
                        style={{ letterSpacing: '0.06em' }}
                      >
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {upcoming.map((appointment) => (
                    <tr
                      key={appointment.id}
                      className="border-t border-line-dark align-middle"
                    >
                      <td className="whitespace-nowrap px-4 py-3">
                        <span className="block text-[0.8125rem] font-medium tabular-nums text-white">
                          {appointment.startLabel}
                        </span>
                        <span className="block text-xs text-white/45">
                          {appointment.date === today
                            ? 'Today'
                            : formatLocalDateShort(appointment.date)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-2 text-[0.8125rem] text-white">
                          {appointment.isEmergency && (
                            <Siren
                              className="size-3.5 shrink-0 text-[#ff9c93]"
                              aria-label="Urgent"
                            />
                          )}
                          {appointment.patientName}
                        </span>
                        <span className="block text-xs tabular-nums text-white/45">
                          {appointment.patientMobile}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[0.8125rem] text-white/75">
                        {appointment.serviceName}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-[0.8125rem] text-white/75">
                        {appointment.dentistName}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <span
                          className={cn(
                            'inline-flex items-center rounded-panel px-2 py-1 text-[0.6875rem] font-semibold uppercase',
                            appointment.status === 'confirmed'
                              ? 'bg-[--color-positive]/20 text-[#75e0a7]'
                              : 'bg-[--color-caution]/20 text-[#fdb022]',
                          )}
                          style={{ letterSpacing: '0.05em' }}
                        >
                          {appointment.status === 'pending'
                            ? 'Deposit due'
                            : 'Confirmed'}
                        </span>
                        {appointment.depositStatus === 'unpaid' &&
                          appointment.depositAmountCents !== null && (
                            <span className="mt-1 block text-xs tabular-nums text-white/45">
                              {formatPrice(appointment.depositAmountCents)} owing
                            </span>
                          )}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-[0.8125rem] tabular-nums text-white/55">
                        {appointment.reference}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
