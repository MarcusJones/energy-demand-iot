/**
 * Next.js instrumentation hook — runs once on server startup.
 * Conditionally starts MSW for server-side mock API interception.
 */
export async function register() {
  if (process.env.NEXT_PUBLIC_USE_MOCK !== "false") {
    if (typeof window === "undefined") {
      // Server-side: use MSW node server
      const { server } = await import("./mocks/server");
      server.listen({ onUnhandledRequest: "bypass" });
      console.log("[MSW] Mock server started (server-side)");
    }
  }
}
