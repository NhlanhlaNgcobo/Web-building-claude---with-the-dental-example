import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { DiaryCalendar } from '@/components/admin/DiaryCalendar';
import { DiaryControls } from '@/components/admin/DiaryControls';
import { BlockTimePanel } from '@/components/admin/BlockTimePanel';
import { CreateAppointmentPanel } from '@/components/admin/CreateAppointmentPanel';
import { requireStaffPage } from '@/lib/admin/auth';
import {
  getDentistsForFilter,
  getDiary,
  getServicesForFilter,
} from '@/lib/admin/queries';
import {
  addLocalDays,
  dayOfWeekFor,
  formatLocalDateLong,
  todayLocalDate,
} from '@/lib/availability/tz';
import type { AppointmentStatus } from '@/lib/domain/enums';
import { cn } from '@/lib/cn';

export const metadata: Metadata = { title: 'Diary' };
export const dynamic = 'force-dynamic';

type View = 'day' | 'week' | 'month';

/** Monday of the week containing the date, matching how the practice week runs. */
function startOfWeek(date: string): string {
  const dow = dayOfWeekFor(date);
  return addLocalDays(date, dow === 0 ? -6 : 1 - dow);
}

export default async function DiaryPage({
  searchParams,
}: PageProps<'/admin/calendar'>) {
  await requireStaffPage('/admin/calendar');

  const query = await searchParams;
  const view: View =
    query.view === 'week' || query.view === 'month' ? query.view : 'day';
  const date =
    typeof query.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(query.date)
      ? query.date
      : todayLocalDate();
  const dentistId = typeof query.dentist === 'string' ? query.dentist : undefined;
  const serviceId = typeof query.service === 'string' ? query.service : undefined;
  const statusFilter =
    typeof query.status === 'string' && query.status.length > 0
      ? (query.status.split(',') as AppointmentStatus[])
      : undefined;

  // Day shows one column, week seven from Monday, month overview four weeks.
  const start =
    view === 'day' ? date : view === 'week' ? startOfWeek(date) : startOfWeek(date);
  const days = view === 'day' ? 1 : view === 'week' ? 7 : 28;

  const [diary, dentists, services] = await Promise.all([
    getDiary(start, days, { dentistId, serviceId, statuses: statusFilter }),
    getDentistsForFilter(),
    getServicesForFilter(),
  ]);

  const dentistNames = Object.fromEntries(
    dentists.map((d) => [d.id, `${d.title} ${d.lastName}`]),
  );

  const step = view === 'day' ? 1 : view === 'week' ? 7 : 28;
  const previous = addLocalDays(start, -step);
  const next = addLocalDays(start, step);

  function hrefFor(params: Record<string, string | undefined>) {
    const search = new URLSearchParams();
    search.set('view', params.view ?? view);
    search.set('date', params.date ?? date);
    const d = params.dentist ?? dentistId;
    const s = params.service ?? serviceId;
    if (d) search.set('dentist', d);
    if (s) search.set('service', s);
    if (statusFilter) search.set('status', statusFilter.join(','));
    return `/admin/calendar?${search.toString()}`;
  }

  const totalAppointments = diary.reduce(
    (sum, day) =>
      sum + day.appointments.filter((a) => a.status !== 'cancelled').length,
    0,
  );

  return (
    <div className="mx-auto max-w-[110rem] px-4 py-6 sm:px-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[1.375rem] font-semibold text-white">
            {view === 'day'
              ? formatLocalDateLong(start)
              : `${formatLocalDateLong(start)} onwards`}
          </h1>
          <p className="mt-1 text-sm text-white/55">
            <span className="tabular-nums">{totalAppointments}</span>{' '}
            {totalAppointments === 1 ? 'appointment' : 'appointments'} in view
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* View switch */}
          <div
            className="flex rounded-panel border border-line-dark p-0.5"
            role="group"
            aria-label="Diary view"
          >
            {(['day', 'week', 'month'] as const).map((option) => (
              <Link
                key={option}
                href={hrefFor({ view: option })}
                aria-current={view === option ? 'true' : undefined}
                className={cn(
                  'flex h-8 items-center rounded-[3px] px-3 text-[0.8125rem] font-medium capitalize',
                  'transition-colors duration-[--duration-feedback] ease-out',
                  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white',
                  view === option
                    ? 'bg-white text-ink'
                    : 'text-white/60 hover:text-white',
                )}
              >
                {option}
              </Link>
            ))}
          </div>

          {/* Date navigation */}
          <div className="flex items-center gap-1">
            <Link
              href={hrefFor({ date: previous })}
              aria-label="Previous period"
              className="flex size-9 items-center justify-center rounded-panel border border-line-dark text-white/70 transition-colors duration-[--duration-feedback] hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              <ChevronLeft className="size-4" aria-hidden="true" />
            </Link>
            <Link
              href={hrefFor({ date: todayLocalDate() })}
              className="flex h-9 items-center rounded-panel border border-line-dark px-3 text-[0.8125rem] font-medium text-white/70 transition-colors duration-[--duration-feedback] hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              Today
            </Link>
            <Link
              href={hrefFor({ date: next })}
              aria-label="Next period"
              className="flex size-9 items-center justify-center rounded-panel border border-line-dark text-white/70 transition-colors duration-[--duration-feedback] hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              <ChevronRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="mt-5">
        <DiaryControls
          dentists={dentists.map((d) => ({
            id: d.id,
            name: `${d.title} ${d.firstName} ${d.lastName}`,
          }))}
          services={services.map((s) => ({ id: s.id, name: s.name }))}
          selectedDentist={dentistId}
          selectedService={serviceId}
          selectedStatuses={statusFilter}
        />
      </div>

      {/* Diary and side panels */}
      <div className="mt-5 grid gap-5 xl:grid-cols-[1fr_minmax(0,21rem)]">
        <DiaryCalendar days={diary} dentistNames={dentistNames} />

        <div className="flex flex-col gap-5">
          <CreateAppointmentPanel
            dentists={dentists.map((d) => ({
              id: d.id,
              name: `${d.title} ${d.firstName} ${d.lastName}`,
            }))}
            services={services.map((s) => ({
              id: s.id,
              slug: s.slug,
              name: s.name,
              durationMinutes: s.durationMinutes,
            }))}
            defaultDate={view === 'day' ? start : todayLocalDate()}
          />
          <BlockTimePanel
            dentists={dentists.map((d) => ({
              id: d.id,
              name: `${d.title} ${d.firstName} ${d.lastName}`,
            }))}
            blocks={diary.flatMap((day) =>
              day.blocks.map((block) => ({
                ...block,
                dentistName: block.dentistId
                  ? dentistNames[block.dentistId]
                  : undefined,
              })),
            )}
            defaultDate={view === 'day' ? start : todayLocalDate()}
          />
        </div>
      </div>
    </div>
  );
}
