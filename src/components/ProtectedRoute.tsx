import { Navigate, Outlet, useLocation } from "react-router-dom"
import { useSession } from "@/lib/auth"
import { PageSkeleton } from "./PageSkeleton"

export function ProtectedRoute() {
  const { session, isLoading } = useSession()
  const location = useLocation()

  if (isLoading)
    return (
      <div className="flex h-screen w-screen items-center justify-center p-12">
        <PageSkeleton />
      </div>
    )

  if (!session) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <Outlet />
}
