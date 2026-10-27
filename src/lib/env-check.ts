/*
 * Settings a production server must have. Checked once at startup (instrumentation.ts), so a bad
 * deploy fails loudly instead of running with a guessable secret or broken canonical URLs.
 */

const PLACEHOLDER = /change|replace|password|secret|example|use-a-long|yourdomain/i;

export function productionEnvProblems(env: NodeJS.ProcessEnv = process.env) {
  const problems: string[] = [];
  const need = (key: string, test: (v: string) => boolean, why: string) => {
    const v = env[key]?.trim() ?? "";
    if (!v || !test(v)) problems.push(`${key}: ${why}`);
  };

  need("DATABASE_URL", (v) => /^postgres(ql)?:\/\//.test(v), "must be a postgresql:// connection string");
  need("SESSION_SECRET", (v) => v.length >= 32 && !PLACEHOLDER.test(v), "must be 32+ random characters (openssl rand -hex 32)");
  need("ADMIN_USERNAME", (v) => v.length >= 3, "must be set");
  need("ADMIN_PASSWORD", (v) => v.length >= 12 && !PLACEHOLDER.test(v) && !/^admin/i.test(v), "must be 12+ characters and not a placeholder");
  need("CRON_SECRET", (v) => v.length >= 16 && !PLACEHOLDER.test(v), "must be 16+ random characters (openssl rand -hex 16)");
  need(
    "NEXT_PUBLIC_SITE_URL",
    (v) => {
      try {
        const u = new URL(v);
        // localhost is allowed so a production build can be tested on your own machine.
        return u.protocol === "https:" || u.hostname === "localhost" || u.hostname === "127.0.0.1";
      } catch {
        return false;
      }
    },
    "must be your real https:// address (it is used for canonical URLs, sitemaps and social cards)",
  );
  return problems;
}
