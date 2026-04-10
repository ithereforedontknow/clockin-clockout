import { describe, it, expect } from "vitest"
import { countWeekdays, formatMinutes } from "@/lib/supabase"

describe("countWeekdays", () => {
  it("counts Mon–Fri between two dates", () => {
    expect(countWeekdays("2024-01-01", "2024-01-07")).toBe(5)
  })
  it("returns 0 for a weekend-only range", () => {
    expect(countWeekdays("2024-01-06", "2024-01-07")).toBe(0)
  })
  it("respects custom working days", () => {
    expect(countWeekdays("2024-01-06", "2024-01-07", [0, 6])).toBe(2)
  })
})

describe("formatMinutes", () => {
  it("formats hours and minutes", () =>
    expect(formatMinutes(90)).toBe("1h 30m"))
  it("formats whole hours", () => expect(formatMinutes(120)).toBe("2h"))
  it("formats minutes only", () => expect(formatMinutes(45)).toBe("45m"))
})
