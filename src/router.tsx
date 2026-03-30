import { createBrowserRouter, Navigate } from "react-router-dom"
import { ProtectedRoute } from "@/components/ProtectedRoute"
import { LoginPage } from "@/pages/LoginPage"
import { Appshell } from "@/components/Appshell"
export const router = createBrowserRouter([
  // ── Public ────────────────────────────────────────────────────s────────────
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
        element: <Appshell />,
      },
    ],
  },

  // ── Fallback ──────────────────────────────────────────────────────────────
  {
    path: "*",
    element: <Navigate to="/" replace />,
  },
])
