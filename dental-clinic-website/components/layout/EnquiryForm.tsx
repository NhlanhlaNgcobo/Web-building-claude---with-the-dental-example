'use client';

import Link from 'next/link';
import { useState } from 'react';
import { AlertCircle, CheckCircle2, Send } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Button } from '@/components/ui/Button';
import {
  CheckboxField,
  TextAreaField,
  TextField,
} from '@/components/ui/TextField';
import { clinic } from '@/data/clinic';

/**
 * General enquiry form.
 *
 * Deliberately not the primary call to action on the contact page. For an
 * appointment the booking flow is faster and more certain, and for anything
 * urgent the telephone is. This is for the genuine remainder: questions about
 * records, fees or whether we can help with something specific.
 */

const subjects = [
  { value: 'appointment', label: 'An appointment' },
  { value: 'treatment', label: 'A treatment question' },
  { value: 'fees', label: 'Fees or a quote' },
  { value: 'records', label: 'Records or a referral' },
  { value: 'other', label: 'Something else' },
] as const;

export function EnquiryForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [subject, setSubject] = useState<string>('appointment');
  const [message, setMessage] = useState('');
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [sent, setSent] = useState<string | null>(null);

  if (sent) {
    return (
      <div className="rounded-card border border-[--color-positive] bg-[--color-positive-soft] p-6">
        <span className="flex size-10 items-center justify-center rounded-full bg-white text-[--color-positive]">
          <CheckCircle2 className="size-5" aria-hidden="true" />
        </span>
        <h3 className="mt-4 text-[1.0625rem] font-semibold text-[--color-positive]">
          Message received
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-[--color-positive]">
          {sent}
        </p>
        <a
          href={`tel:${clinic.telephone.e164}`}
          className="mt-4 inline-flex text-sm font-semibold text-[--color-positive] underline underline-offset-2"
        >
          {clinic.telephone.display}
        </a>
      </div>
    );
  }

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (name.trim().length === 0) next.name = 'Enter your name';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) {
      next.email = 'Enter a valid email address';
    }
    if (message.trim().length < 10) {
      next.message = 'Please tell us a little more so we can help';
    }
    if (!consent) {
      next.consent = 'Please consent to us storing your details to reply';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    setSubmitError(null);
    try {
      const response = await fetch('/api/enquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim() || undefined,
          subject,
          message: message.trim(),
          popiaConsent: true,
        }),
      });

      if (!response.ok) {
        const body = (await response.json()) as {
          error?: { message?: string };
        };
        setSubmitError(
          body.error?.message ?? 'We could not send that. Please try again.',
        );
        return;
      }

      const result = (await response.json()) as { message: string };
      setSent(result.message);
    } catch {
      setSubmitError(
        'We could not reach the practice. Please check your connection, or phone reception.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form noValidate onSubmit={submit}>
      <div className="flex flex-col gap-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField
            name="name"
            label="Name"
            required
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={errors.name}
          />
          <TextField
            name="email"
            label="Email address"
            type="email"
            inputMode="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={errors.email}
          />
        </div>

        <TextField
          name="phone"
          label="Contact number"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="031 100 4500 or 082 123 4567"
          description="If you would rather we phoned you back."
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          error={errors.phone}
        />

        <fieldset>
          <legend className="text-[0.8125rem] font-medium text-charcoal">
            What is this about?
          </legend>
          <div className="mt-2.5 flex flex-wrap gap-2">
            {subjects.map((option) => (
              <label
                key={option.value}
                className={cn(
                  'flex cursor-pointer items-center gap-2 rounded-panel border px-3 py-2 text-[0.8125rem]',
                  'transition-[border-color,background-color] duration-[--duration-feedback] ease-out',
                  'has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-blue',
                  subject === option.value
                    ? 'border-blue bg-blue-tint text-ink'
                    : 'border-line-strong bg-white text-charcoal hover:border-blue/40',
                )}
              >
                <input
                  type="radio"
                  name="subject"
                  value={option.value}
                  checked={subject === option.value}
                  onChange={() => setSubject(option.value)}
                  className="size-3.5 shrink-0 accent-blue"
                />
                {option.label}
              </label>
            ))}
          </div>
        </fieldset>

        <TextAreaField
          name="message"
          label="Your message"
          required
          rows={5}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          error={errors.message}
        />

        <CheckboxField
          name="consent"
          checked={consent}
          onChange={setConsent}
          error={errors.consent}
          label={
            <>
              I agree that my details may be stored so the practice can reply,
              as set out in the{' '}
              <Link
                href="/legal/privacy"
                target="_blank"
                className="font-medium text-blue underline decoration-blue/30 underline-offset-2 hover:decoration-blue"
              >
                privacy notice
              </Link>
              .
            </>
          }
        />

        {/* Hidden from people, filled by bots. No captcha service needed. */}
        <div aria-hidden="true" className="hidden">
          <label htmlFor="company">Company</label>
          <input id="company" name="company" type="text" tabIndex={-1} />
        </div>

        {submitError && (
          <div
            role="alert"
            className="flex items-start gap-2.5 rounded-card border border-[--color-critical] bg-[--color-critical-soft] p-4"
          >
            <AlertCircle
              className="mt-0.5 size-4 shrink-0 text-[--color-critical]"
              aria-hidden="true"
            />
            <p className="text-[0.8125rem] leading-relaxed text-[--color-critical]">
              {submitError}
            </p>
          </div>
        )}

        <Button
          type="submit"
          size="lg"
          loading={submitting}
          loadingLabel="Sending"
          className="self-start"
        >
          <Send className="size-4" aria-hidden="true" />
          Send enquiry
        </Button>

        <p className="text-xs leading-relaxed text-grey-strong">
          We reply during opening hours. Please do not include clinical details
          or anything sensitive in this form. For an appointment, booking online
          is quicker, and for anything urgent please phone.
        </p>
      </div>
    </form>
  );
}
