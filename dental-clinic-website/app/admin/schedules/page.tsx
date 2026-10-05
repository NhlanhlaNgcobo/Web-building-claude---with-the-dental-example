import type { Metadata } from 'next';
import { CalendarClock, Info } from 'lucide-react';
import { ScheduleEditor } from '@/components/admin/ScheduleEditor';
import { requireStaffPage } from '@/lib/admin/auth';
import { getDentistSchedules } from '@/lib/admin/queries';
import { BLOCK_REASON_LABELS, type BlockReason } from '@/lib/domain/enums';
import { formatLocalDateShort, todayLocalDate } from '@/lib/availability/tz';

export const metadata: Metadata = { title: 'Schedules' };
export const dynamic = 'force-dynamic';

/**
 * Dentist working patterns and leave.
 *
 * Changing a pattern here changes public availability on the next request,
 * because the availability engine reads the roster live rather than from a
 * precomputed set of slots.
 */
export default async function SchedulesPage() {
  await requireStaffPage('/admin/schedules');

  const dentists = await getDentistSchedules();

  return (
    <div className="mx-auto max-w-[80rem] px-4 py-8 sm:px-6">
      <h1 className="text-[1.5rem] font-semibold text-white">
        Working patterns
      </h1>
      <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-white/55">
        The weekly roster each dentist works, plus their lunch break. Changes
        take effect on the public booking pages immediately, because
        availability is calculated from this rather than from a fixed list of
        slots.
      </p>

      <div className="mt-5 flex items-start gap-2.5 rounded-card border border-line-dark bg-blue/10 p-4">
        <Info className="mt-0.5 size-4 shrink-0 text-blue-soft" aria-hidden="true" />
        <p className="text-[0.8125rem] leading-relaxed text-white/70">
          Clinic opening hours cap all of this. A dentist rostered until 18:00
          at a practice that closes at 17:00 can only be booked until 17:00.
          One-off absences are better recorded as blocked time in the diary
          than by editing the weekly pattern.
        </p>
      </div>

      <div className="mt-8 flex flex-col gap-8">
        {dentists.map((dentist) => {
          const upcoming = dentist.blockedTimes.filter(
            (block) => block.endTime >= new Date(),
          );

          return (
            <section
              key={dentist.id}
              className="rounded-card border border-line-dark bg-white/[0.02] p-5"
              aria-labelledby={`dentist-${dentist.id}`}
            >
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <h2
                  id={`dentist-${dentist.id}`}
                  className="text-[1.0625rem] font-semibold text-white"
                >
                  {dentist.title} {dentist.firstName} {dentist.lastName}
                </h2>
                <p className="text-[0.8125rem] text-white/50">{dentist.role}</p>
              </div>

              <ScheduleEditor
                dentistId={dentist.id}
                dentistName={`${dentist.title} ${dentist.lastName}`}
                initial={dentist.schedules.map((s) => ({
                  dayOfWeek: s.dayOfWeek,
                  startMinutes: s.startMinutes,
                  endMinutes: s.endMinutes,
                  breakStartMinutes: s.breakStartMinutes,
                  breakEndMinutes: s.breakEndMinutes,
                }))}
              />

              {/* Upcoming leave and blocks, read only here. They are managed
                  from the diary, where the surrounding appointments are
                  visible. */}
              <div className="mt-6 border-t border-line-dark pt-5">
                <h3 className="flex items-center gap-2 text-[0.8125rem] font-semibold text-white">
                  <CalendarClock className="size-3.5 text-white/50" aria-hidden="true" />
                  Upcoming leave and blocked time
                </h3>
                {upcoming.length === 0 ? (
                  <p className="mt-2 text-[0.8125rem] text-white/45">
                    Nothing booked off. Add leave from the diary.
                  </p>
                ) : (
                  <ul className="mt-3 flex flex-col gap-1.5">
                    {upcoming.map((block) => {
                      const from = todayLocalDate(block.startTime);
                      const to = todayLocalDate(block.endTime);
                      return (
                        <li
                          key={block.id}
                          className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5 rounded-panel bg-white/[0.04] px-3 py-2"
                        >
                          <span className="text-[0.8125rem] font-medium text-white">
                            {BLOCK_REASON_LABELS[block.reason as BlockReason] ??
                              block.reason}
                          </span>
                          <span className="text-[0.75rem] tabular-nums text-white/55">
                            {from === to
                              ? formatLocalDateShort(from)
                              : `${formatLocalDateShort(from)} to ${formatLocalDateShort(to)}`}
                          </span>
                          {block.note && (
                            <span className="text-[0.75rem] text-white/40">
                              {block.note}
                            </span>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
