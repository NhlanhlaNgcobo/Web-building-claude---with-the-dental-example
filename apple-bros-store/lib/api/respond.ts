import { NextResponse } from 'next/server';
import { ZodError, type ZodType } from 'zod';
import { isOrderError } from '@/lib/orders/errors';
import type { Shortfall } from '@/lib/orders/stock';

/**
 * A single response shape for every API route, so the client has one thing to
 * branch on rather than a different error format per endpoint.
 */

export interface ApiErrorBody {
  readonly error: {
    readonly code: string;
    readonly message: string;
    readonly fieldErrors?: Record<string, string[]>;
  };
  /** Present on a stock conflict, one entry per affected basket line. */
  readonly shortfalls?: readonly Shortfall[];
}

/**
 * Catalogue and order responses are never cached by a browser, a proxy or a
 * CDN. Serving stock levels from a cache is how two people are shown the
 * same last unit.
 */
export const NO_STORE = {
  'Cache-Control': 'no-store, max-age=0, must-revalidate',
} as const;

export function ok<T>(data: T, status = 200): NextResponse<T> {
  return NextResponse.json(data, { status, headers: NO_STORE });
}

export function fail(
  code: string,
  message: string,
  status: number,
  extra: { fieldErrors?: Record<string, string[]>; shortfalls?: readonly Shortfall[] } = {},
): NextResponse<ApiErrorBody> {
  return NextResponse.json(
    {
      error: {
        code,
        message,
        ...(extra.fieldErrors ? { fieldErrors: extra.fieldErrors } : {}),
      },
      // Omitted when there are none, so a client can treat the presence of
      // this key as "there are other times to offer" rather than having to
      // check its length.
      ...(extra.shortfalls && extra.shortfalls.length > 0
        ? { shortfalls: extra.shortfalls }
        : {}),
    },
    { status, headers: NO_STORE },
  );
}

/**
 * Parse a request body against a schema, returning either the typed value or a
 * ready-made 400 carrying per-field messages.
 */
export async function parseJson<T>(
  request: Request,
  schema: ZodType<T>,
): Promise<{ ok: true; data: T } | { ok: false; response: NextResponse<ApiErrorBody> }> {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return {
      ok: false,
      response: fail('INVALID_JSON', 'The request body could not be read.', 400),
    };
  }

  const result = schema.safeParse(raw);
  if (!result.success) {
    return {
      ok: false,
      response: fail('VALIDATION_ERROR', 'Please check the details you entered.', 400, {
        fieldErrors: flattenZodError(result.error),
      }),
    };
  }
  return { ok: true, data: result.data };
}

/** Parse search params against a schema. */
export function parseQuery<T>(
  request: Request,
  schema: ZodType<T>,
): { ok: true; data: T } | { ok: false; response: NextResponse<ApiErrorBody> } {
  const url = new URL(request.url);
  const raw = Object.fromEntries(url.searchParams.entries());
  const result = schema.safeParse(raw);
  if (!result.success) {
    return {
      ok: false,
      response: fail('VALIDATION_ERROR', 'That request was not valid.', 400, {
        fieldErrors: flattenZodError(result.error),
      }),
    };
  }
  return { ok: true, data: result.data };
}

function flattenZodError(error: ZodError): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = issue.path.length > 0 ? issue.path.join('.') : '_';
    (out[key] ??= []).push(issue.message);
  }
  return out;
}

/**
 * Turn a thrown error into a response.
 *
 * Typed order errors carry their own status, message and alternatives, so
 * they pass through intact. Anything else is logged server-side and reported
 * as a generic failure, because an unexpected error message may describe
 * internals that should not reach a browser.
 */
export function handleError(error: unknown): NextResponse<ApiErrorBody> {
  if (isOrderError(error)) {
    return fail(error.code, error.message, error.status, {
      shortfalls: error.shortfalls,
    });
  }
  if (error instanceof ZodError) {
    return fail('VALIDATION_ERROR', 'Please check the details you entered.', 400, {
      fieldErrors: flattenZodError(error),
    });
  }

  console.error('[api] unhandled error', error);
  return fail(
    'INTERNAL_ERROR',
    'Something went wrong on our side. Please try again, or phone the shop.',
    500,
  );
}
