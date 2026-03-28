import { Navigate, Outlet, useLocation } from "react-router-dom"
import { Loader2 } from "lucide-react"
import { useSession } from "@/lib/auth"

/**
 * Wrap any route with this to require authentication.
 * While the session is loading it shows a centered spinner
 * so there's no flash of the login page for already-logged-in users.
 */
export function ProtectedRoute() {
  const { session, isLoading } = useSession()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!session) {
    // Preserve the URL they were trying to visit so we can
    // redirect back after login
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <Outlet />
}
