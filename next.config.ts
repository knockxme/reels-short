import type { NextConfig } from "next";

const allowedFrameHosts = (process.env.ALLOWED_SOURCE_HOSTS ?? "")
  .split(",")
  .map((h) => h.trim())
  .filter(Boolean)
  .flatMap((h) => [`https://${h}`, `https://*.${h}`]);

// The official Dailymotion player is always allowed. Other players may only be framed from
// your video server(s) when ALLOWED_SOURCE_HOSTS is set.
const dailymotion = "https://www.dailymotion.com https://geo.dailymotion.com";
const frameSrc = allowedFrameHosts.length ? `'self' ${dailymotion} ${allowedFrameHosts.join(" ")}` : "'self' https:";

const isDev = process.env.NODE_ENV === "development";

// Static CSP: nonces would force every page to render dynamically, which Partial Prerendering can't do.
// Video players need https: for media/connect (HLS segments, MP4 files, Dailymotion).
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "media-src 'self' blob: https:",
  `connect-src 'self' https:${isDev ? " ws: wss:" : ""}`,
  `frame-src ${frameSrc}`,
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'self'",
  ...(isDev ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=(), browsing-topics=()",
  },
];

// Admin and API responses must never be indexed or cached by shared caches.
const privateHeaders = [
  { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
  { key: "Cache-Control", value: "private, no-store" },
];

// Set IMAGE_HOSTS (comma-separated) to stop /_next/image from resizing images from arbitrary sites.
const imageHosts = (process.env.IMAGE_HOSTS ?? "")
  .split(",")
  .map((h) => h.trim())
  .filter(Boolean);

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  // Standalone output is only for the Docker image; `npm start` needs the regular build.
  output: process.env.BUILD_STANDALONE ? "standalone" : undefined,
  poweredByHeader: false,
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: imageHosts.length
      ? imageHosts.flatMap((h) => [
          { protocol: "https" as const, hostname: h },
          { protocol: "https" as const, hostname: `**.${h}` },
        ])
      : [{ protocol: "https", hostname: "**" }],
    minimumCacheTTL: 60 * 60 * 24 * 30,
    dangerouslyAllowSVG: false,
  },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      { source: "/admin/:path*", headers: privateHeaders },
      { source: "/admin", headers: privateHeaders },
      { source: "/api/:path*", headers: privateHeaders },
    ];
  },
  // Titles are single videos now: old episode and series-only URLs move permanently, so links and rankings carry over.
  async redirects() {
    return [
      { source: "/drama/:slug/episode-:n", destination: "/drama/:slug", permanent: true },
      { source: "/latest-episodes/:rest*", destination: "/new", permanent: true },
      { source: "/movies/:rest*", destination: "/browse", permanent: true },
      { source: "/ongoing/:rest*", destination: "/browse", permanent: true },
      { source: "/completed/:rest*", destination: "/browse", permanent: true },
      { source: "/sitemaps/episodes.xml", destination: "/sitemaps/dramas.xml", permanent: true },
      { source: "/admin/episodes/:id", destination: "/admin/dramas", permanent: false },
    ];
  },
  async rewrites() {
    const key = process.env.INDEXNOW_KEY;
    return key ? [{ source: `/${key}.txt`, destination: "/api/indexnow-key" }] : [];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
