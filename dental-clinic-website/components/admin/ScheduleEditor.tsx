'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { AlertDialog } from '@base-ui/react/alert-dialog';
import { AlertTriangle, Check, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/cn';
import { formatLocalMinutes } from '@/lib/availability/tz';

/**
 * Weekly roster editor.
 *
 * A row per weekday rather than a free-form list, because a weekly pattern is
 * what this actually is and a grid makes "which days does she work" readable
 * at a glance. Saving replaces the whole pattern, which is the only way
 * "stop working Fridays" can be expressed.
 */

interface Shift {
  dayOfWeek: number;
  startMinutes: number;
  endMinutes: number;
  breakStartMinutes: number | null;
  breakEndMinutes: number | null;
}

const weekdays = [
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
  { value: 0, label: 'Sunday' },
] as const;

function toTime(minutes: number): string {
  return formatLocalMinutes(minutes);
}

function toMinutes(value: string): number {
  const [h, m] = value.split(':').map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

export function ScheduleEditor({
  dentistId,
  dentistName,
  initial,
}: {
  readonly dentistId: string;
  readonly dentistName: string;
  readonly initial: readonly Shift[];
}) {
  const router = useRouter();
  const [shifts, setShifts] = useState<Shift[]>(() => [...initial]);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [conflict, setConflict] = useState<{
    message: string;
    affected: string[];
  } | null>(null);

  const dirty = JSON.stringify(shifts) !== JSON.stringify(initial);

  function shiftFor(day: number): Shift | undefined {
    return shifts.find((s) => s.dayOfWeek === day);
  }

  function toggleDay(day: number, enabled: boolean) {
    setSaved(false);
    setShifts((current) =>
      enabled
        ? [
            ...current,
            {
              dayOfWeek: day,
              startMinutes: 8 * 60,
              endMinutes: day === 6 ? 13 * 60 : 17 * 60,
              breakStartMinutes: day === 6 ? null : 13 * 60,
              breakEndMinutes: day === 6 ? null : 14 * 60,
            },
          ].sort((a, b) => a.dayOfWeek - b.dayOfWeek)
        : current.filter((s) => s.dayOfWeek !== day),
    );
  }

  function patchDay(day: number, patch: Partial<Shift>) {
    setSaved(false);
    setShifts((current) =>
      current.map((s) => (s.dayOfWeek === day ? { ...s, ...patch } : s)),
    );
  }

  async function save(force: boolean) {
    setWorking(true);
    setError(null);
    if (force) setConflict(null);

    try {
      const response = await fetch(
        `/api/admin/dentists/${dentistId}/schedule`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ schedules: shifts, force }),
        },
      );

      if (response.status === 409) {
        const body = (await response.json()) as {
          error?: { message?: string; fieldErrors?: Record<string, string[]> };
        };
        setConflict({
          message:
            body.error?.message ??
            'Some booked appointments fall outside the new pattern.',
          affected: body.error?.fieldErrors?.affected ?? [],
        });
        return;
      }

      if (!response.ok) {
        const body = (await response.json()) as {
          error?: { message?: string };
        };
        setError(body.error?.message ?? 'That pattern could not be saved.');
        return;
      }

      setSaved(true);
      router.refresh();
    } catch {
      setError('Could not reach the server. Please try again.');
    } finally {
      setWorking(false);
    }
  }

  const timeInput =
    'h-8 rounded-panel border border-line-dark bg-white/[0.06] px-2 ' +
    'text-[0.75rem] tabular-nums text-white focus:border-blue focus:outline-none';

  return (
    <div className="mt-5">
      <div className="scroll-x">
        <table className="w-full min-w-[40rem] border-collapse text-left">
          <caption className="sr-only">
            Weekly working pattern for {dentistName}
          </caption>
          <thead>
            <tr>
              {['Day', 'Working', 'Start', 'End', 'Break from', 'Break to'].map(
                (heading) => (
                  <th
                    key={heading}
                    scope="col"
                    className="pb-2 pr-3 text-[0.6875rem] font-semibold uppercase text-white/40"
                    style={{ letterSpacing: '0.06em' }}
                  >
                    {heading}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {weekdays.map((day) => {
              const shift = shiftFor(day.value);
              const working = shift !== undefined;
              const hasBreak =
                shift?.breakStartMinutes !== null &&
                shift?.breakStartMinutes !== undefined;

              return (
                <tr key={day.value} className="border-t border-line-dark">
                  <th
                    scope="row"
                    className={cn(
                      'py-2.5 pr-3 text-[0.8125rem] font-medium',
                      working ? 'text-white' : 'text-white/35',
                    )}
                  >
                    {day.label}
                  </th>
                  <td className="py-2.5 pr-3">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={working}
                        onChange={(event) =>
                          toggleDay(day.value, event.target.checked)
                        }
                        aria-label={`${dentistName} works ${day.label}`}
                        className="size-4 accent-blue"
                      />
                    </label>
                  </td>
                  <td className="py-2.5 pr-3">
                    {working && (
                      <input
                        type="time"
                        step={900}
                        value={toTime(shift!.startMinutes)}
                        onChange={(event) =>
                          patchDay(day.value, {
                            startMinutes: toMinutes(event.target.value),
                          })
                        }
                        aria-label={`${day.label} start`}
                        className={timeInput}
                      />
                    )}
                  </td>
                  <td className="py-2.5 pr-3">
                    {working && (
                      <input
                        type="time"
                        step={900}
                        value={toTime(shift!.endMinutes)}
                        onChange={(event) =>
                          patchDay(day.value, {
                            endMinutes: toMinutes(event.target.value),
                          })
                        }
                        aria-label={`${day.label} end`}
                        className={timeInput}
                      />
                    )}
                  </td>
                  <td className="py-2.5 pr-3">
                    {working && (
                      <input
                        type="time"
                        step={900}
                        value={
                          hasBreak ? toTime(shift!.breakStartMinutes!) : ''
                        }
                        onChange={(event) =>
                          patchDay(day.value, {
                            breakStartMinutes: event.target.value
                              ? toMinutes(event.target.value)
                              : null,
                            breakEndMinutes: event.target.value
                              ? (shift!.breakEndMinutes ??
                                toMinutes(event.target.value) + 60)
                              : null,
                          })
                        }
                        aria-label={`${day.label} break start`}
                        className={timeInput}
                      />
                    )}
                  </td>
                  <td className="py-2.5">
                    {working && hasBreak && (
                      <input
                        type="time"
                        step={900}
                        value={toTime(shift!.breakEndMinutes!)}
                        onChange={(event) =>
                          patchDay(day.value, {
                            breakEndMinutes: toMinutes(event.target.value),
                          })
                        }
                        aria-label={`${day.label} break end`}
                        className={timeInput}
                      />
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {error && (
        <p role="alert" className="mt-3 text-[0.8125rem] text-[#ff9c93]">
          {error}
        </p>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={working || !dirty}
          onClick={() => void save(false)}
          className="flex h-9 items-center gap-2 rounded-panel bg-white px-3.5 text-[0.8125rem] font-semibold text-ink transition-colors duration-[--duration-feedback] hover:bg-canvas disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          <Check className="size-3.5" aria-hidden="true" />
          Save pattern
        </button>
        {dirty && (
          <button
            type="button"
            onClick={() => {
              setShifts([...initial]);
              setError(null);
              setSaved(false);
            }}
            className="flex h-9 items-center gap-2 rounded-panel border border-line-dark px-3.5 text-[0.8125rem] font-medium text-white/70 transition-colors duration-[--duration-feedback] hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            <RotateCcw className="size-3.5" aria-hidden="true" />
            Discard changes
          </button>
        )}
        <span aria-live="polite" className="text-[0.8125rem] text-[#75e0a7]">
          {saved && !dirty ? 'Saved' : ''}
        </span>
      </div>

      {/* Conflict confirmation */}
      <AlertDialog.Root
        open={conflict !== null}
        onOpenChange={(isOpen) => !isOpen && setConflict(null)}
      >
        <AlertDialog.Portal>
          <AlertDialog.Backdrop className="fixed inset-0 z-overlay min-h-dvh bg-black/60 transition-opacity duration-[--duration-feedback] data-starting-style:opacity-0 data-ending-style:opacity-0" />
          <AlertDialog.Popup className="fixed left-1/2 top-1/2 z-modal w-[min(32rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 rounded-card border border-line-dark bg-charcoal p-6 transition-[opacity,transform] duration-[--duration-feedback] ease-out data-starting-style:scale-[0.98] data-starting-style:opacity-0 data-ending-style:scale-[0.98] data-ending-style:opacity-0">
            <AlertDialog.Title className="flex items-center gap-2.5 text-[1.0625rem] font-semibold text-white">
              <AlertTriangle
                className="size-5 shrink-0 text-[#fdb022]"
                aria-hidden="true"
              />
              Appointments outside the new pattern
            </AlertDialog.Title>
            <AlertDialog.Description className="mt-2 text-sm leading-relaxed text-white/65">
              {conflict?.message}
            </AlertDialog.Description>

            {conflict && conflict.affected.length > 0 && (
              <ul className="mt-4 max-h-40 overflow-y-auto rounded-panel bg-white/[0.05] p-3">
                {conflict.affected.map((reference) => (
                  <li
                    key={reference}
                    className="py-0.5 text-[0.8125rem] tabular-nums text-white/80"
                  >
                    {reference}
                  </li>
                ))}
              </ul>
            )}

            <p className="mt-4 text-[0.8125rem] leading-relaxed text-white/55">
              Saving will not cancel them. They stay in the diary and somebody
              needs to contact each patient to rearrange.
            </p>

            <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
              <AlertDialog.Close className="inline-flex h-11 items-center justify-center rounded-panel border border-line-dark-strong px-5 text-sm font-medium text-white transition-colors duration-[--duration-feedback] hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
                Do not save
              </AlertDialog.Close>
              <AlertDialog.Close
                onClick={() => void save(true)}
                className="inline-flex h-11 items-center justify-center rounded-panel bg-[--color-caution] px-5 text-sm font-semibold text-white transition-[filter] duration-[--duration-feedback] hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                Save anyway
              </AlertDialog.Close>
            </div>
          </AlertDialog.Popup>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    </div>
  );
}
