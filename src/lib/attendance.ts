// Returns late minutes (0 if on time), given clock_in ISO string and standard_start_time "HH:MM:SS"
export function lateMins(
  clockIn: string,
  standardStart: string | null,
  graceMins = 5
): number {
  if (!standardStart) return 0
  const ci = new Date(clockIn)
  const [h, m] = standardStart.split(":").map(Number)
  const expected = new Date(ci)
  expected.setHours(h, m + graceMins, 0, 0)
  return Math.max(0, Math.round((ci.getTime() - expected.getTime()) / 60000))
}

// Returns undertime minutes (0 if full day worked)
export function undertimeMins(
  totalMinutes: number | null,
  standardHoursPerDay: number
): number {
  if (!totalMinutes) return 0
  return Math.max(0, standardHoursPerDay * 60 - totalMinutes)
}
