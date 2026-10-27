import { productionEnvProblems } from "./lib/env-check";

/** Node.js-only startup check (imported from instrumentation.ts so the Edge build never sees process.exit). */
export function checkProductionEnv() {
  // `next build` also loads instrumentation; only a running production server needs real secrets.
  if (process.env.NODE_ENV !== "production" || process.env.NEXT_PHASE === "phase-production-build") return;
  const problems = productionEnvProblems();
  if (problems.length) {
    console.error(`\nRefusing to start: fix these settings in your production environment:\n  - ${problems.join("\n  - ")}\n`);
    process.exit(1);
  }
}
