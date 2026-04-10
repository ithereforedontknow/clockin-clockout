import { Navigate } from "react-router-dom"
import { useCurrentEmployee } from "@/lib/queries"
import { Loader2 } from "lucide-react"

export function InstructorRoute({ children }: { children: React.ReactNode }) {
  const { data: employee, isLoading } = useCurrentEmployee()

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (
    !employee ||
    (employee.role !== "admin" && employee.role !== "employer")
  ) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}
