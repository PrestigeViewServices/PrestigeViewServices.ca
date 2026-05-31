/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
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
