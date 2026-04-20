/**
 * Exposes the stubs directory to the `configure.ts` entrypoint. The path
 * resolves relative to the compiled file at runtime, which is why consumers
 * import `'../stubs/main.js'` after build.
 */
export const stubsRoot = import.meta.dirname
