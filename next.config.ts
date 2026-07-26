import type { NextConfig } from "next";

// Vercel already sends Strict-Transport-Security, so it is not repeated here.
// No Content-Security-Policy: Next inlines its bootstrap and flight payload, so a
// useful one needs per-request nonces, and that opts every page out of static
// prerendering. Not worth it for a site with no auth, no forms and no user data.
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
