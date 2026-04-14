import { createBrowserRouter, Navigate } from "react-router-dom"
import { ProtectedRoute } from "@/components/ProtectedRoute"
import { LoginPage } from "@/pages/LoginPage"
import { Appshell } from "@/components/Appshell"
import { CourseEditor } from "@/components/training/CourseEditor"
import { CourseDetailPage } from "@/pages/CourseDetailPage"
import { EmployeeTrainingPage } from "@/pages/EmployeeTrainingPage"
import { InstructorRoute } from "@/components/InstructorRoute"

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
        element: <Appshell />,
      },
      { path: "/training/courses/:courseId", element: <CourseDetailPage /> },

      {
        path: "/admin/courses/:courseId/edit",
        element: (
          <InstructorRoute>
            <CourseEditor />
          </InstructorRoute>
        ),
      },
    ],
  },

  // ── Fallback ──────────────────────────────────────────────────────────────
  {
    path: "*",
    element: <Navigate to="/" replace />,
  },
  {
    path: "/admin/employee/:employeeId/training",
    element: <EmployeeTrainingPage />,
  },
])
