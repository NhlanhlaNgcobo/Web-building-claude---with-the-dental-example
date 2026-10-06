/**
 * A no-op stand-in for the `server-only` package.
 *
 * `server-only` exists to make a build fail if a server module is pulled into
 * a client bundle. That is exactly what we want in the application, and
 * exactly what we do not want in Vitest, which runs those same modules
 * directly in Node with no bundler conditions to satisfy.
 *
 * Aliased in vitest.config.mts. Importing it proves nothing and asserts
 * nothing; it simply lets a server module load under test.
 */
export {};
