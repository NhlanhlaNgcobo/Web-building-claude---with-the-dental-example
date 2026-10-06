'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { AlertTriangle, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';

/**
 * Staff sign in.
 *
 * The `next` parameter is checked before it is used. Only a same-origin path
 * beginning with /admin is honoured; anything else falls back to the
 * dashboard. Without that check, a link to
 * /admin/login?next=https://somewhere-else would turn our own sign-in page
 * into a redirect somebody could use for phishing.
 */
function safeNext(value: string): string {
  if (!value.startsWith('/admin')) return '/admin';
  // Protocol-relative URLs start with // and would leave the site.
  if (value.startsWith('//')) return '/admin';
  return value;
}

export function StaffLoginForm({ next }: { readonly next: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [signingIn, setSigningIn] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (signingIn) return;

    const form = new FormData(event.currentTarget);
    setSigningIn(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: String(form.get('password') ?? '') }),
      });

      if (response.ok) {
        router.replace(safeNext(next));
        router.refresh();
        return;
      }

      const body = (await response.json()) as { error?: { message?: string } };
      setError(body.error?.message ?? 'That password is not right.');
    } catch {
      setError('Could not reach the server. Check the connection and retry.');
    } finally {
      setSigningIn(false);
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      <TextField
        name="password"
        label="Staff password"
        type="password"
        required
        autoComplete="current-password"
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

      <Button type="submit" block loading={signingIn} loadingLabel="Signing in">
        <LogIn className="size-4" aria-hidden="true" />
        Sign in
      </Button>
    </form>
  );
}
