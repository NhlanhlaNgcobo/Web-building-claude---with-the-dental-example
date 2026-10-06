/**
 * Environment access with useful failure messages.
 *
 * A missing DATABASE_URL on a deployed instance produces an obscure driver
 * error several frames deep. Failing here instead, with a message that says
 * what to set and where, turns a confusing five minute debug into an obvious
 * one.
 *
 * Deliberately not importing 'server-only': the seed and the maintenance
 * scripts are plain Node processes and need this too.
 */

export function requireDatabaseUrl(): string {
  const value = process.env.DATABASE_URL;
  if (!value || value.length === 0) {
    throw new Error(
      [
        'DATABASE_URL is not set.',
        '',
        'Locally: copy .env.example to .env and point DATABASE_URL at a',
        'PostgreSQL database.',
        '',
        'On Vercel: add a Postgres database from the Storage tab, which sets',
        'DATABASE_URL for you, then pull it locally with `vercel env pull`.',
      ].join('\n'),
    );
  }
  return value;
}

/** True when running on Vercel, used to size the connection pool. */
export function isServerless(): boolean {
  return Boolean(process.env.VERCEL);
}
