/**
 * Staff session cookie.
 *
 * Deliberately small: a signed cookie containing an issue time and nothing
 * else. There is no session store to keep in sync and nothing sensitive in the
 * cookie itself.
 *
 * Built on Web Crypto with no Node-only imports, because this module is used
 * by proxy.ts as well as by server components and route handlers, and the
 * proxy runs in the edge runtime.
 *
 * This is a single shared staff password, which suits a single practice. When
 * individual staff accounts are needed, this module is the one place to
 * replace: everything else asks it whether the current request is
 * authenticated.
 */

export const ADMIN_COOKIE = 'hds_staff';

/** Eight hours, which is about one working day. */
const SESSION_TTL_SECONDS = 8 * 60 * 60;

function secretOrThrow(): string {
  const value = process.env.ADMIN_SESSION_SECRET;
  if (!value || value.length < 16) {
    throw new Error(
      'ADMIN_SESSION_SECRET is not set, or is too short. Copy .env.example to .env and set a long random value.',
    );
  }
  return value;
}

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlDecode(value: string): Uint8Array {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(padded.padEnd(Math.ceil(padded.length / 4) * 4, '='));
  return Uint8Array.from(binary, (c) => c.charCodeAt(0));
}

async function sign(payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secretOrThrow()),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(payload),
  );
  return base64UrlEncode(new Uint8Array(signature));
}

/** Constant time comparison, so a signature cannot be guessed byte by byte. */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i += 1) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

export async function createSessionValue(): Promise<string> {
  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;
  const payload = base64UrlEncode(
    new TextEncoder().encode(`staff:${expiresAt}`),
  );
  return `${payload}.${await sign(payload)}`;
}

/**
 * Whether a cookie value is a currently valid staff session.
 *
 * The signature is verified before the expiry is read, so a forged cookie is
 * rejected as a forgery rather than reported as expired.
 */
export async function isValidSessionValue(
  value: string | undefined,
): Promise<boolean> {
  if (!value) return false;

  const parts = value.split('.');
  if (parts.length !== 2) return false;
  const [payload, signature] = parts as [string, string];

  let expected: string;
  try {
    expected = await sign(payload);
  } catch {
    // Missing secret. Fail closed.
    return false;
  }
  if (!timingSafeEqual(signature, expected)) return false;

  let decoded: string;
  try {
    decoded = new TextDecoder().decode(base64UrlDecode(payload));
  } catch {
    return false;
  }

  const [subject, rawExpiry] = decoded.split(':');
  if (subject !== 'staff') return false;

  const expiresAt = Number.parseInt(rawExpiry ?? '', 10);
  if (!Number.isFinite(expiresAt)) return false;
  return expiresAt > Math.floor(Date.now() / 1000);
}

export const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'lax' as const,
  path: '/',
  maxAge: SESSION_TTL_SECONDS,
  // Only sent over HTTPS in production. Left off in development so the cookie
  // works over plain http on localhost.
  secure: process.env.NODE_ENV === 'production',
};
