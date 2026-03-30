import { createBrowserRouter, Navigate } from "react-router-dom"
import { AppShell } from "@/components/AppShell"
import { ProtectedRoute } from "@/components/ProtectedRoute"
import { LoginPage } from "@/pages/LoginPage"
export const router = createBrowserRouter([
  // ── Public ────────────────────────────────────────────────────────────────
  {
    path: "/login",
    element: <LoginPage />,
  },

  // ── Catch removed auth routes — redirect to login ─────────────────────────
  {
    path: "/forgot-password",
    element: <Navigate to="/login" replace />,
  },
  {
    path: "/reset-password",
    element: <Navigate to="/login" replace />,
  },

  // ── Protected ─────────────────────────────────────────────────────────────
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: "/",
        element: <AppShell />,
      },
    ],
  },

  // ── Fallback ──────────────────────────────────────────────────────────────
  {
    path: "*",
    element: <Navigate to="/" replace />,
  },
])
