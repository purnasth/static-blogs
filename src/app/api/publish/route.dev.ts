import { NextResponse } from "next/server";
import { getStore } from "@/lib/storage";

/** Dev-only: excluded from the production build (see next.config.ts). */

export async function POST(request: Request) {
  try {
    const { message } = (await request.json().catch(() => ({}))) as { message?: string };
    const store = await getStore();
    const result = await store.publish(message?.trim() || "Update posts");
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Publish failed." },
      { status: 400 },
    );
  }
}
