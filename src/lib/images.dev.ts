import path from "node:path";
import sharp from "sharp";

/**
 * Dev-only: shrink an uploaded image before it is written to `public/images/`.
 *
 * This exists because `output: "export"` forces `images: { unoptimized: true }`
 * — Next will never resize or re-encode anything, so whatever lands in that
 * folder is what every reader downloads forever. Doing it at upload time is the
 * only point where it happens automatically; a rule in the docs only works
 * while someone remembers it.
 *
 * The `.dev.ts` suffix keeps it out of the production type-check, and nothing
 * in the static build imports it, so `sharp` stays a dev dependency.
 */

/** Generous: the reading column is ~600 CSS px, a full-bleed cover ~1000. */
const MAX_EDGE = 1600;

/** Visually lossless for photographs; mozjpeg buys ~10% over the default. */
const JPEG_QUALITY = 85;

export type Optimised = {
  filename: string;
  data: Buffer;
  before: number;
  after: number;
};

function rename(filename: string, ext: string): string {
  return `${path.basename(filename, path.extname(filename))}${ext}`;
}

export async function optimiseImage(filename: string, data: Buffer): Promise<Optimised> {
  const untouched: Optimised = {
    filename,
    data,
    before: data.byteLength,
    after: data.byteLength,
  };

  // A real vector is already tiny and rasterising it throws away the point.
  if (path.extname(filename).toLowerCase() === ".svg") return untouched;

  let meta;
  try {
    meta = await sharp(data).metadata();
  } catch {
    // Not something sharp understands — pass it through rather than lose it.
    return untouched;
  }

  // Animated GIF/WebP would be flattened to a single frame.
  if ((meta.pages ?? 1) > 1) return untouched;

  // `.rotate()` with no argument applies the EXIF orientation. Without it,
  // stripping metadata lands phone photos on their side.
  const pipeline = () =>
    sharp(data)
      .rotate()
      .resize({ width: MAX_EDGE, height: MAX_EDGE, fit: "inside", withoutEnlargement: true });

  // Lossless, so a screenshot keeps its crisp text.
  const png = await pipeline().png({ compressionLevel: 9 }).toBuffer();

  const { isOpaque } = await sharp(data).stats();
  if (!isOpaque) {
    return pick(untouched, rename(filename, ".png"), png);
  }

  /**
   * Encode both and keep the smaller. This is what preserves quality without
   * anyone having to decide: JPEG wins overwhelmingly on photographs, PNG wins
   * on flat-colour screenshots and diagrams — where JPEG would smear the text.
   */
  const jpeg = await pipeline()
    .jpeg({ quality: JPEG_QUALITY, mozjpeg: true, progressive: true })
    .toBuffer();

  return jpeg.byteLength < png.byteLength
    ? pick(untouched, rename(filename, ".jpg"), jpeg)
    : pick(untouched, rename(filename, ".png"), png);
}

/** Never make a file bigger — a small, already-optimised upload is left alone. */
function pick(untouched: Optimised, filename: string, data: Buffer): Optimised {
  if (data.byteLength >= untouched.before) return untouched;
  return { filename, data, before: untouched.before, after: data.byteLength };
}
