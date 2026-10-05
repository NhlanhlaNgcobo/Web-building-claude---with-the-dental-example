'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { CalendarPlus, CheckCircle2, Plus, ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/cn';

/**
 * Add an appointment from the diary, for telephone and walk-in bookings.
 *
 * The override checkbox is the interesting part. It lets reception place an
 * appointment outside the normal rules: before opening, during a lunch break,
 * inside the minimum lead time, on a day a dentist does not usually work.
 * Those are policy, and a human looking at the diary can reasonably decide to
 * break policy.
 *
 * It does not, and cannot, override the overlap check. The server refuses a
 * double booking regardless of this flag, and the label says so plainly so
 * nobody expects otherwise.
 */
export function CreateAppointmentPanel({
  dentists,
  services,
  defaultDate,
}: {
  readonly dentists: readonly { id: string; name: string }[];
  readonly services: readonly {
    id: string;
    slug: string;
    name: string;
    durationMinutes: number;
  }[];
  readonly defaultDate: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [serviceSlug, setServiceSlug] = useState(services[0]?.slug ?? '');
  const [dentistId, setDentistId] = useState('any');
  const [date, setDate] = useState(defaultDate);
  const [time, setTime] = useState('09:00');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [source, setSource] = useState<'phone' | 'walk_in' | 'admin'>('phone');
  const [override, setOverride] = useState(false);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<string | null>(null);

  function toMinutes(value: string): number {
    const [h, m] = value.split(':').map(Number);
    return (h ?? 0) * 60 + (m ?? 0);
  }

  async function submit() {
    setWorking(true);
    setError(null);
    setCreated(null);

    const minutes = toMinutes(time);
    if (minutes % 15 !== 0) {
      setError('Appointment times must fall on a quarter hour.');
      setWorking(false);
      return;
    }

    try {
      const response = await fetch('/api/admin/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service: serviceSlug,
          dentist: dentistId,
          date,
          startMinutes: minutes,
          patient: {
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            email: email.trim(),
            mobile: mobile.trim(),
            isExistingPatient: true,
          },
          notes: notes.trim() || undefined,
          source,
          overrideAvailability: override,
        }),
      });

      if (!response.ok) {
        const body = (await response.json()) as {
          error?: { message?: string };
        };
        setError(
          body.error?.message ?? 'That appointment could not be created.',
        );
        return;
      }

      const body = (await response.json()) as { reference: string };
      setCreated(body.reference);
      setFirstName('');
      setLastName('');
      setMobile('');
      setEmail('');
      setNotes('');
      router.refresh();
    } catch {
      setError('Could not reach the server. Please try again.');
    } finally {
      setWorking(false);
    }
  }

  const inputClasses =
    'h-9 w-full rounded-panel border border-line-dark bg-white/[0.06] px-2.5 ' +
    'text-[0.8125rem] text-white placeholder:text-white/30 ' +
    'focus:border-blue focus:outline-none';

  const labelClasses = 'text-[0.75rem] font-medium text-white/70';

  return (
    <section
      className="rounded-card border border-line-dark bg-white/[0.02] p-4"
      aria-labelledby="create-heading"
    >
      <div className="flex items-center justify-between gap-3">
        <h2
          id="create-heading"
          className="flex items-center gap-2 text-[0.9375rem] font-semibold text-white"
        >
          <CalendarPlus className="size-4 text-white/50" aria-hidden="true" />
          Add appointment
        </h2>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="create-form"
          className="flex h-8 items-center gap-1.5 rounded-panel border border-line-dark px-2.5 text-[0.75rem] font-medium text-white/70 transition-colors duration-[--duration-feedback] hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          <Plus className="size-3.5" aria-hidden="true" />
          {open ? 'Close' : 'Add'}
        </button>
      </div>

      {created && (
        <p
          role="status"
          className="mt-3 flex items-start gap-2 rounded-panel bg-[--color-positive]/15 p-3 text-[0.8125rem] text-[#75e0a7]"
        >
          <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          Created as <span className="font-semibold tabular-nums">{created}</span>
        </p>
      )}

      {open && (
        <form
          id="create-form"
          className="mt-4 flex flex-col gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            void submit();
          }}
        >
          <label className="flex flex-col gap-1.5">
            <span className={labelClasses}>Appointment type</span>
            <select
              value={serviceSlug}
              onChange={(event) => setServiceSlug(event.target.value)}
              className={inputClasses}
            >
              {services.map((service) => (
                <option key={service.id} value={service.slug}>
                  {service.name} ({service.durationMinutes} min)
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className={labelClasses}>Dentist</span>
            <select
              value={dentistId}
              onChange={(event) => setDentistId(event.target.value)}
              className={inputClasses}
            >
              <option value="any">First available</option>
              {dentists.map((dentist) => (
                <option key={dentist.id} value={dentist.id}>
                  {dentist.name}
                </option>
              ))}
            </select>
          </label>

          <div className="grid grid-cols-2 gap-2">
            <label className="flex flex-col gap-1.5">
              <span className={labelClasses}>Date</span>
              <input
                type="date"
                required
                value={date}
                onChange={(event) => setDate(event.target.value)}
                className={inputClasses}
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={labelClasses}>Time</span>
              <input
                type="time"
                required
                step={900}
                value={time}
                onChange={(event) => setTime(event.target.value)}
                className={inputClasses}
              />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <label className="flex flex-col gap-1.5">
              <span className={labelClasses}>First name</span>
              <input
                type="text"
                required
                value={firstName}
                onChange={(event) => setFirstName(event.target.value)}
                className={inputClasses}
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={labelClasses}>Surname</span>
              <input
                type="text"
                required
                value={lastName}
                onChange={(event) => setLastName(event.target.value)}
                className={inputClasses}
              />
            </label>
          </div>

          <label className="flex flex-col gap-1.5">
            <span className={labelClasses}>Mobile</span>
            <input
              type="tel"
              required
              placeholder="082 123 4567"
              value={mobile}
              onChange={(event) => setMobile(event.target.value)}
              className={inputClasses}
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className={labelClasses}>Email</span>
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className={inputClasses}
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className={labelClasses}>Note</span>
            <input
              type="text"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Optional"
              className={inputClasses}
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className={labelClasses}>Booked via</span>
            <select
              value={source}
              onChange={(event) =>
                setSource(event.target.value as typeof source)
              }
              className={inputClasses}
            >
              <option value="phone">Telephone</option>
              <option value="walk_in">Walk in</option>
              <option value="admin">Staff</option>
            </select>
          </label>

          <label
            className={cn(
              'flex items-start gap-2.5 rounded-panel border p-3',
              override
                ? 'border-[--color-caution] bg-[--color-caution]/10'
                : 'border-line-dark',
            )}
          >
            <input
              type="checkbox"
              checked={override}
              onChange={(event) => setOverride(event.target.checked)}
              className="mt-0.5 size-4 shrink-0 accent-blue"
            />
            <span>
              <span className="flex items-center gap-1.5 text-[0.8125rem] font-medium text-white">
                <ShieldAlert className="size-3.5 shrink-0" aria-hidden="true" />
                Ignore opening hours and lead time
              </span>
              <span className="mt-1 block text-[0.75rem] leading-relaxed text-white/55">
                Allows a slot outside normal hours, during a break, or at short
                notice. Double bookings are still refused.
              </span>
            </span>
          </label>

          {error && (
            <p role="alert" className="text-[0.75rem] leading-relaxed text-[#ff9c93]">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={working}
            className="flex h-10 items-center justify-center rounded-panel bg-white text-[0.8125rem] font-semibold text-ink transition-colors duration-[--duration-feedback] hover:bg-canvas disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            {working ? 'Creating' : 'Create appointment'}
          </button>
        </form>
      )}
    </section>
  );
}
