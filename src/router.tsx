import { createBrowserRouter } from "react-router-dom"
import { ProtectedRoute } from "@/components/ProtectedRoute"
import { LoginPage } from "@/pages/LoginPage"
import { ForgotPasswordPage } from "@/pages/ForgotPasswordPage"
import { ResetPasswordPage } from "@/pages/ResetPasswordPage"
import { AppShell } from "@/components/AppShell"

export const router = createBrowserRouter([
  // ── Public routes ──────────────────────────────────────────────────────────
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/forgot-password",
    element: <ForgotPasswordPage />,
  },
  {
    path: "/reset-password",
    element: <ResetPasswordPage />,
  },

  // ── Protected routes ───────────────────────────────────────────────────────
  // ProtectedRoute renders <Outlet /> when authenticated,
  // or redirects to /login (preserving the attempted URL) when not.
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: "/",
        element: <AppShell />,
      },
    ],
  },
])
