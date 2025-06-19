"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar } from "@/components/ui/calendar"
import TaskList from "@/components/task-list"
import TimeTable from "@/components/time-table"
import { ModeToggle } from "@/components/mode-toggle"
import { Button } from "@/components/ui/button"
import { GraduationCap, LogOut } from "lucide-react"
import DashboardSummary from "@/components/dashboard-summary"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/lib/context/auth-context"
import { useSharedData } from "@/lib/context/shared-data-context"
import NotificationBell from "@/components/notifications/notification-bell"
import {
  scheduleClassReminders,
  scheduleTaskReminders,
  checkForDueNotifications,
  notifyUpcomingDeadlines,
  checkClassSchedule,
} from "@/lib/services/notification-service"
import StudentNotices from "@/components/student/student-notices"
import NoticePopup from "@/components/notifications/notice-popup"

export default function StudentDashboard() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [isClient, setIsClient] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const { user, logout } = useAuth()
  const { tasks, timeTable, refreshTimeTable, refreshTasks } = useSharedData()
  const [activeTab, setActiveTab] = useState("tasks")

  useEffect(() => {
    setIsClient(true)

    // Check if user is logged in and is a student
    if (!user) {
      router.push("/login")
      return
    }

    if (user.role !== "student") {
      router.push("/login")
      return
    }

    // Check for tab in URL
    const tab = searchParams.get("tab")
    if (tab && (tab === "tasks" || tab === "timetable" || tab === "notices")) {
      setActiveTab(tab)
    }
  }, [user, router, searchParams])

  // Set up notifications
  useEffect(() => {
    if (user && tasks.length > 0 && timeTable.length > 0) {
      // Schedule reminders
      scheduleClassReminders(user.id, timeTable)
      scheduleTaskReminders(user.id, tasks)

      // Check for upcoming deadlines and send notification
      notifyUpcomingDeadlines(user.id)

      // Check for due notifications
      const checkNotifications = async () => {
        const dueNotifications = await checkForDueNotifications(user.id)

        // Show browser notifications if supported
        if (dueNotifications.length > 0 && "Notification" in window) {
          if (Notification.permission === "granted") {
            dueNotifications.forEach((notification) => {
              new Notification(notification.title, {
                body: notification.message,
                icon: "/favicon.ico",
              })
            })
          } else if (Notification.permission !== "denied") {
            Notification.requestPermission()
          }
        }

        // Check for classes starting soon or just ended
        await checkClassSchedule(user.id, timeTable)
      }

      checkNotifications()

      // Set up interval to check for notifications
      const interval = setInterval(checkNotifications, 60000) // Check every minute

      return () => clearInterval(interval)
    }
  }, [user, tasks, timeTable])

  const handleLogout = async () => {
    await logout()
  }

  const handleTabChange = (value: string) => {
    setActiveTab(value)
    router.push(`/dashboard/student?tab=${value}`, { scroll: false })
  }

  const handleRefresh = async () => {
    await Promise.all([refreshTasks(), refreshTimeTable(true)])
  }

  if (!isClient || !user) return null

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <GraduationCap className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">StudySync</h1>
            <p className="text-muted-foreground">Your College Task & Schedule Manager</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <NotificationBell />
          <ModeToggle />
          <Button variant="outline" onClick={handleLogout} className="gap-2">
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>

      <DashboardSummary selectedDate={selectedDate} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="tasks">Tasks</TabsTrigger>
              <TabsTrigger value="timetable">Time Table</TabsTrigger>
              <TabsTrigger value="notices">Notices</TabsTrigger>
            </TabsList>
            <TabsContent value="tasks" className="border rounded-lg p-4">
              <TaskList selectedDate={selectedDate} />
            </TabsContent>
            <TabsContent value="timetable" className="border rounded-lg p-4">
              <TimeTable selectedDate={selectedDate} />
            </TabsContent>
            <TabsContent value="notices" className="border rounded-lg p-4">
              <StudentNotices />
            </TabsContent>
          </Tabs>
        </div>

        <div className="border rounded-lg p-4">
          <h2 className="text-xl font-bold mb-4">Calendar</h2>
          <div className="flex justify-center">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              className="rounded-md border"
            />
          </div>

          <div className="mt-4 space-y-2">
            <h3 className="font-medium">
              Selected Day:{" "}
              {selectedDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
            </h3>
          </div>
        </div>
      </div>
      <NoticePopup />
    </div>
  )
}
