import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

export const dynamic = "force-static";

/**
 * The writing desk never reaches a production build (see next.config.ts), so
 * /admin/ and /api/ are not disallowed here — naming paths that do not exist
 * only advertises them.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/" }],
    sitemap: `${site.url}/sitemap.xml`,
  };
}
