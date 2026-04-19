import { createBrowserRouter, Navigate } from "react-router-dom"
import { AppShell } from "@/components/AppShell"
import { ProtectedRoute } from "@/components/ProtectedRoute"
import { LoginPage } from "@/pages/LoginPage"
import { CourseEditor } from "@/components/training/CourseEditor"
import { CourseDetailPage } from "@/tabs/CourseDetailPage" // Moved to tabs for consistency
import { EmployeeTrainingPage } from "@/tabs/EmployeeTrainingPage"
import { InstructorRoute } from "@/components/InstructorRoute"
import { ForgotPasswordPage } from "@/pages/ForgotPasswordPage"
import { ResetPasswordPage } from "@/pages/ResetPasswordPage"

export const router = createBrowserRouter([
  // Public routes
  { path: "/login", element: <LoginPage /> },
  { path: "/forgot-password", element: <ForgotPasswordPage /> },
  { path: "/reset-password", element: <ResetPasswordPage /> },

  // Protected routes
  {
    element: <ProtectedRoute />,
    children: [
      // Redirect root to dashboard
      { path: "/", element: <Navigate to="/home" replace /> },

      // The Shell handles all primary tabs via :tab
      { path: "/:tab", element: <AppShell /> },

      // Training Deep Links
      { path: "/training/courses/:courseId", element: <CourseDetailPage /> },

      // Admin Deep Links
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

  // Global Fallback
  { path: "*", element: <Navigate to="/home" replace /> },
])
