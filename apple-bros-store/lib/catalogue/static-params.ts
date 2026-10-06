import 'server-only';

/**
 * Prerendering that does not depend on the database being up.
 *
 * generateStaticParams reads the catalogue so the category and product shells
 * can be built ahead of time. That is worth doing, but it is not worth failing
 * a deployment over: if the database is unreachable at build time, or its
 * credentials are scoped to runtime only, the right outcome is a site that
 * renders those pages on first request rather than a build that refuses to
 * finish.
 *
 * Returning an empty list is safe because every page using this also sets
 * `revalidate`, so an unlisted path is rendered on demand and then cached. The
 * only cost of the fallback is a slower first hit on each page.
 */
export async function staticParamsOrNone<T>(
  load: () => Promise<T[]>,
): Promise<T[]> {
  try {
    return await load();
  } catch (error) {
    console.warn(
      '[build] could not read the catalogue for prerendering, so these pages will render on demand instead:',
      error instanceof Error ? error.message.split('\n')[0] : error,
    );
    return [];
  }
}
