import { NextResponse } from 'next/server';
import { z } from 'zod';
import { verifyStaffPassword } from '@/lib/admin/auth';
import {
  ADMIN_COOKIE,
  SESSION_COOKIE_OPTIONS,
  createSessionValue,
} from '@/lib/admin/session';
import { fail, parseJson } from '@/lib/api/respond';

/**
 * Staff sign in and sign out.
 *
 * A failed attempt is answered after a short fixed delay, which takes the
 * cheapest edge off automated guessing without pretending to be real rate
 * limiting. For production, put a proper limiter in front of this route.
 */
export const dynamic = 'force-dynamic';

const Body = z.object({
  password: z.string().min(1, 'Enter the staff password').max(200),
});

export async function POST(request: Request) {
  const parsed = await parseJson(request, Body);
  if (!parsed.ok) return parsed.response;

  if (!verifyStaffPassword(parsed.data.password)) {
    await new Promise((resolve) => setTimeout(resolve, 600));
    return fail('UNAUTHORIZED', 'That password is not correct.', 401);
  }

  const response = NextResponse.json(
    { signedIn: true },
    { headers: { 'Cache-Control': 'no-store' } },
  );
  response.cookies.set(
    ADMIN_COOKIE,
    await createSessionValue(),
    SESSION_COOKIE_OPTIONS,
  );
  return response;
}

export async function DELETE() {
  const response = NextResponse.json(
    { signedOut: true },
    { headers: { 'Cache-Control': 'no-store' } },
  );
  response.cookies.set(ADMIN_COOKIE, '', {
    ...SESSION_COOKIE_OPTIONS,
    maxAge: 0,
  });
  return response;
}
