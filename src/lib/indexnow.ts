import "server-only";
import { absoluteUrl, SITE_URL } from "./site";

/** Notify Bing, Yandex, Seznam etc. that URLs changed. Google ignores IndexNow; it uses the sitemap. */
export async function pingIndexNow(paths: string[]) {
  const key = process.env.INDEXNOW_KEY;
  if (!key || SITE_URL.includes("localhost") || !paths.length) return;
  try {
    await fetch("https://api.indexnow.org/indexnow", {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({
        host: new URL(SITE_URL).host,
        key,
        keyLocation: absoluteUrl(`/${key}.txt`),
        urlList: paths.map((p) => absoluteUrl(p)),
      }),
      signal: AbortSignal.timeout(5000),
    });
  } catch (err) {
    console.error("IndexNow ping failed", err);
  }
}
