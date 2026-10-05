import 'server-only';

/**
 * Appointment management tokens.
 *
 * A patient who has just booked, or who has proved they hold the booking by
 * supplying the reference plus their own email or mobile number, is given a
 * short-lived signed token. Cancelling and rescheduling require it.
 *
 * The token is bound to one appointment id, so a token issued for booking A
 * cannot be replayed against booking B. It carries no personal information, and
 * it is signed rather than encrypted because there is nothing secret in it.
 *
 * Built on Web Crypto so the same code runs in middleware as in a route
 * handler.
 */

const TOKEN_TTL_SECONDS = 30 * 60;

function secret(): string {
  const value = process.env.ADMIN_SESSION_SECRET;
  if (!value || value.length < 16) {
    throw new Error(
      'ADMIN_SESSION_SECRET is not set. Copy .env.example to .env and set a long random value.',
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

async function hmac(payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret()),
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

/** Constant-time string comparison, so a signature cannot be guessed byte by byte. */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i += 1) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

export async function createManageToken(appointmentId: string): Promise<string> {
  const expiresAt = Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS;
  const payload = base64UrlEncode(
    new TextEncoder().encode(`${appointmentId}:${expiresAt}`),
  );
  return `${payload}.${await hmac(payload)}`;
}

/**
 * Verify a token and return the appointment id it is valid for, or null.
 *
 * The signature is checked before the expiry, so an expired token with a forged
 * signature is rejected as a forgery rather than reported as merely expired.
 */
export async function verifyManageToken(
  token: string,
): Promise<string | null> {
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [payload, signature] = parts as [string, string];

  const expected = await hmac(payload);
  if (!timingSafeEqual(signature, expected)) return null;

  let decoded: string;
  try {
    decoded = new TextDecoder().decode(base64UrlDecode(payload));
  } catch {
    return null;
  }

  const separator = decoded.lastIndexOf(':');
  if (separator === -1) return null;

  const appointmentId = decoded.slice(0, separator);
  const expiresAt = Number.parseInt(decoded.slice(separator + 1), 10);
  if (!Number.isFinite(expiresAt)) return null;
  if (expiresAt < Math.floor(Date.now() / 1000)) return null;
  if (appointmentId.length === 0) return null;

  return appointmentId;
}

/** Verify a token and confirm it belongs to the expected appointment. */
export async function assertManageToken(
  token: string,
  appointmentId: string,
): Promise<boolean> {
  const tokenAppointmentId = await verifyManageToken(token);
  return tokenAppointmentId !== null && tokenAppointmentId === appointmentId;
}
