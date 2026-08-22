import { NextResponse } from "next/server";
import { recordView } from "@/lib/engagement.dev";

/** Dev-only: production serves this path from worker/index.ts. */

export async function POST(request: Request) {
  const body = (await request.json()) as Record<string, unknown>;
  return NextResponse.json(recordView(String(body.slug ?? ""), String(body.visitor ?? "")));
}
