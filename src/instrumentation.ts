/** Runs once when a server instance starts. */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { checkProductionEnv } = await import("./instrumentation-node");
    checkProductionEnv();
  }
}

/** One JSON line per server error, so logs can be searched and alerted on. Never logs cookies or other headers. */
export function onRequestError(
  error: unknown,
  request: { path: string; method: string },
  context: { routePath: string; routeType: string },
) {
  const err = error instanceof Error ? error : new Error(String(error));
  console.error(
    JSON.stringify({
      level: "error",
      time: new Date().toISOString(),
      message: err.message.slice(0, 500),
      digest: (error as { digest?: string })?.digest,
      method: request.method,
      path: request.path.split("?")[0],
      route: context.routePath,
      type: context.routeType,
    }),
  );
}
