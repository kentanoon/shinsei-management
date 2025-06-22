// Version and build information - Demo mode removed
export const VERSION = '2.0.0';
export const BUILD_DATE = '2025-06-21T11:10:00Z';
export const BUILD_HASH = Date.now().toString(36);

// Production-only mode enabled
console.log(`Production App version: ${VERSION}, Build: ${BUILD_DATE}`);