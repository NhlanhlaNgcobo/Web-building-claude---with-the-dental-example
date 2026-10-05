'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { AlertCircle, LogIn } from 'lucide-react';
import { cn } from '@/lib/cn';

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get('next') ?? '/admin';

  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      if (!response.ok) {
        const body = (await response.json()) as {
          error?: { message?: string };
        };
        setError(body.error?.message ?? 'That password is not correct.');
        setPassword('');
        return;
      }

      // Only ever redirect to a path on this site, so a crafted next parameter
      // cannot turn the sign-in page into an open redirect.
      const safeNext = next.startsWith('/admin') ? next : '/admin';
      router.push(safeNext);
      router.refresh();
    } catch {
      setError('We could not sign you in. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form noValidate onSubmit={submit}>
      <label
        htmlFor="staff-password"
        className="block text-[0.8125rem] font-medium text-white/80"
      >
        Staff password
      </label>
      <input
        id="staff-password"
        type="password"
        autoComplete="current-password"
        required
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? 'staff-password-error' : undefined}
        className={cn(
          'mt-2 h-12 w-full rounded-panel border bg-white/[0.06] px-3.5',
          'text-[0.9375rem] text-white placeholder:text-white/35',
          'transition-[border-color,box-shadow] duration-[--duration-feedback] ease-out',
          'focus:outline-none focus:border-blue focus:shadow-[0_0_0_3px_rgb(20_92_255/0.22)]',
          error ? 'border-[--color-critical]' : 'border-line-dark-strong',
        )}
      />

      {error && (
        <p
          id="staff-password-error"
          role="alert"
          className="mt-2.5 flex items-start gap-1.5 text-xs font-medium text-[#ff9c93]"
        >
          <AlertCircle className="mt-px size-3.5 shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting || password.length === 0}
        className={cn(
          'mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-panel',
          'bg-white text-sm font-semibold text-ink',
          'transition-colors duration-[--duration-feedback] ease-out',
          'hover:bg-canvas disabled:opacity-50 disabled:hover:bg-white',
          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white',
        )}
      >
        <LogIn className="size-4" aria-hidden="true" />
        {submitting ? 'Signing in' : 'Sign in'}
      </button>
    </form>
  );
}
