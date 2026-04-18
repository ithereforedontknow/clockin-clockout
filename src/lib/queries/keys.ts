// src/lib/queries/keys.ts
export const keys = {
  // Employee
  currentEmployee: () => ["current-employee"] as const,
  employee: (id: string) => ["employee", id] as const,
  employees: () => ["employees"] as const,
  myTeam: (employerId: string) => ["my-team", employerId] as const,

  // Time Off
  balances: (id: string) => ["balances", id] as const,
  timeOffHistory: (id: string) => ["timeoff-history", id] as const,
  timeOffRequests: () => ["time-off-requests"] as const,
  whosOut: (d: string) => ["whos-out", d] as const,
  holidays: () => ["holidays"] as const,

  // Info Change Requests
  inboxSent: (id: string) => ["inbox-sent", id] as const,

  // Clock
  todayClock: (id: string) => ["today-clock", id] as const,
  clockHistory: (id: string, week: string) =>
    ["clock-history", id, week] as const,
  allClockEntries: (week: string) => ["all-clock-entries", week] as const,
  liveClockedIn: () => ["live-clocked-in"] as const,

  // Corrections
  myCorrections: (empId: string) => ["corrections", "mine", empId] as const,
  allCorrections: () => ["corrections", "all"] as const,

  // Notifications
  notifications: (empId: string) => ["notifications", empId] as const,

  // Approvals
  pendingTimeOff: () => ["approvals", "timeoff"] as const,
  pendingInfoChange: () => ["approvals", "infochange"] as const,

  // Admin
  adminEmployees: (filters?: string) =>
    ["admin-employees", filters ?? ""] as const,

  // Company
  companySettings: () => ["company-settings"] as const,
  departments: () => ["departments"] as const,

  // Announcements
  announcements: (employeeId: string) => ["announcements", employeeId] as const,

  // Reports
  reportEntries: (week: string, managerId: string) =>
    ["report-entries", week, managerId] as const,
  payrollSummary: (start: string, end: string) =>
    ["payroll-summary", start, end] as const,

  // Training
  trainingRecord: () => ["training-record"] as const,
  curriculums: () => ["curriculums"] as const,
  curriculum: (id: string) => ["curriculum", id] as const,
  courseProgress: (id: string) => ["course-progress", id] as const,
  lessonCompletionMap: (id: string) => ["lesson-completion-map", id] as const,
  certifications: () => ["certifications"] as const,
  allTrainingRecords: () => ["training-records-all"] as const,
  courseCategories: () => ["course-categories"] as const,
  courseTags: () => ["course-tags"] as const,
  curriculumTags: (id: string) => ["curriculum-tags", id] as const,

  // Audit
  auditLog: () => ["audit-log"] as const,

  // Seed
  seedBalances: (employeeId: string) => ["seed-balances", employeeId] as const,
} as const
