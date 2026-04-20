import { Navigate } from "react-router-dom"
import { useCurrentEmployee } from "@/lib/queries"
import { PageSkeleton } from "./PageSkeleton"

export function InstructorRoute({ children }: { children: React.ReactNode }) {
  const { data: employee, isLoading } = useCurrentEmployee()

  if (isLoading) return <PageSkeleton />

  if (
    !employee ||
    (employee.role !== "admin" && employee.role !== "employer")
  ) {
    return <Navigate to="/home" replace />
  }

  return <>{children}</>
}
