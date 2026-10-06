'use client';

import { useState } from 'react';
import { AlertTriangle, Check, Send } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import {
  CheckboxField,
  TextAreaField,
  TextField,
} from '@/components/ui/TextField';

/**
 * The enquiry form.
 *
 * Five fields. Every one of them is something we need in order to answer, which
 * is the test a field has to pass to be here. There is no "how did you hear
 * about us", because that is our curiosity rather than the customer's errand.
 */
export function EnquiryForm() {
  const [sent, setSent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [marketingOptIn, setMarketingOptIn] = useState(false);
  const [sending, setSending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sending) return;

    const form = new FormData(event.currentTarget);
    setSending(true);
    setError(null);
    setFieldErrors({});

    try {
      const response = await fetch('/api/enquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: String(form.get('name') ?? ''),
          email: String(form.get('email') ?? ''),
          mobile: String(form.get('mobile') ?? '') || undefined,
          subject: String(form.get('subject') ?? ''),
          message: String(form.get('message') ?? ''),
          marketingOptIn,
        }),
      });
      const body: unknown = await response.json();

      if (response.ok) {
        const data = body as { fallback: string };
        setSent(data.fallback);
        return;
      }

      const failure = body as {
        error?: { message?: string; fieldErrors?: Record<string, string[]> };
      };
      setFieldErrors(failure.error?.fieldErrors ?? {});
      setError(
        failure.error?.message ??
          'We could not send that. Please check the fields and try again.',
      );
    } catch {
      setError(
        'We could not reach the shop just then. Check your connection, or phone us instead.',
      );
    } finally {
      setSending(false);
    }
  }

  if (sent) {
    return (
      <div className="rounded-card border border-line bg-paper p-6">
        <span className="flex size-10 items-center justify-center rounded-full bg-leaf-soft">
          <Check className="size-5 text-leaf" aria-hidden="true" />
        </span>
        <h2 className="mt-4 text-[1.125rem] font-bold text-ink">
          That is with us
        </h2>
        <p className="mt-2 text-pretty text-[0.9375rem] leading-relaxed text-grey-strong">
          {sent}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          name="name"
          label="Your name"
          required
          autoComplete="name"
          error={fieldErrors.name?.[0]}
        />
        <TextField
          name="email"
          label="Email"
          type="email"
          inputMode="email"
          required
          autoComplete="email"
          error={fieldErrors.email?.[0]}
        />
      </div>

      <TextField
        name="mobile"
        label="Mobile number"
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        placeholder="082 123 4567"
        description="Only if you would rather we phoned you back."
        error={fieldErrors.mobile?.[0]}
      />

      <TextField
        name="subject"
        label="What is it about?"
        required
        placeholder="Stock on an iPhone 14, a warranty question, something else"
        error={fieldErrors.subject?.[0]}
      />

      <TextAreaField
        name="message"
        label="Your message"
        required
        rows={5}
        error={fieldErrors.message?.[0]}
      />

      <CheckboxField
        name="marketingOptIn"
        checked={marketingOptIn}
        onChange={setMarketingOptIn}
        label="Email me when stock I might want comes in. Not more than twice a month."
      />

      {error && (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-panel border border-red/30 bg-red-soft p-3 text-[0.8125rem] leading-relaxed text-ink"
        >
          <AlertTriangle
            className="mt-0.5 size-4 shrink-0 text-red-deep"
            aria-hidden="true"
          />
          {error}
        </p>
      )}

      <Button
        type="submit"
        size="lg"
        className="self-start"
        loading={sending}
        loadingLabel="Sending"
      >
        <Send className="size-4" aria-hidden="true" />
        Send it
      </Button>

      <p className="text-[0.75rem] leading-relaxed text-grey">
        We use what you send here to answer you and nothing else. It is not
        stored in a customer database and it is not passed on.
      </p>
    </form>
  );
}
