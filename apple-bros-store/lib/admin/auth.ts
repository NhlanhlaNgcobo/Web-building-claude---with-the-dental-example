import 'server-only';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { ADMIN_COOKIE, isValidSessionValue } from './session';

/**
 * Server-side staff authentication.
 *
 * Every admin page and route handler calls one of these rather than trusting
 * that the proxy ran. Defence in depth: the proxy can be bypassed by a
 * configuration mistake or a matcher that does not cover a new route, and the
 * consequence here is patient data.
 */

export async function isStaffAuthenticated(): Promise<boolean> {
  const store = await cookies();
  return isValidSessionValue(store.get(ADMIN_COOKIE)?.value);
}

/** For pages. Redirects to sign in when not authenticated. */
export async function requireStaffPage(nextPath = '/admin'): Promise<void> {
  if (!(await isStaffAuthenticated())) {
    redirect(`/admin/login?next=${encodeURIComponent(nextPath)}`);
  }
}

/** For route handlers. Returns false so the caller can respond with 401. */
export async function requireStaffApi(): Promise<boolean> {
  return isStaffAuthenticated();
}

/**
 * Verify the staff password.
 *
 * Compared in constant time so the comparison cannot be used to work out the
 * password one character at a time. A single shared password suits a single
 * practice; see lib/admin/session.ts for where to swap in per-user accounts.
 */
export function verifyStaffPassword(candidate: string): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected || expected.length === 0) return false;

  const a = new TextEncoder().encode(candidate);
  const b = new TextEncoder().encode(expected);
  if (a.length !== b.length) return false;

  let mismatch = 0;
  for (let i = 0; i < a.length; i += 1) mismatch |= a[i]! ^ b[i]!;
  return mismatch === 0;
}
