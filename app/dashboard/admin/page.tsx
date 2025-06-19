"use client"

import { AppProvider } from "@/lib/context/app-context"
import AdminDashboard from "@/components/admin/admin-dashboard"

export default function AdminDashboardPage() {
  return (
    <AppProvider>
      <AdminDashboard />
    </AppProvider>
  )
}
