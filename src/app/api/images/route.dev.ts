import { NextResponse } from "next/server";
import { optimiseImage } from "@/lib/images.dev";
import { getStore } from "@/lib/storage";

/** Dev-only: excluded from the production build (see next.config.ts). */

const MAX_BYTES = 12 * 1024 * 1024;

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) throw new Error("No file uploaded.");
    if (file.size > MAX_BYTES) throw new Error("Image is larger than 12 MB.");

    const store = await getStore();
    const original = Buffer.from(await file.arrayBuffer());

    // Resized and re-encoded here, because nothing downstream ever will.
    const image = await optimiseImage(file.name || "image.png", original);

    const { url } = await store.saveImage(image.filename, image.data);

    return NextResponse.json({
      ok: true,
      url,
      before: image.before,
      after: image.after,
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Upload failed." },
      { status: 400 },
    );
  }
}
