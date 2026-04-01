/**
 * All date/time in this app is locked to Asia/Manila (UTC+8).
 * Never use `new Date()` directly for display — always use these helpers.
 * Clock entries are stored as UTC in the DB; display converts to Manila time.
 */

export const TIMEZONE = "Asia/Manila"

/** Get current Manila time as a Date object. */
export function nowManila(): Date {
  return new Date(new Date().toLocaleString("en-US", { timeZone: TIMEZONE }))
}

/** Format a UTC ISO string for display in Manila time. */
export function formatManila(
  iso: string,
  options: Intl.DateTimeFormatOptions
): string {
  return new Intl.DateTimeFormat("en-PH", {
    ...options,
    timeZone: TIMEZONE,
  }).format(new Date(iso))
}

/** Format Manila time as "h:mm a" (e.g. "9:05 AM") */
export function toTimeManila(iso: string): string {
  return formatManila(iso, { hour: "numeric", minute: "2-digit", hour12: true })
}

/** Format Manila date as "MMM d, yyyy" (e.g. "Apr 1, 2026") */
export function toDateManila(iso: string): string {
  return formatManila(iso, { month: "short", day: "numeric", year: "numeric" })
}

/** Today's date in Manila as YYYY-MM-DD string. */
export function todayManila(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TIMEZONE }).format(
    new Date()
  ) // en-CA gives YYYY-MM-DD format
}

/** Current ISO timestamp adjusted to Manila clock (for clock_in/out inserts). */
export function nowIso(): string {
  return new Date().toISOString() // always store UTC
}

/** Minutes elapsed between two ISO timestamps, ignoring OS timezone. */
export function minutesBetween(startIso: string, endIso?: string): number {
  const end = endIso ? new Date(endIso).getTime() : Date.now()
  return Math.max(0, Math.floor((end - new Date(startIso).getTime()) / 60000))
}

/** Detect if the OS/browser timezone differs from Manila and warn. */
export function isTimezoneManila(): boolean {
  const offset = -new Date().getTimezoneOffset() // minutes ahead of UTC
  return offset === 480 // UTC+8 = 480 minutes
}
