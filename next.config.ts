import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

/**
 * The blog ships as a pure static export. The `/admin` UI and its API routes
 * live in files named `*.dev.tsx` / `*.dev.ts`, and `pageExtensions` only
 * recognises those in development — so the writing tools physically cannot end
 * up in the deployed bundle. See README.md.
 */
const nextConfig: NextConfig = {
  output: isDev ? undefined : "export",
  pageExtensions: isDev
    ? ["dev.tsx", "dev.ts", "tsx", "ts"]
    : ["tsx", "ts"],
  images: {
    // Static export has no image optimisation server.
    unoptimized: true,
  },
  typescript: {
    // A production build must ignore the route types `next dev` generates in
    // .next/dev — they know about /admin and clash with the exported route map.
    // Without this, building while the dev server runs fails to type check.
    tsconfigPath: isDev ? "tsconfig.json" : "tsconfig.build.json",
  },
  trailingSlash: true,
};

export default nextConfig;
