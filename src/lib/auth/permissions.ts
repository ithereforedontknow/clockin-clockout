import { useCurrentEmployee } from "@/lib/queries"

export type Permission =
  | "view_all_employees"
  | "manage_employees"
  | "approve_time_off"
  | "approve_profile_changes"
  | "approve_corrections"
  | "view_reports"
  | "manage_training"
  | "admin_full_access"
  | "view_staff_directory"

export function usePermissions() {
  const { data: employee } = useCurrentEmployee()
  const role = employee?.role ?? "employee"

  const hasPermission = (permission: Permission): boolean => {
    switch (permission) {
      case "view_all_employees":
      case "manage_employees":
      case "approve_time_off":
      case "approve_profile_changes":
      case "approve_corrections":
      case "view_reports":
      case "manage_training":
        return role === "employer" || role === "admin"

      case "admin_full_access":
        return role === "admin"

      case "view_staff_directory":
        return role === "employer" || role === "admin"

      default:
        return false
    }
  }

  return {
    hasPermission,
    role,
    employee,
    isAdmin: role === "admin",
    isEmployer: role === "employer",
    isEmployee: role === "employee",
  }
}
