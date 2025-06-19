"use client"

import { AppProvider } from "@/lib/context/app-context"
import StudentDashboard from "@/components/student/student-dashboard"

export default function StudentDashboardPage() {
  return (
    <AppProvider>
      <StudentDashboard />
    </AppProvider>
  )
}
