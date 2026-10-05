/**
 * Test stub for the `server-only` package.
 *
 * The real package deliberately throws when resolved outside a React Server
 * Component graph, which would make every server module untestable. Vitest
 * aliases the import here so integration tests can exercise the real loader
 * and service code paths.
 */
export {};
