import { createBrowserRouter, Navigate } from "react-router-dom"
import { AppShell } from "@/components/AppShell"
import { ProtectedRoute } from "@/components/ProtectedRoute"
import { LoginPage } from "@/pages/LoginPage"
import { CourseEditor } from "@/components/training/CourseEditor"
import { CourseDetailPage } from "@/pages/CourseDetailPage"
import { EmployeeTrainingPage } from "@/pages/EmployeeTrainingPage"
import { InstructorRoute } from "@/components/InstructorRoute"
import { ForgotPasswordPage } from "@/pages/ForgotPasswordPage"
import { ResetPasswordPage } from "@/pages/ResetPasswordPage"

export const router = createBrowserRouter([
  // Public routes
  { path: "/login", element: <LoginPage /> },
  { path: "/forgot-password", element: <ForgotPasswordPage /> },
  { path: "/reset-password", element: <ResetPasswordPage /> },

  // Protected routes - with optional tab parameter
  {
    element: <ProtectedRoute />,
    children: [
      // Root routes with optional tab
      { path: "/", element: <AppShell /> },
      { path: "/:tab", element: <AppShell /> },

      // Training routes
      { path: "/training/courses/:courseId", element: <CourseDetailPage /> },
      {
        path: "/admin/courses/:courseId/edit",
        element: (
          <InstructorRoute>
            <CourseEditor />
          </InstructorRoute>
        ),
      },
      {
        path: "/admin/employee/:employeeId/training",
        element: <EmployeeTrainingPage />,
      },
    ],
  },

  // Fallback
  { path: "*", element: <Navigate to="/" replace /> },
])
