-- D1 schema for the engagement API. Apply with:
--   npx wrangler d1 execute blog-engagement --remote --file worker/schema.sql
-- Every statement is idempotent, so re-running it is safe.

-- Running totals, one row per post. Kept as an aggregate rather than a
-- COUNT(*) over the dedupe table so reads stay O(1) as traffic grows.
CREATE TABLE IF NOT EXISTS post_views (
  slug  TEXT PRIMARY KEY,
  views INTEGER NOT NULL DEFAULT 0
);

-- View dedupe. `visitor` is a salted hash of IP + user-agent + slug that
-- rotates daily, so yesterday's rows can never match today's request and the
-- table is safe to truncate. No IP is ever stored.
CREATE TABLE IF NOT EXISTS post_view_visitors (
  slug    TEXT NOT NULL,
  visitor TEXT NOT NULL,
  day     TEXT NOT NULL,
  PRIMARY KEY (slug, visitor)
);
CREATE INDEX IF NOT EXISTS post_view_visitors_day ON post_view_visitors (day);

-- One row per (post, visitor, kind). The primary key is what makes reactions
-- idempotent: hammering the button rewrites the same row instead of counting.
-- `visitor` here is the browser-held id, not the daily hash, so a visitor's own
-- reactions survive past midnight.
CREATE TABLE IF NOT EXISTS reactions (
  slug       TEXT NOT NULL,
  visitor    TEXT NOT NULL,
  kind       TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  PRIMARY KEY (slug, visitor, kind)
);
CREATE INDEX IF NOT EXISTS reactions_slug ON reactions (slug);

-- Per-IP-per-day write budget. The bucket key embeds the daily hash, so these
-- rows also expire by rotation and are pruned by the cron trigger.
CREATE TABLE IF NOT EXISTS rate_limit (
  bucket TEXT PRIMARY KEY,
  day    TEXT NOT NULL,
  hits   INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS rate_limit_day ON rate_limit (day);
