import { NextResponse } from "next/server";
import { summary } from "@/lib/engagement.dev";

/** Dev-only: production serves this path from worker/index.ts. */

export async function GET() {
  return NextResponse.json(summary());
}
