export const keys = {
  // Employees
  currentEmployee: () => ["current-employee"] as const,
  employee: (id: string) => ["employee", id] as const,
  employees: () => ["employees"] as const,
  employeesAll: () => [...keys.employees(), "all"] as const,

  // Attendance
  todayClock: (id: string) => ["today-clock", id] as const,
  clockHistory: (id: string, week: string) =>
    ["clock-history", id, week] as const,
  allClockEntries: (week: string) => ["all-clock-entries", week] as const,

  // Time off
  balances: (id: string) => ["balances", id] as const,
  timeOffHistory: (id: string) => ["timeoff-history", id] as const,
  timeOffRequests: () => ["time-off-requests"] as const,
  whosOut: (d: string) => ["whos-out", d] as const,
  holidays: () => ["holidays"] as const,
  inboxSent: (id: string) => ["inbox-sent", id] as const,

  // Training
  curriculums: () => ["curriculums"] as const,
  curriculum: (id: string) => ["curriculum", id] as const,
  myTraining: () => ["my-training"] as const,
  allTraining: () => ["all-training"] as const,
  courseProgress: (id: string) => ["course-progress", id] as const,
  certifications: (userId: string) => ["certifications", userId] as const,

  // Notifications
  notifications: (id: string) => ["notifications", id] as const,

  // Admin
  companySettings: () => ["company-settings"] as const,
  departments: () => ["departments"] as const,
  announcements: () => ["announcements"] as const,
  liveStatus: () => ["live-clock-status"] as const,
  corrections: () => ["corrections"] as const,
} as const
