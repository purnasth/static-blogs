import { NextResponse } from "next/server";
import { getStore } from "@/lib/storage";

/** Dev-only: excluded from the production build (see next.config.ts). */

export async function DELETE(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const store = await getStore();
    await store.remove(slug);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Delete failed." },
      { status: 400 },
    );
  }
}
