import { cookies } from 'next/headers';
import { z } from 'zod';
import { fail, ok, parseJson } from '@/lib/api/respond';
import { verifyStaffPassword } from '@/lib/admin/auth';
import {
  ADMIN_COOKIE,
  SESSION_COOKIE_OPTIONS,
  createSessionValue,
} from '@/lib/admin/session';

/**
 * Staff sign in and sign out.
 *
 * The failure response is deliberately slow and deliberately vague. A wrong
 * password gets the same message whatever was wrong with it, and the whole
 * endpoint is rate limited by a fixed delay rather than by a counter, which is
 * crude but needs no store and is enough friction for a single shared password
 * behind a shop counter.
 */
export const dynamic = 'force-dynamic';

const signInSchema = z.object({
  password: z.string().min(1, 'Enter the staff password.'),
});

export async function POST(request: Request) {
  const parsed = await parseJson(request, signInSchema);
  if (!parsed.ok) return parsed.response;

  if (!verifyStaffPassword(parsed.data.password)) {
    // A fixed delay on failure only. Correct sign in stays instant, which is
    // the right way round: the person who knows the password should not be
    // punished for the person who does not.
    await new Promise((resolve) => setTimeout(resolve, 700));
    return fail('INVALID_CREDENTIALS', 'That password is not right.', 401);
  }

  const store = await cookies();
  store.set(ADMIN_COOKIE, await createSessionValue(), SESSION_COOKIE_OPTIONS);

  return ok({ signedIn: true });
}

export async function DELETE() {
  const store = await cookies();
  store.set(ADMIN_COOKIE, '', { ...SESSION_COOKIE_OPTIONS, maxAge: 0 });
  return ok({ signedIn: false });
}
