import { z } from "zod"

// ─── Reusable primitives ──────────────────────────────────────────────────────

const phoneRegex = /^[+]?[\d\s\-().]{7,20}$/
const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/

const requiredString = (label: string) =>
  z.string().min(1, `${label} is required`).trim()

const optionalString = z.string().trim().optional()

const phone = z
  .string()
  .regex(phoneRegex, "Enter a valid phone number")
  .optional()
  .or(z.literal(""))

// ─── Employee invite / create ─────────────────────────────────────────────────

export const inviteEmployeeSchema = z.object({
  first_name: requiredString("First name"),
  last_name: requiredString("Last name"),
  email: z.string().email("Enter a valid work email").trim().toLowerCase(),
  role: z.enum(["employee", "employer", "admin"] as const, {
    message: "Select a valid role",
  }),
  department: z.string().trim().default(""),
  job_title: z.string().trim().default(""),
  location: z.string().trim().default(""),
  standard_hours_per_day: z.coerce
    .number()
    .min(1, "Min 1 hour")
    .max(24, "Max 24 hours"),
  standard_hours_per_week: z.coerce
    .number()
    .min(1, "Min 1 hour")
    .max(168, "Max 168 hours"),
})

export type InviteEmployeeInput = z.infer<typeof inviteEmployeeSchema>

// ─── Edit employee (admin) ────────────────────────────────────────────────────

export const editEmployeeSchema = z.object({
  first_name: requiredString("First name"),
  last_name: requiredString("Last name"),
  role: z.enum(["employee", "employer", "admin"] as const),
  department: z.string().trim().default(""),
  job_title: z.string().trim().default(""),
  location: z.string().trim().default(""),
  standard_hours_per_day: z.coerce.number().min(1).max(24),
  standard_hours_per_week: z.coerce.number().min(1).max(168),
  standard_start_time: z
    .string()
    .regex(timeRegex, "Enter a valid time (HH:MM)"),
})

export type EditEmployeeInput = z.infer<typeof editEmployeeSchema>

// ─── Request time off ─────────────────────────────────────────────────────────

export const requestTimeOffSchema = z
  .object({
    category_id: requiredString("Time off type"),
    start_date: requiredString("Start date"),
    end_date: requiredString("End date"),
    note: z.string().trim().max(500, "Note too long").optional(),
  })
  .refine((d) => d.end_date >= d.start_date, {
    message: "End date must be on or after start date",
    path: ["end_date"],
  })

export type RequestTimeOffInput = z.infer<typeof requestTimeOffSchema>

// ─── Clock correction ─────────────────────────────────────────────────────────

export const clockCorrectionSchema = z
  .object({
    clock_in: z.string().optional(),
    clock_out: z.string().optional(),
    break_minutes: z.coerce.number().min(0).max(480).optional(),
    notes: z.string().trim().max(500).optional(),
    reason: requiredString("Reason").min(
      5,
      "Reason must be at least 5 characters"
    ),
  })
  .refine((d) => !d.clock_in || !d.clock_out || d.clock_out > d.clock_in, {
    message: "Clock out must be after clock in",
    path: ["clock_out"],
  })

export type ClockCorrectionInput = z.infer<typeof clockCorrectionSchema>

// ─── My Info field update ─────────────────────────────────────────────────────

export const myInfoSchema = z.object({
  first_name: requiredString("First name"),
  last_name: requiredString("Last name"),
  preferred_name: optionalString,
  phone: phone,
  birthday: z.string().optional(),
  address_line1: z.string().trim().max(100).optional(),
  address_line2: z.string().trim().max(100).optional(),
  city: z.string().trim().max(50).optional(),
  country: z.string().trim().max(50).optional(),
  emergency_name: z.string().trim().max(100).optional(),
  emergency_phone: phone,
  emergency_relation: z.string().trim().max(50).optional(),
})

export type MyInfoInput = z.infer<typeof myInfoSchema>

// ─── Company settings ─────────────────────────────────────────────────────────

export const companySettingsSchema = z.object({
  company_name: z.string().min(1, "Company name is required"),
  standard_hours_per_day: z.number().min(1).max(24),
  standard_hours_per_week: z.number().min(1).max(168),
  standard_start_time: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time format"),
  working_days: z.array(z.number()).min(1, "At least one working day required"),
  overtime_threshold_daily: z.number().min(0).max(24),
  overtime_threshold_weekly: z.number().min(0).max(168),
  industry: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  website: z.string().url().optional().or(z.literal("")),
  address_line1: z.string().optional(),
  address_line2: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
})

export type CompanySettingsInput = z.infer<typeof companySettingsSchema>

// ─── Notification preferences ─────────────────────────────────────────────────

export const notificationPrefsSchema = z.object({
  timeoff_updates: z.boolean(),
  profile_updates: z.boolean(),
  correction_updates: z.boolean(),
  new_employee: z.boolean(),
})

export type NotificationPrefsInput = z.infer<typeof notificationPrefsSchema>
