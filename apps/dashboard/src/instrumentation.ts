/**
 * Next.js instrumentation hook — runs once on server startup.
 * Conditionally starts MSW for server-side mock API interception.
 *
 * Next.js calls register() in BOTH the Node.js and Edge runtimes.
 * MSW's node interceptors only work in Node.js, so we guard on
 * NEXT_RUNTIME to skip the Edge invocation entirely.
 */
export async function register() {
  if (
    process.env.NEXT_RUNTIME === "nodejs" &&
    process.env.NEXT_PUBLIC_USE_MOCK !== "false"
  ) {
    const { server } = await import("./mocks/server");
    server.listen({ onUnhandledRequest: "bypass" });
    console.log("[MSW] Mock server started (server-side)");
  }
}
