'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { Ban, Siren, User } from 'lucide-react';
import { cn } from '@/lib/cn';
import { BLOCK_REASON_LABELS, type BlockReason } from '@/lib/domain/enums';
import type { DiaryAppointment, DiaryBlock, DiaryDay } from '@/lib/admin/queries';
import { AppointmentDrawer } from './AppointmentDrawer';

/**
 * The practice diary.
 *
 * Appointments are positioned by time rather than listed, because the thing
 * reception needs to see is the shape of the day: where the gaps are, what is
 * stacked against what, and which periods are blocked.
 *
 * Positioning is plain arithmetic on minutes from midnight, which is why the
 * query layer returns minutes rather than dates. Overlapping appointments,
 * which can legitimately exist across different dentists, are laid out side by
 * side within their column.
 */

/** Pixels per minute. 1.1 gives a 30 minute appointment a comfortable height. */
const PX_PER_MINUTE = 1.1;

/** Half-open overlap, the same rule the availability engine uses. */
function overlaps(
  a: { startMinutes: number; endMinutes: number },
  b: { startMinutes: number; endMinutes: number },
): boolean {
  return a.startMinutes < b.endMinutes && b.startMinutes < a.endMinutes;
}

/**
 * Lay out appointments into side-by-side lanes so that two that overlap are
 * both visible rather than one hiding the other.
 */
function assignLanes(appointments: readonly DiaryAppointment[]) {
  const lanes: DiaryAppointment[][] = [];
  const placement = new Map<string, { lane: number; of: number }>();

  for (const appointment of appointments) {
    let laneIndex = lanes.findIndex(
      (lane) => !lane.some((other) => overlaps(appointment, other)),
    );
    if (laneIndex === -1) {
      lanes.push([]);
      laneIndex = lanes.length - 1;
    }
    lanes[laneIndex]!.push(appointment);
    placement.set(appointment.id, { lane: laneIndex, of: 1 });
  }

  // Width is decided by how many lanes a given appointment actually competes
  // with, not by the busiest moment of the whole day.
  for (const appointment of appointments) {
    const competing = appointments.filter((other) =>
      overlaps(appointment, other),
    );
    const lanesUsed = new Set(
      competing.map((other) => placement.get(other.id)!.lane),
    );
    placement.set(appointment.id, {
      lane: placement.get(appointment.id)!.lane,
      of: Math.max(lanesUsed.size, 1),
    });
  }

  return placement;
}

const statusStyles: Record<string, string> = {
  confirmed: 'bg-blue/25 border-blue/60 text-white',
  pending: 'bg-[--color-caution]/20 border-[--color-caution]/60 text-[#fdb022]',
  completed: 'bg-white/[0.08] border-white/20 text-white/70',
  no_show: 'bg-[--color-critical]/15 border-[--color-critical]/50 text-[#ff9c93]',
  cancelled:
    'bg-transparent border-white/15 text-white/35 line-through decoration-white/30',
};

