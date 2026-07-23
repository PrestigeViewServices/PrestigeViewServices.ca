/**
 * Content-Security-Policy: every external host the site legitimately talks
 * to is listed explicitly — anything else is blocked by the browser. If you
 * add a new third-party script/embed, its host MUST be added here or it
 * silently won't load.
 *
 * Notes:
 * - 'unsafe-inline' in script-src is required by Next.js's runtime bootstrap
 *   and the GA/Meta inline snippets (no nonce plumbing yet). The main
 *   protection here is the strict external-host allowlist.
 * - frame-ancestors 'none' = nobody can iframe this site (clickjacking).
 */
const csp = [
  "default-src 'self'",
  [
    "script-src 'self' 'unsafe-inline'",
    "https://www.googletagmanager.com", // Google Analytics
    "https://connect.facebook.net", // Meta pixel
    "https://cdn.trustindex.io", // Google reviews widget
    "https://*.clerk.accounts.dev", // Clerk (portal/rep auth)
  ].join(" "),
  "style-src 'self' 'unsafe-inline' https://cdn.trustindex.io",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data: https://cdn.trustindex.io",
  "media-src 'self' https://res.cloudinary.com",
  [
    "connect-src 'self'",
    "https://*.google-analytics.com https://*.analytics.google.com",
    "https://www.googletagmanager.com https://stats.g.doubleclick.net",
    "https://www.facebook.com",
    "https://*.trustindex.io",
    "https://*.clerk.accounts.dev https://clerk-telemetry.com",
  ].join(" "),
  [
    "frame-src",
    "https://aurorasuite.ca", // quote/contact lead form iframe
    "https://www.facebook.com",
    "https://*.trustindex.io",
    "https://*.clerk.accounts.dev",
  ].join(" "),
  "worker-src 'self' blob:",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  {
    // Browsers remember to ALWAYS use HTTPS for this domain (2 years).
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains",
  },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    // Rep canvassing map uses geolocation; nothing needs camera/mic/payment.
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(self), payment=()",
  },
  { key: "X-DNS-Prefetch-Control", value: "on" },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Don't advertise the framework in response headers.
  poweredByHeader: false,
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
  images: {
    // === Remote hosts (none today) ===
    // Add an entry here before referencing an image hosted off our own domain
    // via next/image. We do NOT use any remote image hosts at the moment —
    // every image on the site lives under /public/images/.
    //
    // Example (uncomment + adapt when needed):
    // remotePatterns: [
    //   { protocol: "https", hostname: "images.unsplash.com" }, // hero photos
    //   { protocol: "https", hostname: "cdn.shopify.com" },     // product shots
    // ],
    remotePatterns: [],

    // === Local SVGs ===
    // /public/images/gallery/sample.svg ships as a placeholder. Next/Image
    // refuses to serve SVGs by default because malicious SVGs can embed
    // scripts. We allow them but lock them down with a CSP that disables
    // scripts and sandboxes the image. Safe for self-hosted assets.
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
};

module.exports = nextConfig;
