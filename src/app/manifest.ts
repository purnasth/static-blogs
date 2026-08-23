import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

export const dynamic = "force-static";

/**
 * Makes the blog installable and gives Android a proper icon.
 *
 * The manifest's icons live in `public/icons/` rather than using the `app/`
 * file conventions, because a manifest needs stable URLs and the conventions
 * emit generated ones.
 *
 * `maskable` is a separate entry on purpose: Android crops icons to a
 * device-chosen shape and only guarantees the central 80%, so that file has the
 * face inset. Listing one image as both `any` and `maskable` gets it either
 * cropped into the face or floating with double padding, depending on the
 * launcher.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: site.title,
    // Android truncates around 12 characters under the home-screen icon,
    // so this is deliberately not `site.title`.
    short_name: "Purna",
    description: site.description,
    start_url: "/",
    display: "standalone",
    background_color: "#fdfdfc",
    theme_color: "#b0451f",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
