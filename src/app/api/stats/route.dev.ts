import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { NextResponse } from "next/server";

/**
 * Dev-only: real production numbers for the writing desk's dashboard.
 *
 * It shells out to Wrangler rather than talking to D1 directly, which means it
 * borrows the login you already have and needs no API token — the same reason
 * `pnpm db:pull` works. There is no production counterpart to this route and
 * there should not be: it is a read of the live database from your own machine.
 *
 * One invocation, not two — spawning wrangler costs a couple of seconds, so the
 * views and the reaction breakdown come back as one UNION.
 */

const run = promisify(execFile);

const SQL = `
  SELECT slug, 'view' AS kind, views AS n FROM post_views
  UNION ALL
  SELECT slug, kind, COUNT(*) AS n FROM reactions GROUP BY slug, kind
`;

type Row = { slug: string; kind: string; n: number };

export async function GET() {
  try {
    const { stdout } = await run(
      "npx",
      ["wrangler", "d1", "execute", "blog-engagement", "--remote", "--json", "--command", SQL],
      { cwd: process.cwd(), maxBuffer: 8 * 1024 * 1024, timeout: 90_000 },
    );

    // Wrangler occasionally prefixes a banner even under --json.
    const start = stdout.indexOf("[");
    if (start === -1) throw new Error("Wrangler returned no JSON.");

    const parsed = JSON.parse(stdout.slice(start)) as { results?: Row[] }[];
    return NextResponse.json({ ok: true, rows: parsed[0]?.results ?? [] });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({
      ok: false,
      // Almost always "not logged in" or "database_id still a placeholder".
      error: message.includes("wrangler") || message.includes("D1")
        ? message.split("\n").slice(0, 3).join(" ").trim()
        : message,
    });
  }
}