export function DiaryCalendar({
  days,
  dentistNames,
}: {
  readonly days: readonly DiaryDay[];
  readonly dentistNames: Readonly<Record<string, string>>;
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<DiaryAppointment | null>(null);

  // The visible window: the widest clinic opening across the shown days, with
  // a little padding, so an early block or a late appointment is not clipped.
  const { windowStart, windowEnd } = useMemo(() => {
    let start = 8 * 60;
    let end = 17 * 60;
    for (const day of days) {
      if (!day.isClosed) {
        start = Math.min(start, day.openMinutes);
        end = Math.max(end, day.closeMinutes);
      }
      for (const a of day.appointments) {
        start = Math.min(start, a.startMinutes);
        end = Math.max(end, a.endMinutes);
      }
      for (const b of day.blocks) {
        if (b.endMinutes - b.startMinutes < 600) {
          start = Math.min(start, b.startMinutes);
          end = Math.max(end, b.endMinutes);
        }
      }
    }
    return {
      windowStart: Math.max(Math.floor(start / 60) * 60 - 0, 0),
      windowEnd: Math.min(Math.ceil(end / 60) * 60, 1440),
    };
  }, [days]);

  const totalMinutes = windowEnd - windowStart;
  const gridHeight = totalMinutes * PX_PER_MINUTE;

  const hourMarks = useMemo(() => {
    const marks: number[] = [];
    for (let m = windowStart; m <= windowEnd; m += 60) marks.push(m);
    return marks;
  }, [windowStart, windowEnd]);

  return (
    <>
      <div className="scroll-x rounded-card border border-line-dark bg-white/[0.02]">
        <div
          className="flex min-w-fit"
          style={{ minWidth: days.length > 1 ? `${days.length * 11}rem` : undefined }}
        >
          {/* Time gutter */}
          <div className="sticky left-0 z-raised w-14 shrink-0 border-r border-line-dark bg-ink">
            <div className="h-10 border-b border-line-dark" />
            <div className="relative" style={{ height: gridHeight }}>
              {hourMarks.map((minutes) => (
                <div
                  key={minutes}
                  className="absolute right-2 -translate-y-1/2 text-[0.6875rem] tabular-nums text-white/40"
                  style={{ top: (minutes - windowStart) * PX_PER_MINUTE }}
                >
                  {String(Math.floor(minutes / 60)).padStart(2, '0')}:00
                </div>
              ))}
            </div>
          </div>

          {/* Day columns */}
          {days.map((day) => {
            const placement = assignLanes(
              day.appointments.filter((a) => a.status !== 'cancelled'),
            );
            const cancelled = day.appointments.filter(
              (a) => a.status === 'cancelled',
            );

            return (
              <div
                key={day.date}
                className="min-w-0 flex-1 border-r border-line-dark last:border-r-0"
              >
                {/* Column header */}
                <div className="flex h-10 items-center justify-between gap-2 border-b border-line-dark px-3">
                  <span className="truncate text-[0.8125rem] font-semibold text-white">
                    {day.weekday}{' '}
                    <span className="font-normal tabular-nums text-white/50">
                      {Number(day.date.slice(8, 10))}
                    </span>
                  </span>
                  <span className="shrink-0 text-[0.6875rem] tabular-nums text-white/40">
                    {day.isClosed
                      ? 'Closed'
                      : `${day.appointments.filter((a) => a.status !== 'cancelled').length}`}
                  </span>
                </div>

                <div
                  className="relative"
                  style={{ height: gridHeight }}
                >
                  {/* Hour lines */}
                  {hourMarks.map((minutes) => (
                    <div
                      key={minutes}
                      aria-hidden="true"
                      className="absolute inset-x-0 border-t border-white/[0.06]"
                      style={{ top: (minutes - windowStart) * PX_PER_MINUTE }}
                    />
                  ))}

                  {/* Outside opening hours */}
                  {!day.isClosed && (
                    <>
                      {day.openMinutes > windowStart && (
                        <div
                          aria-hidden="true"
                          className="absolute inset-x-0 bg-white/[0.02]"
                          style={{
                            top: 0,
                            height:
                              (day.openMinutes - windowStart) * PX_PER_MINUTE,
                          }}
                        />
                      )}
                      {day.closeMinutes < windowEnd && (
                        <div
                          aria-hidden="true"
                          className="absolute inset-x-0 bg-white/[0.02]"
                          style={{
                            top:
                              (day.closeMinutes - windowStart) * PX_PER_MINUTE,
                            height:
                              (windowEnd - day.closeMinutes) * PX_PER_MINUTE,
                          }}
                        />
                      )}
                    </>
                  )}

                  {day.isClosed && (
                    <div className="absolute inset-0 flex items-start justify-center bg-white/[0.03] pt-6">
                      <span className="text-[0.6875rem] uppercase text-white/30">
                        Closed
                      </span>
                    </div>
                  )}

                  {/* Blocked periods, behind appointments */}
                  {day.blocks.map((block) => (
                    <BlockBand
                      key={block.id}
                      block={block}
                      windowStart={windowStart}
                      dentistName={
                        block.dentistId
                          ? dentistNames[block.dentistId]
                          : undefined
                      }
                    />
                  ))}

                  {/* Appointments */}
                  {day.appointments
                    .filter((a) => a.status !== 'cancelled')
                    .map((appointment) => {
                      const place = placement.get(appointment.id)!;
                      const top =
                        (appointment.startMinutes - windowStart) * PX_PER_MINUTE;
                      const height = Math.max(
                        (appointment.endMinutes - appointment.startMinutes) *
                          PX_PER_MINUTE,
                        22,
                      );
                      const width = 100 / place.of;

                      return (
                        <button
                          key={appointment.id}
                          type="button"
                          onClick={() => setSelected(appointment)}
                          className={cn(
                            'absolute overflow-hidden rounded-[4px] border px-2 py-1 text-left',
                            'transition-[filter,border-color] duration-[--duration-feedback] ease-out',
                            'hover:brightness-125',
                            'focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-white',
                            statusStyles[appointment.status] ??
                              statusStyles.confirmed,
                          )}
                          style={{
                            top,
                            height,
                            left: `calc(${place.lane * width}% + 2px)`,
                            width: `calc(${width}% - 4px)`,
                          }}
                        >
                          <span className="flex items-center gap-1">
                            {appointment.isEmergency && (
                              <Siren
                                className="size-3 shrink-0"
                                aria-label="Urgent"
                              />
                            )}
                            <span className="truncate text-[0.6875rem] font-semibold tabular-nums">
                              {appointment.startLabel}
                            </span>
                          </span>
                          <span className="block truncate text-[0.6875rem] leading-tight opacity-90">
                            {appointment.patient.name}
                          </span>
                          {height > 44 && (
                            <span className="block truncate text-[0.625rem] leading-tight opacity-60">
                              {appointment.service.name}
                            </span>
                          )}
                          {height > 62 && (
                            <span className="block truncate text-[0.625rem] leading-tight opacity-60">
                              {appointment.dentist.name}
                            </span>
                          )}
                        </button>
                      );
                    })}
                </div>

                {/* Cancelled, listed below rather than cluttering the grid */}
                {cancelled.length > 0 && (
                  <div className="border-t border-line-dark px-3 py-2">
                    <p className="text-[0.625rem] uppercase text-white/30">
                      Cancelled
                    </p>
                    <ul className="mt-1 flex flex-col gap-1">
                      {cancelled.map((appointment) => (
                        <li key={appointment.id}>
                          <button
                            type="button"
                            onClick={() => setSelected(appointment)}
                            className="w-full truncate text-left text-[0.6875rem] text-white/35 line-through decoration-white/25 hover:text-white/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                          >
                            {appointment.startLabel} {appointment.patient.name}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <AppointmentDrawer
        appointment={selected}
        onClose={() => setSelected(null)}
        onChanged={() => {
          setSelected(null);
          router.refresh();
        }}
      />
    </>
  );
}

function BlockBand({
  block,
  windowStart,
  dentistName,
}: {
  readonly block: DiaryBlock;
  readonly windowStart: number;
  readonly dentistName: string | undefined;
}) {
  const top = (block.startMinutes - windowStart) * PX_PER_MINUTE;
  const height = Math.max(
    (block.endMinutes - block.startMinutes) * PX_PER_MINUTE,
    18,
  );
  const label = BLOCK_REASON_LABELS[block.reason as BlockReason] ?? 'Blocked';

  /**
   * The diagonal hatch is the one gradient in this project, and it is here for
   * accessibility rather than decoration: blocked time has to be
   * distinguishable from an appointment without relying on colour, and a hatch
   * plus a dashed border is the conventional way a diary shows "unavailable".
   * It is a static background on a small element and is never animated.
   */
  return (
    <div
      className="absolute inset-x-0.5 overflow-hidden rounded-[4px] border border-dashed border-white/20 bg-[repeating-linear-gradient(135deg,rgba(255,255,255,0.05)_0_6px,transparent_6px_12px)] px-2 py-1"
      style={{ top, height }}
      // Not interactive here: blocks are managed from the panel beside the
      // diary, where the full list with notes is visible.
    >
      <span className="flex items-center gap-1 text-[0.625rem] text-white/50">
        <Ban className="size-2.5 shrink-0" aria-hidden="true" />
        <span className="truncate">{label}</span>
      </span>
      {height > 38 && (
        <span className="flex items-center gap-1 text-[0.625rem] text-white/35">
          <User className="size-2.5 shrink-0" aria-hidden="true" />
          <span className="truncate">
            {dentistName ?? 'Whole practice'}
          </span>
        </span>
      )}
    </div>
  );
}
