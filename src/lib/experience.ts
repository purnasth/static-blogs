import type { Role } from "@/lib/profile";

const MONTHS = [
  "january",
  "february",
  "march",
  "april",
  "may",
  "june",
  "july",
  "august",
  "september",
  "october",
  "november",
  "december",
] as const;

const MONTHS_PER_YEAR = 12;

/**
 * Parses `"March 2025"` without relying on `new Date(string)`, whose handling
 * of non-ISO input is implementation-defined.
 */
function parseRoleDate(value: string): Date | null {
  const [month, year] = value.trim().toLowerCase().split(/\s+/);
  const monthIndex = MONTHS.indexOf(month as (typeof MONTHS)[number]);
  const yearNumber = Number(year);
  if (monthIndex === -1 || !Number.isInteger(yearNumber)) return null;
  return new Date(Date.UTC(yearNumber, monthIndex, 1));
}

function monthsBetween(from: Date, to: Date): number {
  return (
    (to.getUTCFullYear() - from.getUTCFullYear()) * MONTHS_PER_YEAR +
    (to.getUTCMonth() - from.getUTCMonth())
  );
}

/** Roles still in progress, newest first. */
export function getCurrentRoles(roles: readonly Role[]): Role[] {
  return roles.filter((role) => role.end === null);
}

/**
 * Total time worked, measured from the earliest role start to today — or to the
 * latest end date if nothing is current. On a static export this is evaluated
 * at build time, so it stays accurate for as long as the site is rebuilt.
 *
 * Returns `null` when there is nothing to measure, so callers can omit the
 * label rather than render "0 years".
 */
export function getTotalExperience(
  roles: readonly Role[],
  now: Date = new Date(),
): string | null {
  const starts = roles.map((role) => parseRoleDate(role.start)).filter((d): d is Date => d !== null);
  if (starts.length === 0) return null;

  const earliest = new Date(Math.min(...starts.map((d) => d.getTime())));

  const ends = roles
    .map((role) => (role.end === null ? now : parseRoleDate(role.end)))
    .filter((d): d is Date => d !== null);
  const latest = new Date(Math.max(...ends.map((d) => d.getTime())));

  const months = Math.max(0, monthsBetween(earliest, latest));
  if (months < 1) return null;

  if (months < MONTHS_PER_YEAR) {
    return `${months} ${months === 1 ? "month" : "months"}`;
  }

  const years = Math.floor(months / MONTHS_PER_YEAR);
  const remainder = months % MONTHS_PER_YEAR;
  const plural = years === 1 ? "year" : "years";
  return remainder > 0 ? `${years}+ ${plural}` : `${years} ${plural}`;
}
