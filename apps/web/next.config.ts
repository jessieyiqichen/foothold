import path from "node:path";
import { loadEnvConfig } from "@next/env";
import type { NextConfig } from "next";

// Monorepo: the keys stay in one file at the repository root, which the user owns. Next.js would only look in this
// folder, so it is told to read the root as well. Agents never read or move that file.
loadEnvConfig(path.join(__dirname, "../.."));

/** Security review (2026-10-26): no other site may show these pages in a frame (clickjacking), the browser doesn't
 *  guess file types, other sites only learn our origin when a link is followed, and camera, mic and location are off.
 *  A strict Content-Security-Policy is left for later: Clerk's sign-in loads its own scripts, and a wrong policy would
 *  break signing in (see log.md). */
const SECURITY_HEADERS = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  // @foothold/core ships TypeScript source, not built files
  transpilePackages: ["@foothold/core"],
  // The front door is the profile for now, the only Foothold page so far (HOME_PATH in src/lib/auth/routes.ts).
  // What it should be is still to be decided with the user
  async redirects() {
    return [{ source: "/", destination: "/profile", permanent: false }];
  },
  async headers() {
    return [{ source: "/:path*", headers: SECURITY_HEADERS }];
  },
  // Both experimental flags are off on purpose: with them on, a client-side navigation away from Today left the old
  // page mounted under the new one (two <main> elements). Verified 2026-10-18 by toggling each and counting <main>.
  cacheComponents: false,
  partialPrefetching: false,
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
