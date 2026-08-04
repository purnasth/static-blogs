import { NextResponse } from "next/server";
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
    const data = Buffer.from(await file.arrayBuffer());
    const { url } = await store.saveImage(file.name || "image.png", data);

    return NextResponse.json({ ok: true, url });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Upload failed." },
      { status: 400 },
    );
  }
}
